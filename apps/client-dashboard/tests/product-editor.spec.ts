import { expect, test } from "@playwright/test"

const product = { id: "prod_1", title: "Jersey", handle: "jersey", description: "Team kit", status: "draft", collection_id: "col_1", thumbnail: "https://images.example/old.jpg", images: [{ id: "img_1", url: "https://images.example/old.jpg" }], options: [{ id: "opt_1", title: "Size", values: [{ id: "size_s", value: "S" }, { id: "size_m", value: "M" }] }], variants: [{ id: "var_1", title: "Small", sku: "S-1", manage_inventory: true, allow_backorder: false, prices: [{ id: "price_inr", currency_code: "inr", amount: 100 }, { id: "price_usd", currency_code: "usd", amount: 2 }] }] }

test.beforeEach(async ({ page }) => {
  await page.route("**/admin/**", route => {
    const request = route.request(); const url = new URL(request.url()); const path = url.pathname
    if (path === "/admin/users/me") return route.fulfill({ json: { user: { first_name: "Owner", email: "owner@example.com" } } })
    if (path === "/admin/staff-access/me") return route.fulfill({ json: { permissions: ["products.read", "products.write", "inventory.read", "inventory.write", "orders.read"] } })
    if (path === "/admin/products") return route.fulfill({ json: { products: [product], count: 1 } })
    if (path === "/admin/collections") return route.fulfill({ json: { collections: [{ id: "col_1", title: "Jerseys" }, { id: "col_2", title: "Teams" }] } })
    if (path === "/admin/stock-locations") return route.fulfill({ json: { stock_locations: [{ id: "loc_1", name: "Warehouse" }] } })
    if (path === "/admin/uploads") return route.fulfill({ json: { files: [{ id: "file_1", url: "https://images.example/new.jpg" }] } })
    if (path === "/admin/products/prod_1" && request.method() === "GET" && url.searchParams.get("fields")?.includes("inventory_items")) return route.fulfill({ json: { product: { variants: [{ id: "var_1", title: "Small", inventory_items: [{ inventory_item_id: "item_1", inventory: { location_levels: [{ id: "level_1", location_id: "loc_1", stocked_quantity: 8, reserved_quantity: 2, stock_locations: { name: "Warehouse" } }] } }] }] } } })
    if (path === "/admin/products/prod_1") return route.fulfill({ json: { product } })
    if (path === "/admin/products/prod_1/variants/var_1") return route.fulfill({ json: { product } })
    if (path === "/admin/inventory-items/item_1/location-levels/loc_1") return route.fulfill({ json: { inventory_item: {} } })
    return route.fulfill({ json: { orders: [], stores: [], customers: [], count: 0 } })
  })
  await page.goto("/?page=Products")
  await page.getByRole("button", { name: /Jersey.*jersey/ }).click()
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue("Jersey")
})

test("attaches uploaded images and changes collection through the product save", async ({ page }) => {
  await page.locator('input[type="file"]').setInputFiles({ name: "jersey.png", mimeType: "image/png", buffer: Buffer.from("test") })
  await expect(page.getByRole("img", { name: "Product image 2" })).toBeVisible()
  await page.getByRole("combobox", { name: "Collection" }).click()
  await page.getByRole("option", { name: "Teams" }).click()
  const request = page.waitForRequest(req => req.method() === "POST" && new URL(req.url()).pathname === "/admin/products/prod_1")
  await page.getByRole("button", { name: "Save product" }).click()
  expect((await request).postDataJSON()).toMatchObject({ collection_id: "col_2", images: [{ id: "img_1", url: "https://images.example/old.jpg" }, { url: "https://images.example/new.jpg" }] })
})

test("preserves other currencies when editing a variant price", async ({ page }) => {
  await page.getByRole("button", { name: "Edit Small" }).click()
  await page.getByLabel("INR price for Small").fill("120")
  const request = page.waitForRequest(req => req.method() === "POST" && new URL(req.url()).pathname === "/admin/products/prod_1/variants/var_1")
  await page.getByRole("button", { name: "Save variant" }).click()
  expect((await request).postDataJSON().prices).toEqual([{ id: "price_inr", currency_code: "inr", amount: 120 }, { id: "price_usd", currency_code: "usd", amount: 2 }])
})

test("updates inventory at the selected location", async ({ page }) => {
  await expect(page.getByText("8 stocked · 2 reserved")).toBeVisible()
  await page.getByRole("button", { name: "Edit stock" }).click()
  await page.getByLabel("Stocked quantity for Small").fill("12")
  const request = page.waitForRequest(req => req.method() === "POST" && new URL(req.url()).pathname === "/admin/inventory-items/item_1/location-levels/loc_1")
  await page.getByRole("button", { name: "Save stock" }).click()
  expect((await request).postDataJSON()).toEqual({ stocked_quantity: 12 })
})

test("manages stock from the inventory page without leaving the dashboard", async ({ page }) => {
  await page.goto("/?page=Inventory")
  await page.getByRole("button", { name: "Manage inventory" }).first().click()
  await expect(page.getByRole("dialog", { name: "Manage inventory" })).toBeVisible()
  await expect(page.getByRole("dialog").getByText("Jersey", { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Edit stock" }).click()
  await page.getByLabel("Stocked quantity for Small").fill("11")
  const request = page.waitForRequest(req => req.method() === "POST" && new URL(req.url()).pathname === "/admin/inventory-items/item_1/location-levels/loc_1")
  await page.getByRole("button", { name: "Save stock" }).click()
  expect((await request).postDataJSON()).toEqual({ stocked_quantity: 11 })
  await expect(page.getByRole("button", { name: "Edit stock" })).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog", { name: "Manage inventory" })).not.toBeVisible()
  await expect(page).toHaveURL(/page=Inventory/)
})
