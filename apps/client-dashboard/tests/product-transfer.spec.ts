import { expect, test } from "@playwright/test"
import { readFile } from "node:fs/promises"

test.beforeEach(async ({ page }) => {
  await page.route("**/admin/**", route => {
    const path = new URL(route.request().url()).pathname
    if (path === "/admin/users/me") return route.fulfill({ json: { user: { email: "owner@example.com" } } })
    if (path === "/admin/staff-access/me") return route.fulfill({ json: { permissions: ["products.read", "products.write", "inventory.read", "inventory.write"] } })
    if (path === "/admin/products") return route.fulfill({ json: { products: [{ id: "p1", title: "Jersey", handle: "jersey", status: "draft", variants: [{ id: "v1", title: "Large", sku: "J-L" }] }], count: 1 } })
    if (path === "/admin/uploads/presigned-urls") return route.fulfill({ json: { url: "/uploads", filename: "products.csv", originalname: "products.csv", extension: "csv", size: 10, mime_type: "text/csv" } })
    if (path === "/admin/uploads") return route.fulfill({ json: { files: [{ id: "file_1", url: "/file_1" }] } })
    if (path === "/admin/products/imports") return route.fulfill({ status: 202, json: { transaction_id: "tx_1", summary: { toCreate: 2, toUpdate: 1 } } })
    if (path === "/admin/products/imports/tx_1/confirm") return route.fulfill({ status: 202, json: {} })
    if (path === "/admin/collections") return route.fulfill({ json: { collections: [] } })
    return route.fulfill({ json: { count: 0, stores: [], orders: [], customers: [] } })
  })
  await page.goto("/?page=Products")
})

test("creates a product in the shared popup", async ({ page }) => {
  await page.getByRole("button", { name: "Add product" }).click()
  const dialog = page.getByRole("dialog", { name: "Add product" })
  await expect(dialog).toBeVisible()
  await dialog.getByLabel("Title", { exact: true }).fill("New cap")
  page.once("dialog", dialog => dialog.accept())
  await page.keyboard.press("Escape")
  await expect(dialog).not.toBeVisible()
})

test("reviews and confirms a CSV import", async ({ page }) => {
  await page.getByRole("button", { name: "Import / export" }).click()
  const dialog = page.getByRole("dialog", { name: "Import / export products" })
  await dialog.locator('input[type="file"]').setInputFiles({ name: "products.csv", mimeType: "text/csv", buffer: Buffer.from("Product Handle,Product Title\ntest,Test") })
  await dialog.getByRole("button", { name: "Review import" }).click()
  await expect(dialog.getByText("Ready to create 2 and update 1 products.")).toBeVisible()
  await dialog.getByRole("button", { name: "Start import" }).click()
  await expect(dialog.getByRole("status")).toContainText("background processing")
})

test("downloads a product summary CSV", async ({ page }) => {
  await page.getByRole("button", { name: "Import / export" }).click()
  const dialog = page.getByRole("dialog", { name: "Import / export products" })
  const download = page.waitForEvent("download")
  await dialog.getByRole("button", { name: "Download CSV" }).click()
  const contents = await readFile(await (await download).path(), "utf8")
  expect(contents).toContain('"Jersey","jersey","draft","v1","Large","J-L"')
})
