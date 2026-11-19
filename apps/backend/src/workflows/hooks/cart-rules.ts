import { completeCartWorkflow, updateCartPromotionsWorkflow } from "@medusajs/medusa/core-flows"
import { ContainerRegistrationKeys, MedusaError, PromotionActions } from "@medusajs/framework/utils"
import { findLookProblems } from "../../lib/complete-the-look"

// Complete the Look: a matching piece is only sold with its kurti, and a
// set-only piece never on its own. Checked again here because cart lines can
// be removed or changed after the look was added.
completeCartWorkflow.hooks.validate(async ({ cart }, { container }) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "cart",
    fields: ["id", "items.id", "items.title", "items.quantity", "items.metadata", "items.product.metadata"],
    filters: { id: cart.id },
  })
  const problems = findLookProblems((data[0]?.items ?? []) as Parameters<typeof findLookProblems>[0])
  if (problems.length) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, problems.join(". "))
  }
})

// A discounted look does not combine with promotion codes.
updateCartPromotionsWorkflow.hooks.validate(async ({ input, cart }) => {
  const action = input.action ?? PromotionActions.ADD
  const codes = input.promo_codes ?? []
  if (action === PromotionActions.REMOVE || codes.length === 0) return
  const items = (cart as { items?: { metadata?: Record<string, unknown> | null }[] }).items ?? []
  if (items.some((item) => item.metadata?.look_discount)) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Promotion codes cannot be combined with a Complete the Look discount"
    )
  }
})
