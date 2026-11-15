import { expect, test } from "@playwright/test"

test("accepts a verified invitation without replacing an existing admin session", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("emora_admin_token", "existing-admin-token"))
  await page.route("**/auth/seller/invites/validate", route => route.fulfill({ json: { email: "seller@example.com" } }))
  await page.route("**/auth/user/emailpass/register", route => {
    expect(route.request().postDataJSON()).toEqual({ email: "seller@example.com", password: "password123" })
    return route.fulfill({ json: { token: "registration-token" } })
  })
  let accepted = false
  await page.route("**/admin/invites/accept**", route => {
    accepted = true
    expect(new URL(route.request().url()).searchParams.get("token")).toBe("invite-secret")
    expect(route.request().headers().authorization).toBe("Bearer registration-token")
    expect(route.request().postDataJSON()).toMatchObject({ email: "seller@example.com", first_name: "Sagar" })
    return route.fulfill({ json: { user: { email: "seller@example.com" } } })
  })
  await page.goto("/register?token=invite-secret")
  await expect(page.getByLabel("Email address")).toHaveValue("seller@example.com")
  await expect(page.getByLabel("Email address")).toHaveAttribute("readonly", "")
  await expect(page).toHaveURL(/\/register$/)
  await page.getByLabel("First name").fill("Sagar")
  await page.getByLabel("Password", { exact: true }).fill("password123")
  await page.getByLabel("Confirm password").fill("password123")
  await page.getByRole("button", { name: "Create account" }).click()
  await expect(page.getByText("Your account is ready.", { exact: false })).toBeVisible()
  expect(accepted).toBe(true)
  expect(await page.evaluate(() => sessionStorage.getItem("emora_admin_token"))).toBe("existing-admin-token")
})

test("expired invitations cannot reach the registration form", async ({ page }) => {
  await page.route("**/auth/seller/invites/validate", route => route.fulfill({ status: 400, json: { message: "Invalid" } }))
  await page.goto("/register?token=expired")
  await expect(page.getByRole("alert")).toContainText("invalid, expired")
  await expect(page.getByRole("button", { name: "Create account" })).toHaveCount(0)
})

test("creates an invitation for the current store", async ({ page }) => {
  await page.route("**/admin/**", route => {
    const path = new URL(route.request().url()).pathname
    if (path === "/admin/staff-access/me") return route.fulfill({ json: { permissions: ["products.read", "orders.read", "settings.read", "staff.manage"] } })
    if (path === "/admin/users/me") return route.fulfill({ json: { user: { first_name: "Owner", email: "owner@example.com" } } })
    if (path === "/admin/users") return route.fulfill({ json: { users: [], count: 0 } })
    if (path === "/admin/staff-access") return route.fulfill({ json: { grants: [], enforcement: true } })
    if (path === "/admin/invites") {
      expect(route.request().postDataJSON()).toEqual({ email: "seller@example.com", metadata: { emora_role: "customer_support" } })
      return route.fulfill({ json: { invite: { token: "test-invite", expires_at: "2030-01-01T00:00:00Z" } } })
    }
    return route.fulfill({ json: { stores: [], products: [], orders: [], customers: [], count: 0 } })
  })
  await page.goto("/?page=Settings")
  await page.getByRole("button", { name: /Staff & permissions/ }).click()
  await page.getByLabel("Merchant email").fill("seller@example.com")
  await page.getByRole("combobox", { name: "Staff role" }).click()
  await page.getByRole("option", { name: "Customer support" }).click()
  await page.getByRole("button", { name: "Create invitation link" }).click()
  await expect(page.getByLabel("Invitation link")).toHaveValue(/\/register\?token=test-invite$/)
  await expect(page.getByText(/selected role controls/)).toBeVisible()
})
