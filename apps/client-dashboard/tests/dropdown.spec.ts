import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.route("**/admin/**", route => {
    const path = new URL(route.request().url()).pathname
    if (path === "/admin/users/me") return route.fulfill({ json: { user: { first_name: "Owner", email: "owner@example.com" } } })
    if (path === "/admin/staff-access/me") return route.fulfill({ json: { permissions: ["products.read", "orders.read", "settings.read", "staff.manage"] } })
    if (path === "/admin/users") return route.fulfill({ json: { users: [{ id: "support", email: "support@example.com" }], count: 1 } })
    if (path === "/admin/staff-access") return route.fulfill({ json: { grants: [{ user_id: "support", role: "customer_support", overrides: {} }], enforcement: true } })
    return route.fulfill({ json: { stores: [], products: [], orders: [], customers: [], count: 0 } })
  })
  await page.goto("/?page=Settings")
  await page.getByRole("button", { name: /Staff & permissions/ }).click()
})

test("opens inside the modal, supports keyboard navigation and keeps the modal open on Escape", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 780 })
  await page.getByRole("button", { name: "Edit access" }).click()
  const select = page.getByRole("combobox", { name: "Role", exact: true })
  await select.focus()
  await page.keyboard.press("Enter")
  const list = page.getByRole("listbox")
  await expect(list).toBeVisible()
  const dialog = page.getByRole("dialog", { name: "Staff & permissions" })
  const menuBounds = await list.boundingBox()
  const dialogBounds = await dialog.boundingBox()
  expect(menuBounds).not.toBeNull()
  expect(dialogBounds).not.toBeNull()
  expect(menuBounds!.y).toBeGreaterThanOrEqual(dialogBounds!.y)
  expect(menuBounds!.y + menuBounds!.height).toBeLessThanOrEqual(dialogBounds!.y + dialogBounds!.height)
  await expect(page.getByRole("option", { name: "Customer support" })).toBeFocused()
  await page.keyboard.press("ArrowUp")
  await expect(page.getByRole("option", { name: "Inventory manager" })).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(select).toContainText("Inventory manager")
  await page.keyboard.press("Enter")
  await page.keyboard.press("Escape")
  await expect(list).toHaveCount(0)
  await expect(dialog).toBeVisible()
  await expect(select).toBeFocused()
})

test("requires an invitation role before submission", async ({ page }) => {
  let calls = 0
  await page.route("**/admin/invites", route => { calls++; return route.fulfill({ json: {} }) })
  await page.getByLabel("Merchant email").fill("new@example.com")
  await page.getByRole("button", { name: "Create invitation link" }).click()
  expect(calls).toBe(0)
  await expect(page.getByRole("combobox", { name: "Staff role" })).toHaveAttribute("aria-required", "true")
})
