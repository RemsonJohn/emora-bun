import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { randomUUID } from "node:crypto"
import { GET } from "../apps/backend/src/api/admin/storefront-analytics/route"
import { POST } from "../apps/backend/src/api/store/storefront-analytics/route"
import { analyticsKey, readyAnalyticsRedis } from "../apps/backend/src/lib/storefront-analytics"

process.env.REDIS_URL = "redis://127.0.0.1:6379"
process.env.ANALYTICS_NAMESPACE = `test-${randomUUID()}`

function response() {
  const result = { code: 200, body: null as unknown }
  const res = {
    status(code: number) {
      result.code = code
      return res
    },
    json(body: unknown) {
      result.body = body
      return res
    },
  }
  return { res, result }
}
const session = randomUUID()

describe("storefront analytics", () => {
  beforeAll(async () => {
    await readyAnalyticsRedis()
  })
  afterAll(async () => {
    const redis = await readyAnalyticsRedis()
    const keys = await redis.keys(analyticsKey("*"))
    if (keys.length) await redis.del(...keys)
    redis.disconnect()
  })
  test("rejects malformed and arbitrary tracking data", async () => {
    const { res, result } = response()
    await POST(
      {
        body: { session_id: "bad", stage: "email@example.com" },
        ip: "127.0.0.1",
      } as never,
      res as never,
    )
    expect(result.code).toBe(400)
  })
  test("records only the latest stage and reports inactive sessions", async () => {
    for (const stage of ["product", "checkout_payment"]) {
      const { res, result } = response()
      await POST(
        { body: { session_id: session, stage }, ip: "127.0.0.1" } as never,
        res as never,
      )
      expect(result.code).toBe(202)
    }
    const redis = await readyAnalyticsRedis()
    let output = response()
    await GET({ query: { days: "7" } } as never, output.res as never)
    expect((output.result.body as { observed: number }).observed).toBe(0)
    await redis.zadd(analyticsKey("sessions"), Date.now() - 31 * 60000, session)
    output = response()
    await GET({ query: { days: "7" } } as never, output.res as never)
    expect(output.result.body).toMatchObject({
      observed: 1,
      counts: { checkout_payment: 1, product: 0 },
      truncated: false,
    })
    expect(await redis.hgetall(analyticsKey(`session:${session}`))).toEqual({
      stage: "checkout_payment",
      last_seen: expect.any(String),
    })
  })
})
