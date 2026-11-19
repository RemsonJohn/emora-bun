import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { productAllowsCustomisation, storeLineItemMetadataSchema } from "../../lib/customisation"
import { isFeatureEnabled } from "../../lib/features"

/**
 * Guards the metadata a shopper can put on cart lines through the standard
 * cart routes: only a valid customisation, only on customisable products.
 * Complete the Look keys are set by the backend alone (POST /store/carts/:id/looks),
 * and lines that belong to a look cannot have their metadata changed.
 */
export async function validateLineItemMetadata(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  const body = (req.body ?? {}) as { metadata?: unknown; variant_id?: unknown }
  if (body.metadata === undefined || body.metadata === null) return next()

  const parsed = storeLineItemMetadataSchema.safeParse(body.metadata)
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid line item details", issues: parsed.error.issues.map((i) => i.message) })
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  let productMetadata: Record<string, unknown> | null | undefined
  if (req.params.line_id) {
    const { data } = await query.graph({
      entity: "line_item",
      fields: ["id", "metadata", "product.metadata"],
      filters: { id: req.params.line_id },
    })
    const line = data[0] as { metadata?: Record<string, unknown> | null; product?: { metadata?: Record<string, unknown> | null } } | undefined
    if (line?.metadata?.set_key) {
      return res.status(400).json({ message: "Items in a look cannot be changed this way" })
    }
    productMetadata = line?.product?.metadata
  } else if (typeof body.variant_id === "string") {
    const { data } = await query.graph({
      entity: "variant",
      fields: ["id", "product.metadata"],
      filters: { id: body.variant_id },
    })
    productMetadata = (data[0] as { product?: { metadata?: Record<string, unknown> | null } } | undefined)?.product?.metadata
  }

  if (parsed.data.customisation && !(await isFeatureEnabled(req.scope, "customisation"))) {
    return res.status(400).json({ message: "Customisation is not available in this shop" })
  }
  if (parsed.data.customisation && !productAllowsCustomisation(productMetadata)) {
    return res.status(400).json({ message: "This product cannot be customised" })
  }
  req.body = { ...(req.body as object), metadata: parsed.data }
  next()
}
