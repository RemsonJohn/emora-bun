import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { acceptStaffInviteWorkflow } from "../workflows/create-invited-grant"
import type { StaffRole } from "./policy"

export const AUTHENTICATE = false

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const token = req.filterableFields?.token
  const input = req.validatedBody as { email?: string; first_name?: string; last_name?: string }
  if (typeof token !== "string" || req.auth_context?.actor_id || !req.auth_context?.auth_identity_id) {
    return res.status(401).json({ message: "Invalid invitation" })
  }
  try {
    const users = req.scope.resolve(Modules.USER)
    const auth = req.scope.resolve(Modules.AUTH)
    const invite = await users.validateInviteToken(token)
    const role = invite.metadata?.emora_role
    if (typeof role !== "string" || !["admin", "inventory_manager", "customer_support"].includes(role)) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Role missing")
    const identity = await auth.retrieveAuthIdentity(req.auth_context.auth_identity_id, { relations: ["provider_identities"] })
    if (!identity.provider_identities?.some(provider => provider.provider === "emailpass" && provider.entity_id.toLowerCase() === invite.email.toLowerCase())) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Identity mismatch")
    if (input.email && input.email.toLowerCase() !== invite.email.toLowerCase()) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Email mismatch")
    const { result } = await acceptStaffInviteWorkflow(req.scope).run({ input: { invite_token: token, auth_identity_id: req.auth_context.auth_identity_id, user: { ...input, email: invite.email }, role: role as StaffRole } })
    return res.json({ user: result[0] })
  } catch {
    return res.status(401).json({ message: "Could not accept invitation. Contact the store administrator." })
  }
}
