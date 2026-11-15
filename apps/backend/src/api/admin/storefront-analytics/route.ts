import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  analyticsKey,
  readyAnalyticsRedis,
  stages,
} from "../../../lib/storefront-analytics"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
) {
  const days = Number(req.query.days || 7)
  if (![1, 7, 30].includes(days))
    return res.status(400).json({ message: "Invalid reporting period" })
  try {
    const redis = await readyAnalyticsRedis()
    const analyticsIndex = analyticsKey("sessions")
    const now = Date.now()
    const start = now - days * 86400000
    const end = now - 30 * 60000
    // Most recently inactive first; return an explicit limit if the report is sampled.
    const total = await redis.zcount(analyticsIndex, start, end)
    const ids = await redis.zrevrangebyscore(
      analyticsIndex,
      end,
      start,
      "LIMIT",
      0,
      5000,
    )
    const pipeline = redis.pipeline()
    ids.forEach((id) => pipeline.hget(analyticsKey(`session:${id}`), "stage"))
    const values = ids.length ? await pipeline.exec() : []
    const counts = Object.fromEntries(
      stages.map((stage) => [stage, 0]),
    ) as Record<(typeof stages)[number], number>
    for (const [error, value] of values || []) {
      if (error) throw error
      if (
        typeof value === "string" &&
        stages.includes(value as (typeof stages)[number])
      )
        counts[value as (typeof stages)[number]]++
    }
    const observed = Object.values(counts).reduce(
      (sum, count) => sum + count,
      0,
    )
    return res.json({
      days,
      counts,
      observed,
      total,
      truncated: total > ids.length || observed !== ids.length,
      inactivity_minutes: 30,
    })
  } catch {
    return res
      .status(503)
      .json({
        message:
          "Storefront analytics are unavailable. Check Redis configuration.",
      })
  }
}
