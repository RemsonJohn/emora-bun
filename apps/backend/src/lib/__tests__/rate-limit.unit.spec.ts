import { clientIp, rateLimit } from "../rate-limit"

const request = (headers: Record<string, string> = {}, ip = "10.0.0.1") => ({ headers, ip, socket: {} }) as never

describe("rate limit", () => {
  const original = process.env.STOREFRONT_SHARED_SECRET
  afterEach(() => {
    process.env.STOREFRONT_SHARED_SECRET = original
  })

  it("trusts the forwarded shopper IP only with the shared secret", () => {
    process.env.STOREFRONT_SHARED_SECRET = "s3cret"
    expect(clientIp(request({ "x-emora-storefront-key": "s3cret", "x-emora-client-ip": "1.2.3.4" }))).toBe("1.2.3.4")
    expect(clientIp(request({ "x-emora-storefront-key": "wrong!", "x-emora-client-ip": "1.2.3.4" }))).toBe("10.0.0.1")
    expect(clientIp(request({ "x-emora-client-ip": "1.2.3.4" }))).toBe("10.0.0.1")
  })

  it("returns 429 after the limit", async () => {
    delete process.env.REDIS_URL
    const limiter = rateLimit({ name: `test-${Date.now()}`, limit: 2, windowSeconds: 60 })
    const statuses: number[] = []
    for (let i = 0; i < 3; i++) {
      let status = 200
      const res = { setHeader: () => undefined, status: (s: number) => { status = s; return res }, json: () => res }
      await limiter(request(), res as never, () => undefined)
      statuses.push(status)
    }
    expect(statuses).toEqual([200, 200, 429])
  })
})
