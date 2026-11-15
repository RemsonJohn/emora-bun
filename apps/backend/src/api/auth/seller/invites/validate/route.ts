import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const AUTHENTICATE = false

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  res.setHeader("Cache-Control", "no-store")
  const { token } = (req.body ?? {}) as { token?: unknown }
  if (typeof token !== "string" || !token || token.length > 8192) {
    return res.status(400).json({ message: "Invalid invitation" })
  }
  try {
    const users = req.scope.resolve(Modules.USER)
    const invite = await users.validateInviteToken(token)
    return res.json({ email: invite.email, expires_at: invite.expires_at })
  } catch {
    return res.status(400).json({ message: "Invalid or expired invitation" })
  }
}
