import crypto from "crypto"
import { createStep, createWorkflow, StepResponse, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, MedusaError, QueryContext } from "@medusajs/framework/utils"
import { addToCartWorkflow } from "@medusajs/medusa/core-flows"
import { discountedPrice, readDiscountSettings, readLookSlots } from "../lib/complete-the-look"

export type AddLookToCartInput = {
  cart_id: string
  main_variant_id: string
  quantity: number
  piece_variant_ids: string[]
}

type VariantRow = {
  id: string
  product?: { id: string; handle: string; title: string; metadata?: Record<string, unknown> | null } | null
  calculated_price?: { calculated_amount?: number | null } | null
}

/**
 * Builds the cart lines for a Complete the Look set: the kurti plus the chosen
 * matching pieces, sharing one set key. Only pieces listed on the kurti are
 * accepted, one per slot. When the discount is switched on (store and kurti),
 * the pieces get the discounted price and are excluded from other promotions.
 */
export const resolveLookItemsStep = createStep(
  "resolve-look-items",
  async (input: AddLookToCartInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const { data: carts } = await query.graph({
      entity: "cart",
      fields: ["id", "region_id", "currency_code", "completed_at"],
      filters: { id: input.cart_id },
    })
    const cart = carts[0]
    if (!cart || cart.completed_at) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Cart not found")
    }

    const ids = [input.main_variant_id, ...input.piece_variant_ids]
    const { data: variants } = (await query.graph({
      entity: "variant",
      fields: ["id", "product.id", "product.handle", "product.title", "product.metadata", "calculated_price.*"],
      filters: { id: ids },
      context: {
        calculated_price: QueryContext({ region_id: cart.region_id, currency_code: cart.currency_code }),
      },
    })) as { data: VariantRow[] }
    const byId = new Map(variants.map((variant) => [variant.id, variant]))

    const main = byId.get(input.main_variant_id)
    const slots = readLookSlots(main?.product?.metadata)
    if (!main?.product || slots.length === 0) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "This product does not offer Complete the Look")
    }

    const usedRoles = new Set<string>()
    const pieces = input.piece_variant_ids.map((variantId) => {
      const piece = byId.get(variantId)
      const slot = piece?.product ? slots.find((s) => s.options.includes(piece.product!.handle)) : undefined
      if (!piece?.product || !slot) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, "A chosen piece does not belong to this look")
      }
      if (usedRoles.has(slot.role)) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, `Choose only one ${slot.role} for this look`)
      }
      usedRoles.add(slot.role)
      return { piece, role: slot.role }
    })

    const { data: stores } = await query.graph({ entity: "store", fields: ["id", "metadata"] })
    const discount = readDiscountSettings(stores[0]?.metadata, main.product.metadata)

    const setKey = crypto.randomUUID()
    const items = [
      {
        variant_id: main.id,
        quantity: input.quantity,
        metadata: { set_key: setKey, set_role: "main" },
      },
      ...pieces.map(({ piece, role }) => {
        const price = piece.calculated_price?.calculated_amount
        const discounted = discount.enabled && typeof price === "number"
        return {
          variant_id: piece.id,
          quantity: input.quantity,
          metadata: {
            set_key: setKey,
            set_of: main.product!.id,
            set_role: role,
            ...(discounted ? { look_discount: { type: discount.type, value: discount.value, original_price: price } } : {}),
          },
          ...(discounted ? { unit_price: discountedPrice(price, discount), is_discountable: false } : {}),
        }
      }),
    ]
    return new StepResponse({ items, set_key: setKey })
  }
)

export const addLookToCartWorkflow = createWorkflow("add-look-to-cart", (input: AddLookToCartInput) => {
  const resolved = resolveLookItemsStep(input)
  const addInput = transform({ input, resolved }, ({ input, resolved }) => ({
    cart_id: input.cart_id,
    items: resolved.items,
  }))
  addToCartWorkflow.runAsStep({ input: addInput })
  return new WorkflowResponse({ set_key: resolved.set_key })
})
