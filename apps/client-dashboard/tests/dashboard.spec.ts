import { expect, test } from "@playwright/test"
import { readFile } from "node:fs/promises"

const product = {
  id: "prod_test",
  title: "Linen shirt",
  description: "A natural linen shirt",
  handle: "linen-shirt",
  status: "draft",
  variants: [],
}
const order = {
  id: "order_test",
  display_id: 1001,
  email: "buyer@example.com",
  created_at: new Date().toISOString(),
  currency_code: "inr",
  total: 2490,
  status: "pending",
  payment_status: "captured",
  fulfillment_status: "not_fulfilled",
  items: [
    { id: "item_1", title: "Linen shirt", quantity: 1, unit_price: 2490 },
  ],
}

test.beforeEach(async ({ page }) => {
  await page.route("**/admin/**", async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname
    if (path === "/admin/staff-access/me") return route.fulfill({ json: { permissions: ["products.read", "products.write", "inventory.read", "inventory.write", "orders.read", "orders.fulfill", "customers.read", "customers.write", "discounts.read", "billing.read", "analytics.read", "content.read", "settings.read", "staff.manage"] } })
    if (path === "/admin/users/me")
      return route.fulfill({
        json: { user: { first_name: "Remy", email: "owner@example.com" } },
      })
    if (path === "/admin/stores")
      return route.fulfill({ json: { stores: [{ name: "Test Studio" }] } })
    if (path === "/admin/products/prod_test")
      return route.fulfill({ json: { product } })
    if (path === "/admin/products")
      return route.fulfill({ json: { products: [product], count: 1 } })
    if (path === "/admin/orders/order_test")
      return route.fulfill({ json: { order } })
    if (path === "/admin/orders")
      return route.fulfill({ json: { orders: [order], count: 1 } })
    if (path === "/admin/customers")
      return route.fulfill({ json: { customers: [], count: 0 } })
    return route.fulfill({ status: 404, json: { message: "Not found" } })
  })
})

test("shows real API metrics, order detail, and desktop layout", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  await page.goto("/")
  await expect(page.getByRole("heading", { name: /Remy/ })).toBeVisible()
  await expect(page.getByText("Test Studio")).toBeVisible()
  await expect(page.locator(".metric").first()).toContainText("2,490")
  await expect(page.getByText("Preview mode", { exact: false })).toHaveCount(0)
  await page.screenshot({ path: "test-results/desktop.png", fullPage: true })
  await page.getByRole("button", { name: "#1001", exact: true }).click()
  await expect(page.getByRole("heading", { name: "Order #1001" })).toBeVisible()
  await expect(page.getByText("Linen shirt", { exact: true })).toBeVisible()
  expect(errors).toEqual([])
})

test("product edits use the Medusa API and unsaved changes can be discarded", async ({
  page,
}) => {
  await page.goto("/?page=Products")
  await page.getByRole("button", { name: /Linen shirt.*linen-shirt/ }).click()
  await expect(page.getByLabel("Description", { exact: true })).toHaveValue(
    product.description,
  )
  await page.getByLabel("Title", { exact: true }).fill("Updated linen shirt")
  await expect(page.getByText("Unsaved changes", { exact: true })).toBeVisible()
  page.once("dialog", (dialog) => dialog.dismiss())
  await page.getByRole("button", { name: "Orders", exact: true }).click()
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue(
    "Updated linen shirt",
  )
  const request = page.waitForRequest(
    (req) =>
      req.url().includes("/admin/products/prod_test") &&
      req.method() === "POST",
  )
  await page.getByRole("button", { name: "Save product" }).click()
  expect((await request).postDataJSON()).toMatchObject({
    title: "Updated linen shirt",
    status: "draft",
  })
  await expect(page.getByRole("status")).toContainText("Product saved")
  await expect(page.getByText("Unsaved changes", { exact: true })).toHaveCount(
    0,
  )
})

test("search finds records and errors do not become demo data", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByRole("button", { name: /Search your store/ }).click()
  await page
    .getByRole("textbox", { name: "Search products, orders and customers" })
    .fill("Linen")
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Linen shirt" })
    .click()
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue(
    "Linen shirt",
  )
  await page.getByRole("button", { name: "Back", exact: true }).click()
  await page.route("**/admin/products?**", (route) =>
    route.fulfill({ status: 500, json: { message: "Database unavailable" } }),
  )
  await page.getByRole("button", { name: "Home", exact: true }).click()
  await expect(page.getByRole("alert")).toContainText("Database unavailable")
  await expect(page.getByText("Preview mode", { exact: false })).toHaveCount(0)
})

test("login rejects invalid credentials and demo mode is explicitly labelled", async ({
  page,
}) => {
  await page.route("**/admin/users/me", (route) =>
    route.fulfill({ status: 401, json: { message: "Unauthorized" } }),
  )
  await page.route("**/auth/user/emailpass", (route) =>
    route.fulfill({
      status: 401,
      json: { message: "Invalid email or password" },
    }),
  )
  await page.goto("/")
  await page.getByLabel("Email address").fill("owner@example.com")
  await page.getByLabel("Password", { exact: true }).fill("invalid-password")
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  await expect(page.getByRole("alert")).toContainText(
    "Invalid email or password",
  )
  await page.getByRole("button", { name: "Explore the demo" }).click()
  await expect(page.getByText("Preview mode", { exact: false })).toBeVisible()
  await page.getByRole("button", { name: "Products", exact: true }).click()
  await page.getByRole("button", { name: "Add product" }).click()
  await page.getByLabel("Title", { exact: true }).fill("Preview item")
  await page.getByRole("button", { name: "Save product" }).click()
  await expect(page.getByRole("status")).toContainText("not saved")
})

test("storefront analytics show last observed stages and disclose limits", async ({
  page,
}) => {
  await page.route("**/admin/storefront-analytics?**", (route) =>
    route.fulfill({
      json: {
        counts: {
          storefront: 2,
          product: 3,
          cart: 1,
          checkout: 0,
          checkout_address: 0,
          checkout_delivery: 0,
          checkout_payment: 4,
          checkout_review: 0,
          confirmation: 0,
        },
        observed: 10,
        total: 10,
        truncated: false,
        inactivity_minutes: 30,
      },
    }),
  )
  await page.goto("/?page=Analytics")
  await expect(
    page.getByRole("heading", { name: "Where shoppers were last seen" }),
  ).toBeVisible()
  await expect(page.getByText("inactive, opted-in sessions")).toBeVisible()
  const payment = page
    .locator(".storefront-bar-row")
    .filter({ hasText: "Checkout · Payment" })
  await expect(payment).toContainText("4")
  await expect(payment).toContainText("40.0%")
  await expect(page.getByText(/not confirmed abandonment/)).toBeVisible()
})

test("table actions open the selected record", async ({ page }) => {
  await page.route("**/admin/customers?**", (route) =>
    route.fulfill({
      json: {
        customers: [
          {
            id: "cust_test",
            first_name: "Asha",
            last_name: "Nair",
            email: "asha@example.com",
            created_at: new Date().toISOString(),
          },
        ],
        count: 1,
      },
    }),
  )
  await page.goto("/?page=Products")
  await page.getByRole("button", { name: "Edit Linen shirt" }).click()
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue(
    "Linen shirt",
  )
  await page.getByRole("button", { name: "Orders", exact: true }).click()
  await page
    .getByRole("button", { name: "View order 1001", exact: true })
    .click()
  await expect(page.getByRole("heading", { name: "Order #1001" })).toBeVisible()
  await page.getByRole("button", { name: "Customers", exact: true }).click()
  await page
    .getByRole("button", { name: "View customer asha@example.com" })
    .click()
  await expect(page.getByRole("heading", { name: "Asha Nair" })).toBeVisible()
})

test("selection exports only selected rows and protects CSV cells", async ({
  page,
}) => {
  await page.route("**/admin/products?**", (route) =>
    route.fulfill({
      json: {
        products: [
          product,
          {
            ...product,
            id: "prod_other",
            title: "=malicious",
            handle: "danger",
          },
        ],
        count: 2,
      },
    }),
  )
  await page.goto("/?page=Products")
  await page.getByRole("checkbox", { name: "Select row 2 in Products" }).check()
  const downloadPromise = page.waitForEvent("download")
  await page.getByRole("button", { name: "Export selected" }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe("products-selected.csv")
  const contents = await readFile((await download.path())!, "utf8")
  expect(contents).toContain("'=malicious")
  expect(contents).not.toContain("Linen shirt")
  await page
    .getByRole("checkbox", { name: "Select all rows in Products" })
    .check()
  await expect(page.getByText("2 selected")).toBeVisible()
  const allDownload = page.waitForEvent("download")
  await page.getByRole("button", { name: "Export current page" }).click()
  const allContents = await readFile(
    (await (await allDownload).path())!,
    "utf8",
  )
  expect(allContents).toContain("Linen shirt")
  expect(allContents).toContain("'=malicious")
})

test("billing displays Medusa orders and an honest printable summary", async ({
  page,
}) => {
  await page.goto("/?page=Billing")
  await expect(
    page.getByRole("heading", { name: "Billing & invoices" }),
  ).toBeVisible()
  await expect(page.getByText("buyer@example.com")).toBeVisible()
  await page.getByRole("button", { name: "View order 1001 billing" }).click()
  await expect(page.getByRole("heading", { name: "Order #1001" })).toBeVisible()
  const summary = page.getByRole("region", { name: "Order summary" })
  await expect(summary).toContainText("This is not a GST tax invoice")
  await expect(summary).toContainText("Linen shirt")
  await expect(summary).toContainText("2,490")
  await expect(summary).not.toContainText("SAMPLE DATA")
  await page.emulateMedia({ media: "print" })
  await expect(summary).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Print order summary" }),
  ).toBeHidden()
  await page.emulateMedia({ media: "screen" })
  await page.getByRole("button", { name: "Back to billing" }).click()
  await expect(
    page.getByRole("heading", { name: "Billing & invoices" }),
  ).toBeVisible()
})

test("order detail links to billing without changing payment state", async ({
  page,
}) => {
  await page.goto("/?page=Orders")
  await page.getByRole("button", { name: "#1001", exact: true }).click()
  await page.getByRole("button", { name: "Billing details" }).click()
  await expect(page.getByRole("heading", { name: "Order #1001" })).toBeVisible()
  await expect(page).toHaveURL(/page=Billing.*order=order_test/)
  await expect(
    page.getByRole("region", { name: "Order summary" }),
  ).toContainText("captured")
})

test("mobile navigation works and the viewport does not overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/")
  await expect(page.getByRole("heading", { name: /Remy/ })).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true })
  await page.getByRole("button", { name: "Toggle navigation" }).click()
  await page.getByRole("button", { name: "Products", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "Products", exact: true }),
  ).toBeVisible()
  await expect(page.locator(".sidebar")).toHaveCSS(
    "transform",
    "matrix(1, 0, 0, 1, -235, 0)",
  )
  await page.screenshot({
    path: "test-results/mobile-products.png",
    fullPage: true,
  })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
})
