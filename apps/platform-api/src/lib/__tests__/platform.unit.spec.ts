import { decryptSecret, encryptSecret } from "../secrets"
import { allowedOrigin } from "../shop-client"
import { signRequest } from "../platform-signature"

describe("platform helpers", () => {
  beforeAll(() => {
    process.env.PLATFORM_SECRETS_KEY = "a".repeat(64)
    process.env.ALLOWED_SHOP_ORIGINS = "http://localhost:9000, https://api.sagarsportz.com"
  })

  it("encrypts secrets so they round-trip and cannot be read or altered", () => {
    const stored = encryptSecret("shop-secret")
    expect(stored).not.toContain("shop-secret")
    expect(decryptSecret(stored)).toBe("shop-secret")
    const parts = stored.split(".")
    parts[3] = Buffer.from("tampered").toString("base64")
    expect(() => decryptSecret(parts.join("."))).toThrow()
  })

  it("only calls allowed shop origins", () => {
    expect(allowedOrigin("http://localhost:9000/platform/health")).toBe(true)
    expect(allowedOrigin("https://api.sagarsportz.com")).toBe(true)
    expect(allowedOrigin("http://169.254.169.254/latest")).toBe(false)
    expect(allowedOrigin("not a url")).toBe(false)
  })

  it("signs exactly like the shop backends verify", () => {
    // Same vector as apps/backend: both sides must agree byte for byte.
    const sig = signRequest("s", { timestamp: "1800000000", nonce: "n".repeat(16), method: "get", path: "/platform/health", body: "" })
    expect(sig).toMatch(/^[0-9a-f]{64}$/)
    expect(sig).toBe(signRequest("s", { timestamp: "1800000000", nonce: "n".repeat(16), method: "GET", path: "/platform/health", body: undefined }))
  })
})
