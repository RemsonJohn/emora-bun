import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getStaff } from "../../../../lib/staff"

/** The signed-in Emora staff member, their role and whether two-factor sign-in is on. */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const { actor: _actor, ...user } = await getStaff(req)
  const ctx = req.auth_context as typeof req.auth_context & { mfa_enabled?: boolean }
  return res.json({ user, mfa_enabled: Boolean(ctx.mfa_enabled) })
}
