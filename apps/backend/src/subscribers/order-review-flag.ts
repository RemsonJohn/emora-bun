import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateOrderWorkflow } from "@medusajs/medusa/core-flows"
import { productRequiresApproval } from "../lib/customisation"

/**
 * Marks an order for staff review when it contains customised lines whose
 * product needs approval (the default for customisable products). Staff then
 * approve it with POST /admin/orders/:id/approve before production starts.
 */
export default async function orderReviewFlag({ event, container }: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "order",
    fields: ["id", "metadata", "items.id", "items.metadata", "items.product_id"],
    filters: { id: event.data.id },
  })
  const order = data[0]
  if (!order) return

  const customised = (order.items ?? []).filter((item) => item?.metadata?.customisation)
  if (!customised.length) return

  const productIds = [...new Set(customised.map((item) => item!.product_id).filter(Boolean))] as string[]
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "metadata"],
    filters: { id: productIds },
  })
  const needsReview = products.some((product) => productRequiresApproval(product.metadata))
  if (!needsReview || order.metadata?.emora_review_required) return

  await updateOrderWorkflow(container).run({
    input: {
      id: order.id,
      user_id: "system",
      metadata: { ...(order.metadata ?? {}), emora_review_required: true },
    },
  })
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
