import Redis from "ioredis"
import { createHash } from "node:crypto"
import { MedusaError } from "@medusajs/framework/utils"

export const stages = [
  "storefront",
  "product",
  "cart",
  "checkout",
  "checkout_address",
  "checkout_delivery",
  "checkout_payment",
  "checkout_review",
  "confirmation",
] as const
export type Stage = (typeof stages)[number]
function namespace() {
  const identity = process.env.ANALYTICS_NAMESPACE || process.env.DATABASE_URL
  if (!identity)
    throw new MedusaError(MedusaError.Types.INVALID_DATA,
      "ANALYTICS_NAMESPACE or DATABASE_URL is required for storefront analytics",
    )
  return createHash("sha256").update(identity).digest("hex").slice(0, 24)
}
export function analyticsKey(suffix: string) {
  return `emora:storefront-analytics:${namespace()}:${suffix}`
}
export const retentionSeconds = 31 * 86400

let client: Redis | undefined
export function analyticsRedis() {
  if (!process.env.REDIS_URL)
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "REDIS_URL is required for storefront analytics")
  if (!client) {
    client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      lazyConnect: true,
    })
    client.on("error", () => {})
  }
  return client
}

export async function readyAnalyticsRedis() {
  const redis = analyticsRedis()
  if (redis.status === "wait" || redis.status === "end") await redis.connect()
  return redis
}
