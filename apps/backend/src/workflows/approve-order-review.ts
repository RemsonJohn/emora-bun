import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { updateOrderWorkflow } from "@medusajs/medusa/core-flows"

type Input = { order_id: string; user_id: string }
const approveOrderReviewStep = createStep("approve-order-review", async (input: Input, { container }) => {
  const lock = container.resolve(Modules.LOCKING)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const review = await lock.execute(`emora-order-review:${input.order_id}`, async () => {
    const { data } = await query.graph({ entity: "order", fields: ["id", "status", "metadata"], filters: { id: input.order_id } })
    const order = data[0]
    if (!order) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Order not found")
    if (order.status === "canceled") throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "A canceled order cannot be approved")
    const existing = order.metadata?.emora_review
    if (existing) return existing
    const approval = { approved_by: input.user_id, approved_at: new Date().toISOString() }
    await updateOrderWorkflow(container).run({ input: { id: input.order_id, user_id: input.user_id, metadata: { ...order.metadata, emora_review: approval } } })
    return approval
  }, { timeout: 5 })
  return new StepResponse(review)
})

export const approveOrderReviewWorkflow = createWorkflow("approve-order-review", (input: Input) => {
  return new WorkflowResponse(approveOrderReviewStep(input))
})
