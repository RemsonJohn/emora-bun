import { hasPermission } from "../policy"

describe("staff permission policy", () => {
  it("grants the three roles their intended defaults", () => {
    expect(hasPermission("admin", {}, "staff.manage")).toBe(true)
    expect(hasPermission("inventory_manager", {}, "inventory.write")).toBe(true)
    expect(hasPermission("inventory_manager", {}, "orders.approve")).toBe(true)
    expect(hasPermission("inventory_manager", {}, "orders.complete")).toBe(true)
    expect(hasPermission("inventory_manager", {}, "orders.refund")).toBe(false)
    expect(hasPermission("customer_support", {}, "customers.read")).toBe(true)
    expect(hasPermission("customer_support", {}, "products.write")).toBe(false)
  })

  it("supports individual grants and denials", () => {
    expect(hasPermission("customer_support", { "inventory.read": true }, "inventory.read")).toBe(true)
    expect(hasPermission("inventory_manager", { "orders.approve": false }, "orders.approve")).toBe(false)
  })

  it("denies unknown permissions and missing roles", () => {
    expect(hasPermission("admin", {}, "new_resource.write")).toBe(false)
    expect(hasPermission(undefined, { "staff.manage": true }, "staff.manage")).toBe(false)
  })
})
