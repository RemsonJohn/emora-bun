import { createHash } from "node:crypto"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import {
  analyticsKey,
  readyAnalyticsRedis,
  retentionSeconds,
  stages,
} from "../../../lib/storefront-analytics"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = req.body as { session_id?: unknown; stage?: unknown } | undefined
  if (
    !body ||
    typeof body.session_id !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      body.session_id,
    ) ||
    typeof body.stage !== "string" ||
    !stages.includes(body.stage as (typeof stages)[number])
  ) {
    return res.status(400).json({ message: "Invalid analytics event" })
  }
  try {
    const redis = await readyAnalyticsRedis()
    // Only a short-lived hash is retained for throttling, never the IP address.
    const clientHash = createHash("sha256")
      .update(req.ip || "unknown")
      .digest("hex")
    const rateKey = analyticsKey(`rate:${clientHash}`)
    const count = await redis.incr(rateKey)
    if (count === 1) await redis.expire(rateKey, 60)
    if (count > 300)
      return res.status(429).json({ message: "Too many analytics events" })
    const now = Date.now()
    const key = analyticsKey(`session:${body.session_id}`)
    const analyticsIndex = analyticsKey("sessions")
    const writes = await redis
      .multi()
      .hset(key, { stage: body.stage, last_seen: String(now) })
      .expire(key, retentionSeconds)
      .zadd(analyticsIndex, now, body.session_id)
      .zremrangebyscore(analyticsIndex, 0, now - retentionSeconds * 1000)
      .expire(analyticsIndex, retentionSeconds)
      .exec()
    if (!writes || writes.some(([error]) => error))
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Analytics write failed")
    return res.status(202).json({ accepted: true })
  } catch {
    return res.status(503).json({ message: "Analytics storage unavailable" })
  }
}
