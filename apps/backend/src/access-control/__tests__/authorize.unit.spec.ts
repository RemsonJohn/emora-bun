import { isAuthorized } from "../authorize"

describe("staff request decisions", () => {
  const support = { role: "customer_support" as const, overrides: {} }
  const inventory = { role: "inventory_manager" as const, overrides: {} }
  it("lets support read customers and orders but not modify products or issue refunds", () => {
    expect(isAuthorized("GET", "/admin/customers", support)).toBe(true)
    expect(isAuthorized("GET", "/admin/orders/order_1", support)).toBe(true)
    expect(isAuthorized("POST", "/admin/products", support)).toBe(false)
    expect(isAuthorized("POST", "/admin/orders/order_1/refunds", support)).toBe(false)
  })
  it("allows inventory management but denies secret keys and staff administration", () => {
    expect(isAuthorized("POST", "/admin/inventory-items/item_1", inventory)).toBe(true)
    expect(isAuthorized("GET", "/admin/api-keys", inventory)).toBe(false)
    expect(isAuthorized("POST", "/admin/users", inventory)).toBe(false)
  })
  it("applies individual denials and fails closed for missing grants", () => {
    expect(isAuthorized("GET", "/admin/orders", { ...inventory, overrides: { "orders.read": false } })).toBe(false)
    expect(isAuthorized("GET", "/admin/orders", undefined)).toBe(false)
    expect(isAuthorized("GET", "/admin/users/me", undefined)).toBe(false)
    expect(isAuthorized("GET", "/admin/orders", { role: "admin", overrides: { "orders.read": false } })).toBe(false)
    expect(isAuthorized("GET", "/admin/api-keys", { role: "admin", overrides: { "orders.read": false } })).toBe(false)
  })
})
