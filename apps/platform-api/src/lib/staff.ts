import type { AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"

/**
 * Emora staff roles, kept in user.metadata.platform_role:
 * - admin: everything, including shop secrets, feature switches and owner invites
 * - operator: read and run connection checks
 * A user without a role can sign in but cannot see any merchant.
 */
export type PlatformRole = "admin" | "operator"

export async function getStaff(req: AuthenticatedMedusaRequest) {
  const user = await req.scope.resolve(Modules.USER).retrieveUser(req.auth_context.actor_id)
  const raw = user.metadata?.platform_role
  const role: PlatformRole | null = raw === "admin" || raw === "operator" ? raw : null
  return {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role,
    actor: { actor_id: user.id, actor_email: user.email },
  }
}

export async function requireStaff(req: AuthenticatedMedusaRequest, needed: PlatformRole) {
  const staff = await getStaff(req)
  if (!staff.role || (needed === "admin" && staff.role !== "admin")) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Your Emora role does not allow this")
  }
  return staff
}
