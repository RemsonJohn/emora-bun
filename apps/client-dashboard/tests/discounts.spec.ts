import { expect, test } from "@playwright/test"

const discount = { id: "promo_1", code: "WELCOME", status: "draft", type: "standard", is_automatic: false, application_method: { type: "percentage", target_type: "order", value: 10 }, rules: [{ attribute: "customer_group_id" }] }
test.beforeEach(async ({ page }) => {
  await page.route("**/admin/**", route => {
    const req = route.request(); const path = new URL(req.url()).pathname
    if (path === "/admin/users/me") return route.fulfill({ json: { user: { email: "owner@example.com" } } })
    if (path === "/admin/staff-access/me") return route.fulfill({ json: { permissions: ["discounts.read", "discounts.write"] } })
    if (path === "/admin/promotions" && req.method() === "GET") return route.fulfill({ json: { promotions: [discount], count: 1 } })
    if (path === "/admin/promotions" && req.method() === "POST") return route.fulfill({ json: { promotion: { ...discount, ...req.postDataJSON() } } })
    if (path === "/admin/promotions/promo_1" && req.method() === "GET") return route.fulfill({ json: { promotion: discount } })
    if (path === "/admin/promotions/promo_1" && req.method() === "POST") return route.fulfill({ json: { promotion: { ...discount, ...req.postDataJSON() } } })
    return route.fulfill({ json: { count: 0, stores: [], orders: [], customers: [] } })
  })
  await page.goto("/?page=Discounts")
})

test("creates a draft percentage discount with a usage limit", async ({ page }) => {
  await page.getByRole("button", { name: "Create discount" }).click()
  const dialog = page.getByRole("dialog", { name: "Create discount" })
  await dialog.getByLabel("Discount code").fill("WELCOME10")
  await dialog.getByLabel("Percentage").fill("10")
  await dialog.getByLabel("Maximum uses").fill("100")
  const request = page.waitForRequest(req => new URL(req.url()).pathname === "/admin/promotions" && req.method() === "POST")
  await dialog.getByRole("button", { name: "Create discount", exact: true }).click()
  expect((await request).postDataJSON()).toEqual({ code: "WELCOME10", type: "standard", status: "draft", is_automatic: false, application_method: { type: "percentage", target_type: "order", value: 10 }, limit: 100 })
})

test("preserves existing rules when changing the status", async ({ page }) => {
  await page.getByRole("button", { name: "Manage discount WELCOME" }).click()
  const dialog = page.getByRole("dialog", { name: "Manage discount" })
  await expect(dialog.getByText("Custom promotion")).toBeVisible()
  await dialog.getByRole("combobox", { name: "Discount status" }).click()
  await page.getByRole("option", { name: "Active", exact: true }).click()
  const request = page.waitForRequest(req => new URL(req.url()).pathname === "/admin/promotions/promo_1" && req.method() === "POST")
  await dialog.getByRole("button", { name: "Save changes" }).click()
  expect((await request).postDataJSON()).toEqual({ code: "WELCOME", status: "active" })
})

test("creates automatic free shipping without a usage limit", async ({ page }) => {
  await page.getByRole("button", { name: "Create discount" }).click()
  const dialog = page.getByRole("dialog", { name: "Create discount" })
  await dialog.getByLabel("Discount code").fill("FREESHIP")
  await dialog.getByRole("combobox", { name: "Discount method" }).click()
  await page.getByRole("option", { name: "Automatic", exact: true }).click()
  await dialog.getByRole("combobox", { name: "Discount type" }).click()
  await page.getByRole("option", { name: "Free shipping" }).click()
  await expect(dialog.getByLabel("Maximum uses")).not.toBeVisible()
  const request = page.waitForRequest(req => new URL(req.url()).pathname === "/admin/promotions" && req.method() === "POST")
  await dialog.getByRole("button", { name: "Create discount", exact: true }).click()
  expect((await request).postDataJSON()).toEqual({ code: "FREESHIP", type: "standard", status: "draft", is_automatic: true, application_method: { type: "percentage", target_type: "shipping_methods", allocation: "across", value: 100 } })
})

test("updates the value of a simple order discount", async ({ page }) => {
  await page.route("**/admin/promotions/promo_1", route => route.fulfill({ json: { promotion: { ...discount, rules: [] } } }))
  await page.getByRole("button", { name: "Manage discount WELCOME" }).click()
  const dialog = page.getByRole("dialog", { name: "Manage discount" })
  await dialog.getByLabel("Percentage").fill("15")
  const request = page.waitForRequest(req => new URL(req.url()).pathname === "/admin/promotions/promo_1" && req.method() === "POST")
  await dialog.getByRole("button", { name: "Save changes" }).click()
  expect((await request).postDataJSON()).toEqual({ code: "WELCOME", status: "draft", application_method: { value: 15 } })
})
