import { expect, test } from "@playwright/test"

test("selects a role on an invitation when enforcement is available", async ({ page }) => {
  let payload: unknown
  await page.route("**/admin/**", route => {
    const path = new URL(route.request().url()).pathname
    if (path === "/admin/staff-access/me") return route.fulfill({ json: { permissions: ["products.read", "orders.read", "settings.read", "staff.manage"] } })
    if (path === "/admin/users/me") return route.fulfill({ json: { user: { first_name: "Owner", email: "owner@example.com" } } })
    if (path === "/admin/users") return route.fulfill({ json: { users: [{ id: "user_1", email: "owner@example.com" }], count: 1 } })
    if (path === "/admin/staff-access") return route.fulfill({ json: { grants: [{ user_id: "user_1", role: "admin", overrides: {} }], enforcement: true } })
    if (path === "/admin/invites") {
      payload = route.request().postDataJSON()
      return route.fulfill({ json: { invite: { token: "invite-token", expires_at: "2030-01-01T00:00:00Z" } } })
    }
    return route.fulfill({ json: { stores: [], products: [], orders: [], customers: [], count: 0 } })
  })
  await page.goto("/?page=Settings")
  await page.getByRole("button", { name: /Staff & permissions/ }).click()
  await page.getByLabel("Merchant email").fill("support@example.com")
  await page.getByRole("combobox", { name: "Staff role" }).click()
  await page.getByRole("option", { name: "Customer support" }).click()
  await page.getByRole("button", { name: "Create invitation link" }).click()
  await expect(page.getByLabel("Invitation link")).toHaveValue(/invite-token/)
  expect(payload).toEqual({ email: "support@example.com", metadata: { emora_role: "customer_support" } })
})

test("shows support navigation and blocks a direct products page", async ({ page }) => {
  await page.route("**/admin/**", route => {
    const path = new URL(route.request().url()).pathname
    if (path === "/admin/users/me") return route.fulfill({ json: { user: { first_name: "Support", email: "support@example.com" } } })
    if (path === "/admin/staff-access/me") return route.fulfill({ json: { role: "customer_support", permissions: ["orders.read", "customers.read", "customers.write"] } })
    if (path === "/admin/products") return route.fulfill({ status: 403, json: { message: "Staff access denied" } })
    return route.fulfill({ json: { stores: [], products: [], orders: [], customers: [], count: 0 } })
  })
  await page.goto("/?page=Products")
  await expect(page.getByRole("button", { name: "Orders", exact: true })).toBeVisible()
  await expect(page.getByRole("button", { name: "Products", exact: true })).toHaveCount(0)
  await expect(page.getByText("You don’t have access to this page")).toBeVisible()
})

test("saves an individual permission change", async ({ page }) => {
  let saved: unknown
  await page.route("**/admin/**", route => {
    const path = new URL(route.request().url()).pathname
    if (path === "/admin/users/me") return route.fulfill({ json: { user: { first_name: "Owner", email: "owner@example.com" } } })
    if (path === "/admin/staff-access/me") return route.fulfill({ json: { permissions: ["products.read", "orders.read", "settings.read", "staff.manage"] } })
    if (path === "/admin/users") return route.fulfill({ json: { users: [{ id: "support", email: "support@example.com" }], count: 1 } })
    if (path === "/admin/staff-access") return route.fulfill({ json: { grants: [{ user_id: "support", role: "customer_support", overrides: {} }], enforcement: true } })
    if (path === "/admin/staff-access/support") {
      saved = route.request().postDataJSON()
      return route.fulfill({ json: { grant: { user_id: "support", ...(saved as object) } } })
    }
    return route.fulfill({ json: { stores: [], products: [], orders: [], customers: [], count: 0 } })
  })
  await page.goto("/?page=Settings")
  await page.getByRole("button", { name: /Staff & permissions/ }).click()
  await page.getByRole("button", { name: "Edit access" }).click()
  for (const width of [1280, 375]) {
    await page.setViewportSize({ width, height: 800 })
    const layout = await page.getByRole("checkbox", { name: "inventory — read" }).evaluate(input => {
      const checkbox = input.getBoundingClientRect()
      const label = input.closest("label")!.getBoundingClientRect()
      const text = input.closest("label")!.querySelector("span")!.getBoundingClientRect()
      return { checkboxWidth: checkbox.width, gap: text.left - checkbox.right, overflow: text.right - label.right }
    })
    expect(layout.checkboxWidth).toBeLessThanOrEqual(20)
    expect(layout.gap).toBeGreaterThanOrEqual(0)
    expect(layout.gap).toBeLessThanOrEqual(20)
    expect(layout.overflow).toBeLessThanOrEqual(1)
  }
  await page.getByRole("checkbox", { name: "inventory — read" }).check()
  await page.getByRole("button", { name: "Save access" }).click()
  await expect(page.getByRole("heading", { name: /Edit access/ })).toHaveCount(0)
  expect(saved).toEqual({ role: "customer_support", overrides: { "inventory.read": true } })
})

test("inventory managers can review and complete orders", async ({ page }) => {
  const order = { id: "order_1", display_id: 42, email: "buyer@example.com", created_at: "2026-01-01T00:00:00Z", currency_code: "inr", total: 100, status: "pending", payment_status: "awaiting", fulfillment_status: "not_fulfilled", items: [] }
  await page.route("**/admin/**", route => {
    const path = new URL(route.request().url()).pathname
    if (path === "/admin/users/me") return route.fulfill({ json: { user: { first_name: "Manager", email: "manager@example.com" } } })
    if (path === "/admin/staff-access/me") return route.fulfill({ json: { permissions: ["orders.read", "orders.approve", "orders.complete"] } })
    if (path === "/admin/orders") return route.fulfill({ json: { orders: [order], count: 1 } })
    if (path === "/admin/orders/order_1/approve") return route.fulfill({ json: { review: { approved_by: "user_1", approved_at: "2026-01-01T00:00:00Z" } } })
    if (path === "/admin/orders/order_1/complete") return route.fulfill({ json: { order: { ...order, status: "completed" } } })
    if (path === "/admin/orders/order_1") return route.fulfill({ json: { order } })
    return route.fulfill({ json: { stores: [], products: [], orders: [], customers: [], count: 0 } })
  })
  await page.goto("/?page=Orders")
  await page.getByRole("button", { name: "#42", exact: true }).click()
  await page.getByRole("button", { name: "Approve review" }).click()
  await expect(page.getByRole("button", { name: "Reviewed" })).toBeDisabled()
  page.once("dialog", dialog => dialog.accept())
  await page.getByRole("button", { name: "Complete order" }).click()
  await expect(page.getByRole("button", { name: "Complete order" })).toBeDisabled()
})
