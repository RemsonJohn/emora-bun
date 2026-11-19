import { readFeatures } from "../features"
import { signRequest } from "../platform-signature"
import { verifyPlatformRequest } from "../../api/platform/verify-platform-request"

const secret = "platform-test-secret"

function call(headers: Record<string, string>, method = "GET", path = "/platform/health", rawBody?: string) {
  const result = { status: 200, passed: false }
  const req = { method, originalUrl: path, headers, rawBody }
  const res = {
    status: (s: number) => {
      result.status = s
      return res
    },
    json: () => res,
  }
  verifyPlatformRequest(req as never, res as never, () => {
    result.passed = true
  })
  return result
}

function signed(nonce: string, method = "GET", path = "/platform/health", body = "", timestamp = String(Math.floor(Date.now() / 1000))) {
  return {
    "x-emora-timestamp": timestamp,
    "x-emora-nonce": nonce,
    "x-emora-signature": signRequest(secret, { timestamp, nonce, method, path, body }),
  }
}

describe("platform request signing", () => {
  const original = process.env.PLATFORM_SHARED_SECRET
  beforeEach(() => {
    process.env.PLATFORM_SHARED_SECRET = secret
  })
  afterAll(() => {
    process.env.PLATFORM_SHARED_SECRET = original
  })

  it("accepts a correctly signed request once", () => {
    const headers = signed("nonce-aaaaaaaaaaaaaaaa")
    expect(call(headers).passed).toBe(true)
    expect(call(headers).status).toBe(401)
  })

  it("rejects a changed path, body or method", () => {
    expect(call(signed("nonce-bbbbbbbbbbbbbbbb"), "GET", "/platform/summary").status).toBe(401)
    const body = JSON.stringify({ features: { bulk_orders: false } })
    const headers = signed("nonce-cccccccccccccccc", "POST", "/platform/features", body)
    expect(call(headers, "POST", "/platform/features", JSON.stringify({ features: { bulk_orders: true } })).status).toBe(401)
  })

  it("rejects old timestamps and missing configuration", () => {
    const old = String(Math.floor(Date.now() / 1000) - 3600)
    expect(call(signed("nonce-dddddddddddddddd", "GET", "/platform/health", "", old)).status).toBe(401)
    delete process.env.PLATFORM_SHARED_SECRET
    expect(call(signed("nonce-eeeeeeeeeeeeeeee")).status).toBe(503)
  })
})

describe("feature switches", () => {
  it("treats features that were never set as on", () => {
    expect(readFeatures(undefined).complete_the_look).toBe(true)
    expect(readFeatures({ emora_features: { complete_the_look: false } }).complete_the_look).toBe(false)
    expect(readFeatures({ emora_features: { complete_the_look: false } }).bulk_orders).toBe(true)
  })
})
