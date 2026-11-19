import { createHash, createHmac, timingSafeEqual } from "node:crypto"

/**
 * Requests from the Emora platform to a shop backend are signed with the
 * shop's PLATFORM_SHARED_SECRET (HMAC-SHA256). The signature covers a
 * timestamp, a one-time nonce, the method, the path with query, and a hash of
 * the raw body, so a captured request cannot be changed or replayed.
 */
export const SIGNATURE_WINDOW_SECONDS = 300

export function canonicalRequest(input: {
  timestamp: string
  nonce: string
  method: string
  path: string
  body: string | Buffer | undefined
}) {
  const bodyHash = createHash("sha256").update(input.body ?? "").digest("hex")
  return [input.timestamp, input.nonce, input.method.toUpperCase(), input.path, bodyHash].join("\n")
}

export function signRequest(secret: string, input: Parameters<typeof canonicalRequest>[0]) {
  return createHmac("sha256", secret).update(canonicalRequest(input)).digest("hex")
}

export function signaturesMatch(expected: string, received: string) {
  if (!/^[0-9a-f]{64}$/.test(received)) return false
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(received, "hex"))
}

/** Nonces seen within the signature window. One backend process per shop, so memory is enough. */
const seen = new Map<string, number>()

export function rememberNonce(nonce: string, nowMs = Date.now()) {
  for (const [key, expires] of seen) if (expires <= nowMs) seen.delete(key)
  if (seen.has(nonce)) return false
  seen.set(nonce, nowMs + SIGNATURE_WINDOW_SECONDS * 1000)
  return true
}
