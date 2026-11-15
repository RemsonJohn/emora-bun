import { permissionForRequest } from "../routes"

describe("restricted API route classification", () => {
  it("separates reading, fulfilment, and other order changes", () => {
    expect(permissionForRequest("GET", "/admin/orders/order_1")).toBe("orders.read")
    expect(permissionForRequest("POST", "/admin/orders/order_1/fulfillments")).toBe("orders.fulfill")
    expect(permissionForRequest("POST", "/admin/orders/order_1/cancel")).toBeUndefined()
    expect(permissionForRequest("POST", "/admin/orders/order_1/refunds")).toBeUndefined()
    expect(permissionForRequest("POST", "/admin/payments/pay_1/refund")).toBe("orders.refund")
    expect(permissionForRequest("POST", "/admin/orders/order_1/approve")).toBe("orders.approve")
    expect(permissionForRequest("POST", "/admin/orders/order_1/complete")).toBe("orders.complete")
    expect(permissionForRequest("POST", "/admin/payments/pay_1/capture")).toBeUndefined()
  })
  it("does not map unreviewed routes to a broad permission", () => {
    expect(permissionForRequest("GET", "/admin/api-keys")).toBeUndefined()
    expect(permissionForRequest("POST", "/admin/users/me")).toBe("staff.manage")
    expect(permissionForRequest("GET", "/admin/orders/order_1/transactions")).toBeUndefined()
  })
})
