import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  let collection = { id: "col_1", title: "Team kits", handle: "team-kits" }
  let assigned = false
  const product = { id: "prod_1", title: "Jersey", handle: "jersey", collection_id: null as string | null }
  await page.route("**/admin/**", async route => {
    const req = route.request(); const path = new URL(req.url()).pathname
    if (path === "/admin/users/me") return route.fulfill({ json: { user: { email: "owner@example.com" } } })
    if (path === "/admin/staff-access/me") return route.fulfill({ json: { permissions: ["products.read", "products.write"] } })
    if (path === "/admin/collections" && req.method() === "GET") return route.fulfill({ json: { collections: [collection], count: 1 } })
    if (path === "/admin/collections" && req.method() === "POST") { const body = req.postDataJSON(); collection = { id: "col_2", title: body.title, handle: body.handle || "new-collection" }; return route.fulfill({ json: { collection } }) }
    if (path === `/admin/collections/${collection.id}` && req.method() === "GET") return route.fulfill({ json: { collection: { ...collection, products: assigned ? [product] : [] } } })
    if (path === `/admin/collections/${collection.id}` && req.method() === "POST") { collection = { ...collection, ...req.postDataJSON() }; return route.fulfill({ json: { collection } }) }
    if (path === `/admin/collections/${collection.id}` && req.method() === "DELETE") return route.fulfill({ json: { id: collection.id, deleted: true, object: "collection" } })
    if (path === `/admin/collections/${collection.id}/products`) { assigned = Boolean(req.postDataJSON().add); product.collection_id = assigned ? collection.id : null; return route.fulfill({ json: { collection } }) }
    if (path === "/admin/products") return route.fulfill({ json: { products: [product], count: 1 } })
    return route.fulfill({ json: { count: 0, stores: [], orders: [], customers: [] } })
  })
  await page.goto("/?page=Collections")
})

test("creates a collection inside the dashboard", async ({ page }) => {
  await page.getByRole("button", { name: "Create collection" }).click()
  const dialog = page.getByRole("dialog", { name: "Create collection" })
  await dialog.getByLabel("Collection name").fill("Training")
  const request = page.waitForRequest(req => new URL(req.url()).pathname === "/admin/collections" && req.method() === "POST")
  await dialog.getByRole("button", { name: "Create collection", exact: true }).click()
  expect((await request).postDataJSON()).toEqual({ title: "Training" })
  await expect(dialog.getByRole("heading", { name: "Products in this collection" })).toBeVisible()
})

test("edits a collection and adds and removes a product", async ({ page }) => {
  await page.getByRole("button", { name: "Manage collection Team kits" }).click()
  const dialog = page.getByRole("dialog", { name: "Manage collection" })
  await dialog.getByLabel("Collection name").fill("Team uniforms")
  await dialog.getByRole("button", { name: "Save changes" }).click()
  await expect(dialog.getByRole("button", { name: "Add", exact: true })).toBeVisible()
  await dialog.getByRole("button", { name: "Add", exact: true }).click()
  await expect(dialog.getByRole("button", { name: "Remove", exact: true })).toBeVisible()
  await dialog.getByRole("button", { name: "Remove", exact: true }).click()
  await expect(dialog.getByText("No products in this collection yet.")).toBeVisible()
})
