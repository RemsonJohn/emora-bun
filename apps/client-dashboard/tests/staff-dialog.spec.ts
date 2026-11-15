import { expect, test } from "@playwright/test"

test("opens staff management in a modal and accurately describes unavailable permissions", async ({ page }) => {
  await page.route("**/admin/**", route => {
    const path = new URL(route.request().url()).pathname
    if (path === "/admin/staff-access/me") return route.fulfill({ json: { permissions: ["products.read", "orders.read", "settings.read", "staff.manage"] } })
    if (path === "/admin/users/me") return route.fulfill({ json: { user: { first_name: "Owner", email: "owner@example.com" } } })
    if (path === "/admin/users") return route.fulfill({ json: { users: [{ id: "u1", first_name: "Sam", email: "sam@example.com" }], count: 1, limit: 100, offset: 0 } })
    return route.fulfill({ json: { stores: [], products: [], orders: [], customers: [], count: 0 } })
  })
  await page.goto("/?page=Settings")
  await page.getByRole("button", { name: /Staff & permissions/ }).click()
  const modal = page.getByRole("dialog", { name: "Staff & permissions" })
  await expect(modal).toBeVisible()
  await expect(modal.getByText("sam@example.com")).toBeVisible()
  await expect(modal.getByText("Unable to load permissions")).toBeVisible()
  await expect(modal.getByRole("button", { name: "Create invitation link" })).toHaveCount(0)
  await page.keyboard.press("Escape")
  await expect(modal).toHaveCount(0)
})
