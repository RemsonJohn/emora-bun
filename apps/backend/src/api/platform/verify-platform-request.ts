import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  SIGNATURE_WINDOW_SECONDS,
  rememberNonce,
  signRequest,
  signaturesMatch,
} from "../../lib/platform-signature"

/**
 * Lets only the Emora platform call /platform/* on this shop's backend.
 * Disabled (503) unless PLATFORM_SHARED_SECRET is set for this shop.
 */
export function verifyPlatformRequest(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  const secret = process.env.PLATFORM_SHARED_SECRET
  if (!secret) {
    return res.status(503).json({ message: "Platform access is not configured for this shop" })
  }
  const header = (name: string) => {
    const value = req.headers[name]
    return typeof value === "string" ? value : ""
  }
  const timestamp = header("x-emora-timestamp")
  const nonce = header("x-emora-nonce")
  const signature = header("x-emora-signature")
  const now = Math.floor(Date.now() / 1000)

  if (!/^\d{10}$/.test(timestamp) || Math.abs(now - Number(timestamp)) > SIGNATURE_WINDOW_SECONDS) {
    return res.status(401).json({ message: "Request expired" })
  }
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(nonce)) {
    return res.status(401).json({ message: "Invalid request" })
  }
  const raw = (req as MedusaRequest & { rawBody?: Buffer | string }).rawBody
  const expected = signRequest(secret, {
    timestamp,
    nonce,
    method: req.method,
    path: req.originalUrl,
    body: req.method === "GET" ? "" : (raw ?? ""),
  })
  if (!signaturesMatch(expected, signature)) {
    return res.status(401).json({ message: "Invalid signature" })
  }
  if (!rememberNonce(nonce)) {
    return res.status(401).json({ message: "Request already used" })
  }
  next()
}
