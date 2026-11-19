import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/** Lists enquiries, newest first. Optional ?status=new|quoted|won|lost. */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const statuses = ["new", "quoted", "won", "lost"] as const
  type Status = (typeof statuses)[number]
  const status = statuses.find((value) => value === req.query.status) as Status | undefined
  const limit = Math.min(Number(req.query.limit) || 50, 200)
  const offset = Math.max(Number(req.query.offset) || 0, 0)
  const { data, metadata } = await query.graph({
    entity: "enquiry",
    fields: ["*"],
    filters: status ? { status } : {},
    pagination: { take: limit, skip: offset, order: { created_at: "DESC" } },
  })
  return res.json({ enquiries: data, count: metadata?.count ?? data.length, limit, offset })
}
