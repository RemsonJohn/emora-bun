import { hasPermission } from "./policy"
import type { Overrides, StaffRole } from "./policy"
import { permissionForRequest } from "./routes"

export type Grant = { role: StaffRole; overrides: Overrides }

/** Returns false on missing or corrupt grants and on unreviewed routes. */
export function isAuthorized(method: string, path: string, grant: Grant | undefined): boolean {
  if (!grant || !grant.overrides || typeof grant.overrides !== "object" || Array.isArray(grant.overrides)) return false
  if (!["admin", "inventory_manager", "customer_support"].includes(grant.role)) return false
  if (method.toUpperCase() === "GET" && ["/admin/users/me", "/admin/staff-access/me"].includes(path)) return true
  const permission = permissionForRequest(method, path)
  if (grant.role === "admin" && !permission) {
    // Once an admin has explicit denials, unmapped endpoints cannot bypass them.
    return !Object.values(grant.overrides).some(value => value === false)
  }
  return permission ? hasPermission(grant.role, grant.overrides, permission) : false
}
