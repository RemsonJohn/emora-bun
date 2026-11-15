import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { STAFF_ACCESS_MODULE } from "../../../../modules/staff-access"
import type StaffAccessService from "../../../../modules/staff-access/service"
import { hasPermission, permissions } from "../../../../access-control/policy"
import type { Overrides, StaffRole } from "../../../../access-control/policy"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const access = req.scope.resolve<StaffAccessService>(STAFF_ACCESS_MODULE)
  const [grant] = await access.listStaffGrants({ user_id: req.auth_context.actor_id })
  if (!grant) return res.status(403).json({ message: "Staff access denied" })
  const role = grant.role as StaffRole
  const overrides = grant.overrides as Overrides
  const isFullAdmin = role === "admin" && !Object.values(overrides).some(value => value === false)
  return res.json({ role, permissions: permissions.filter(permission => hasPermission(role, overrides, permission) && (permission !== "staff.manage" || isFullAdmin)) })
}
