import type { AuthenticatedMedusaRequest, MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework/http"
import { isAuthorized } from "./authorize"
import { hasPermission } from "./policy"
import type { Grant } from "./authorize"
import { STAFF_ACCESS_MODULE } from "../modules/staff-access"
import type StaffAccessService from "../modules/staff-access/service"
import { Modules } from "@medusajs/framework/utils"

export async function staffAccessGuard(request: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  const req = request as AuthenticatedMedusaRequest
  const path = `${req.baseUrl || ""}${req.path}`.replace(/\/+$/, "") || "/"
  // Core invite acceptance authenticates an identity that has no user yet.
  if (path === "/admin/invites/accept" && req.method === "POST") return next()
  if (req.auth_context?.actor_type !== "user" || !req.auth_context.actor_id) {
    return res.status(403).json({ message: "Staff access denied" })
  }
  if (req.method === "POST" && /^\/admin\/payments\/[^/]+\/capture$/.test(path)) {
    return res.status(409).json({ message: "Payment capture requires the verified Razorpay integration" })
  }
  try {
    await req.scope.resolve(Modules.USER).retrieveUser(req.auth_context.actor_id)
  } catch {
    return res.status(403).json({ message: "Staff access denied" })
  }
  const service = req.scope.resolve<StaffAccessService>(STAFF_ACCESS_MODULE)
  const [stored] = await service.listStaffGrants({ user_id: req.auth_context.actor_id })
  const grant = stored ? { role: stored.role, overrides: stored.overrides } as Grant : undefined
  if (!isAuthorized(req.method, path, grant)) return res.status(403).json({ message: "Staff access denied" })
  if (req.method === "POST" && /^\/admin\/products\/imports?(?:\/|$)/.test(path) && !hasPermission(grant?.role, grant?.overrides || {}, "inventory.write")) {
    return res.status(403).json({ message: "Inventory access is required to import products" })
  }
  const fields = typeof req.query?.fields === "string" ? req.query.fields : ""
  if (req.method === "GET" && /^\/admin\/products(?:\/|$)/.test(path) && /inventory_items|inventory_quantity|\*variants(?:\.|,|$)/i.test(fields) && !hasPermission(grant?.role, grant?.overrides || {}, "inventory.read")) {
    return res.status(403).json({ message: "Inventory access denied" })
  }
  const containsInventoryControls = (value: unknown): boolean => {
    if (!value || typeof value !== "object") return false
    if (Array.isArray(value)) return value.some(containsInventoryControls)
    return Object.entries(value).some(([key, child]) => key === "manage_inventory" || key === "allow_backorder" || key === "inventory_items" || (key === "variants" && Array.isArray(child) && child.length > 0) || (key !== "metadata" && containsInventoryControls(child)))
  }
  const creatingVariants = /^\/admin\/products\/[^/]+\/variants(?:\/batch)?$/.test(path) || (path === "/admin/products" && Array.isArray((req.body as { variants?: unknown[] } | undefined)?.variants) && Boolean((req.body as { variants: unknown[] }).variants.length))
  if (req.method === "POST" && /^\/admin\/products(?:\/|$)/.test(path) && (creatingVariants || containsInventoryControls(req.body)) && !hasPermission(grant?.role, grant?.overrides || {}, "inventory.write")) {
    return res.status(403).json({ message: "Inventory access denied" })
  }
  if (/^\/admin\/(?:users|invites|staff-access)(?:\/|$)/.test(path)
      && !["/admin/users/me", "/admin/staff-access/me"].includes(path)
      && (grant?.role !== "admin" || Object.values(grant.overrides).some(value => value === false))) {
    return res.status(403).json({ message: "A full administrator is required" })
  }
  if (path === "/admin/invites" && req.method === "POST") {
    const body = req.body as { metadata?: { emora_role?: unknown } } | undefined
    if (!["admin", "inventory_manager", "customer_support"].includes(String(body?.metadata?.emora_role ?? ""))) {
      return res.status(400).json({ message: "A staff role is required" })
    }
  }
  // User deletion needs the same last-administrator safeguards as role updates.
  if (/^\/admin\/users\/[^/]+$/.test(path) && req.method === "DELETE") {
    return res.status(403).json({ message: "Staff deletion is not available" })
  }
  next()
}
