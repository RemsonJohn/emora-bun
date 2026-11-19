import Redis from "ioredis"
import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * Fixed-window rate limit per client IP for one route group. Uses Redis when
 * REDIS_URL is set (shared across processes), otherwise an in-process counter.
 * A captcha check can be added in front of the same routes once a provider is
 * chosen.
 */
type Options = { name: string; limit: number; windowSeconds: number }

let redis: Redis | undefined
function redisClient() {
  if (!process.env.REDIS_URL) return undefined
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 1, connectTimeout: 3000, lazyConnect: true })
    redis.on("error", () => {})
  }
  return redis
}

const memory = new Map<string, { count: number; resetAt: number }>()

function countInMemory(key: string, windowSeconds: number) {
  const now = Date.now()
  const entry = memory.get(key)
  if (!entry || entry.resetAt <= now) {
    memory.set(key, { count: 1, resetAt: now + windowSeconds * 1000 })
    if (memory.size > 10000) {
      for (const [k, v] of memory) if (v.resetAt <= now) memory.delete(k)
    }
    return 1
  }
  entry.count += 1
  return entry.count
}

async function countInRedis(client: Redis, key: string, windowSeconds: number) {
  if (client.status === "wait" || client.status === "end") await client.connect()
  const [[, count]] = (await client.multi().incr(key).expire(key, windowSeconds, "NX").exec()) as [[unknown, number]]
  return Number(count)
}

export function rateLimit({ name, limit, windowSeconds }: Options) {
  return async (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
    const ip = req.ip || req.socket?.remoteAddress || "unknown"
    const key = `emora:rate:${process.env.EMORA_SHOP ?? "shop"}:${name}:${ip}`
    let count: number
    const client = redisClient()
    try {
      count = client ? await countInRedis(client, key, windowSeconds) : countInMemory(key, windowSeconds)
    } catch {
      count = countInMemory(key, windowSeconds)
    }
    if (count > limit) {
      res.setHeader("Retry-After", String(windowSeconds))
      return res.status(429).json({ message: "Too many requests. Please wait a moment and try again." })
    }
    next()
  }
}
