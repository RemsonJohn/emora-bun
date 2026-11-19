import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type OrderRow = {
  id: string
  created_at: string | Date
  total: number | string
  status: string
  metadata?: Record<string, unknown> | null
  payment_collections?: ({ status?: string; payment_sessions?: ({ provider_id?: string } | null)[] } | null)[] | null
}

/**
 * Order figures for the Emora platform: counts and rupee totals only, never
 * customer details. `days` is 1 to 365 (default 30).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365)
  const since = new Date(Date.now() - days * 86400 * 1000)

  const orders: OrderRow[] = []
  const pageSize = 500
  for (let skip = 0; ; skip += pageSize) {
    const { data, metadata } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "created_at",
        "total",
        "status",
        "metadata",
        "payment_collections.status",
        "payment_collections.payment_sessions.provider_id",
      ],
      filters: { created_at: { $gte: since } },
      pagination: { take: pageSize, skip, order: { created_at: "DESC" } },
    })
    orders.push(...(data as unknown as OrderRow[]))
    if (orders.length >= (metadata?.count ?? 0) || data.length === 0) break
  }

  const live = orders.filter((o) => o.status !== "canceled")
  const provider = (o: OrderRow) => o.payment_collections?.[0]?.payment_sessions?.[0]?.provider_id ?? ""
  const paymentStatus = (o: OrderRow) => o.payment_collections?.[0]?.status ?? ""
  const sum = (list: OrderRow[]) => Math.round(list.reduce((n, o) => n + Number(o.total ?? 0), 0) * 100) / 100

  const { metadata: enquiryMeta } = await query.graph({
    entity: "enquiry",
    fields: ["id"],
    filters: { status: "new" },
    pagination: { take: 1, skip: 0 },
  })

  return res.json({
    currency: "inr",
    days,
    orders: live.length,
    canceled: orders.length - live.length,
    revenue_total: sum(live),
    revenue_collected: sum(live.filter((o) => paymentStatus(o) === "completed")),
    cod_to_collect: sum(live.filter((o) => provider(o) === "pp_manual_cod" && paymentStatus(o) !== "completed")),
    awaiting_review: live.filter((o) => o.metadata?.emora_review_required && !o.metadata?.emora_review).length,
    open_enquiries: enquiryMeta?.count ?? 0,
    last_order_at: orders[0]?.created_at ?? null,
  })
}
