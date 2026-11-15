/** Permission definitions only. These do not enforce access until wired into
 * authenticated API middleware with a protected, server-owned grant store. */
export const permissions = [
  "products.read", "products.write", "inventory.read", "inventory.write",
  "orders.read", "orders.fulfill", "orders.approve", "orders.capture", "orders.complete", "orders.refund",
  "customers.read", "customers.write", "discounts.read", "discounts.write",
  "billing.read", "analytics.read", "content.read", "content.write",
  "settings.read", "settings.write", "staff.manage",
] as const

export type Permission = (typeof permissions)[number]
export type StaffRole = "admin" | "inventory_manager" | "customer_support"
export type Overrides = Partial<Record<Permission, boolean>>

export const roleDefaults: Record<StaffRole, readonly Permission[]> = {
  admin: permissions,
  inventory_manager: ["products.read", "products.write", "inventory.read", "inventory.write", "orders.read", "orders.fulfill", "orders.approve", "orders.capture", "orders.complete"],
  customer_support: ["orders.read", "customers.read", "customers.write"],
}

/** Overrides explicitly grant or deny each permission for an individual. */
export function hasPermission(role: StaffRole | undefined, overrides: Overrides, permission: string): boolean {
  if (!role || !Object.prototype.hasOwnProperty.call(roleDefaults, role)) return false
  if (!(permissions as readonly string[]).includes(permission)) return false
  const key = permission as Permission
  if (typeof overrides[key] === "boolean") return overrides[key] as boolean
  return roleDefaults[role].includes(key)
}
