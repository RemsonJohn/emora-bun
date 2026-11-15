import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { approveOrderReviewWorkflow } from "../../../../../workflows/approve-order-review"

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const { result } = await approveOrderReviewWorkflow(req.scope).run({ input: { order_id: req.params.id, user_id: req.auth_context.actor_id } })
  return res.json({ review: result })
}
