import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { Modules } from "@medusajs/framework/utils"
import jwt from "jsonwebtoken"
import { STAFF_ACCESS_MODULE } from "../../src/modules/staff-access"
import type StaffAccessService from "../../src/modules/staff-access/service"
import bootstrapStaffAccess from "../../src/access-control/bootstrap-existing-users"

const jwtSecret = "integration-test-staff-access-secret"
process.env.EMORA_STAFF_ACCESS_ENABLED = "true"
process.env.JWT_SECRET = jwtSecret
process.env.COOKIE_SECRET = "integration-test-cookie-secret"

medusaIntegrationTestRunner({
  env: { EMORA_STAFF_ACCESS_ENABLED: "true", JWT_SECRET: jwtSecret, COOKIE_SECRET: "integration-test-cookie-secret" },
  testSuite: ({ api, getContainer }) => {
    it("enforces staff permissions for direct authenticated API requests", async () => {
      const container = getContainer()
      const users = container.resolve(Modules.USER)
      const access = container.resolve<StaffAccessService>(STAFF_ACCESS_MODULE)
      const admin = await users.createUsers({ email: "staff-admin@example.test" })
      const support = await users.createUsers({ email: "staff-support@example.test" })
      await bootstrapStaffAccess({ container })
      expect((await access.listStaffGrants({ user_id: admin.id }))[0].role).toBe("admin")
      expect((await access.listStaffGrants({ user_id: support.id }))[0].role).toBe("admin")
      const token = (id: string) => jwt.sign({ actor_id: id, actor_type: "user", auth_identity_id: `auth_${id}`, app_metadata: {} }, jwtSecret)
      const header = (id: string) => ({ headers: { Authorization: `Bearer ${token(id)}` }, validateStatus: () => true })
      const change = await api.post(`/admin/staff-access/${support.id}`, { role: "customer_support", overrides: {} }, header(admin.id))
      expect(change.status).toBe(200)
      const manager = await users.createUsers({ email: "inventory@example.test" })
      expect((await api.post(`/admin/staff-access/${manager.id}`, { role: "inventory_manager", overrides: {} }, header(admin.id))).status).toBe(200)
      for (const [code, application_method] of [
        ["EMORA10", { type: "percentage", target_type: "order", value: 10 }],
        ["EMORA50", { type: "fixed", target_type: "order", currency_code: "inr", value: 50 }],
        ["EMORASHIP", { type: "percentage", target_type: "shipping_methods", allocation: "across", value: 100 }],
      ] as const) {
        const payload = { code, type: "standard", status: "draft", is_automatic: false, application_method }
        expect((await api.post("/admin/promotions", payload, header(manager.id))).status).toBe(403)
        const created = await api.post("/admin/promotions", payload, header(admin.id))
        if (created.status !== 200) throw new Error(`Creating ${code} failed: ${JSON.stringify(created.data)}`)
        expect(created.data.promotion.application_method).toMatchObject(application_method)
        const updated = await api.post(`/admin/promotions/${created.data.promotion.id}`, { status: "active" }, header(admin.id))
        expect(updated.status).toBe(200)
        expect(updated.data.promotion.application_method).toMatchObject(application_method)
        const actions = await container.resolve(Modules.PROMOTION).computeActions([code], { currency_code: "inr", items: [{ id: "line_test", quantity: 1, subtotal: 1000 }], shipping_methods: [{ id: "shipping_test", subtotal: 100 }] }, { prevent_auto_promotions: true })
        const adjustment = actions.find((action: { code?: string }) => action.code === code)
        expect(adjustment).toBeDefined()
        expect(Number(adjustment.amount)).toBe(code === "EMORA50" ? 50 : 100)
        expect((await api.delete(`/admin/promotions/${created.data.promotion.id}`, header(admin.id))).status).toBe(200)
      }
      const createdProduct = await api.post("/admin/products", { title: "Test jersey", status: "draft", options: [{ title: "Size", values: ["S", "M"] }], variants: [{ title: "Small", sku: "JERSEY-S", options: { Size: "S" }, prices: [{ currency_code: "inr", amount: 100 }, { currency_code: "usd", amount: 2 }] }] }, header(admin.id))
      expect(createdProduct.status).toBe(200)
      const productId = createdProduct.data.product.id
      const variant = createdProduct.data.product.variants[0]
      const collection = await api.post("/admin/collections", { title: "Test collection", handle: "test-collection" }, header(manager.id))
      expect(collection.status).toBe(200)
      const collectionId = collection.data.collection.id
      expect((await api.post(`/admin/collections/${collectionId}/products`, { add: [productId] }, header(manager.id))).status).toBe(200)
      const collectionDetail = await api.get(`/admin/collections/${collectionId}`, { ...header(manager.id), params: { fields: "+products.id,+products.title,+products.handle" } })
      expect(collectionDetail.status).toBe(200)
      expect(collectionDetail.data.collection.products.map((product: { id: string }) => product.id)).toContain(productId)
      expect((await api.post(`/admin/collections/${collectionId}`, { title: "Edited collection" }, header(manager.id))).status).toBe(200)
      expect((await api.post(`/admin/collections/${collectionId}/products`, { remove: [productId] }, header(manager.id))).status).toBe(200)
      expect((await api.delete(`/admin/collections/${collectionId}`, header(manager.id))).status).toBe(200)
      expect((await api.get(`/admin/products/${productId}`, header(manager.id))).status).toBe(200)
      expect((await api.post("/admin/collections", { title: "Denied collection" }, header(support.id))).status).toBe(403)
      const prices = variant.prices.map((price: { id: string; currency_code: string; amount: number }) => ({ id: price.id, currency_code: price.currency_code, amount: price.currency_code === "inr" ? 120 : price.amount }))
      const variantUpdate = await api.post(`/admin/products/${productId}/variants/${variant.id}`, { sku: "JERSEY-S-NEW", prices }, header(manager.id))
      expect(variantUpdate.status).toBe(200)
      expect(variantUpdate.data.product.variants[0].prices.map((price: { currency_code: string }) => price.currency_code).sort()).toEqual(["inr", "usd"])
      const newProduct = await api.post("/admin/products", { title: "New cap", status: "draft", options: [{ title: "Title", values: ["Default"] }] }, header(manager.id))
      if (newProduct.status !== 200) throw new Error(`Product creation failed: ${JSON.stringify(newProduct.data)}`)
      const newProductId = newProduct.data.product.id
      const addedOption = await api.post(`/admin/products/${newProductId}/options/batch`, { add: [{ title: "Size", values: ["S", "M"] }] }, header(manager.id))
      expect(addedOption.status).toBe(200)
      const addedVariant = await api.post(`/admin/products/${newProductId}/variants`, { title: "Small", sku: "CAP-S", options: { Title: "Default", Size: "S" }, prices: [{ currency_code: "inr", amount: 150 }] }, header(manager.id))
      expect(addedVariant.status).toBe(200)
      const expanded = await api.get(`/admin/products/${productId}`, { ...header(manager.id), params: { fields: "+variants.inventory_items.inventory_item_id,+variants.inventory_items.inventory.location_levels.*" } })
      expect(expanded.status).toBe(200)
      const itemId = expanded.data.product.variants[0].inventory_items[0].inventory_item_id
      const location = await container.resolve(Modules.STOCK_LOCATION).createStockLocations({ name: "Test warehouse" })
      const level = await api.post(`/admin/inventory-items/${itemId}/location-levels`, { location_id: location.id, stocked_quantity: 8 }, header(manager.id))
      expect(level.status).toBe(200)
      expect((await api.post(`/admin/inventory-items/${itemId}/location-levels/${location.id}`, { stocked_quantity: 12 }, header(manager.id))).status).toBe(200)
      const editor = await users.createUsers({ email: "product-editor@example.test" })
      await access.createStaffGrants({ user_id: editor.id, role: "customer_support", overrides: { "products.read": true, "products.write": true } })
      expect((await api.get(`/admin/products/${productId}`, { ...header(editor.id), params: { fields: "+variants.inventory_items.inventory_item_id" } })).status).toBe(403)
      expect((await api.post(`/admin/products/${productId}/variants/${variant.id}`, { manage_inventory: false }, header(editor.id))).status).toBe(403)
      expect((await api.post("/admin/products/imports", {}, header(editor.id))).status).toBe(403)
      expect((await api.post("/admin/products/import", {}, header(editor.id))).status).toBe(403)
      const csv = "Product Handle,Product Title,Variant Title,Variant Option 1 Name,Variant Option 1 Value\nimport-cap,Import cap,Default,Title,Default\n"
      const fileService = container.resolve(Modules.FILE)
      const csvFile = await fileService.createFiles({ filename: "staff-test-products.csv", mimeType: "text/csv", content: Buffer.from(csv).toString("base64") })
      try {
        const preparedImport = await api.post("/admin/products/imports", { file_key: csvFile.id, originalname: "staff-test-products.csv", extension: "csv", size: Buffer.byteLength(csv), mime_type: "text/csv" }, header(manager.id))
        expect(preparedImport.status).toBe(202)
        expect(preparedImport.data.summary.toCreate).toBe(1)
        const confirmedImport = await api.post(`/admin/products/imports/${preparedImport.data.transaction_id}/confirm`, {}, header(manager.id))
        expect(confirmedImport.status).toBe(202)
      } finally {
        await fileService.deleteFiles(csvFile.id)
      }
      const order = await container.resolve(Modules.ORDER).createOrders({ currency_code: "inr", email: "buyer@example.test", items: [{ title: "Test item", quantity: 1, unit_price: 100 }] })
      expect((await api.post(`/admin/orders/${order.id}/approve`, {}, header(support.id))).status).toBe(403)
      const approved = await api.post(`/admin/orders/${order.id}/approve`, {}, header(manager.id))
      expect(approved.status).toBe(200)
      expect(approved.data.review.approved_by).toBe(manager.id)
      const again = await api.post(`/admin/orders/${order.id}/approve`, {}, header(manager.id))
      expect(again.data.review).toEqual(approved.data.review)
      expect((await api.post(`/admin/orders/${order.id}/complete`, {}, header(manager.id))).status).not.toBe(403)
      expect((await api.post("/admin/payments/pay_test/capture", {}, header(admin.id))).status).toBe(409)
      const later = await users.createUsers({ email: "created-after-bootstrap@example.test" })
      await bootstrapStaffAccess({ container })
      expect(await access.listStaffGrants({ user_id: later.id })).toHaveLength(0)
      expect((await api.get("/admin/products", header(admin.id))).status).toBe(200)
      expect((await api.get("/admin/orders", header(support.id))).status).toBe(200)
      expect((await api.get("/admin/products", header(support.id))).status).toBe(403)
      expect((await api.get("/admin/api-keys", header(support.id))).status).toBe(403)
      expect((await api.post("/admin/invites", { email: "other@example.test", metadata: { emora_role: "admin" } }, header(support.id))).status).toBe(403)
      await access.updateStaffGrants({ id: (await access.listStaffGrants({ user_id: support.id }))[0].id, role: "customer_support", overrides: { "orders.read": false } })
      expect((await api.get("/admin/orders", header(support.id))).status).toBe(403)
      const email = "new-support@example.test"
      const invitation = await api.post("/admin/invites", { email, metadata: { emora_role: "customer_support" } }, header(admin.id))
      expect(invitation.status).toBe(200)
      const register = await api.post("/auth/user/emailpass/register", { email, password: "test-password-123" }, { validateStatus: () => true })
      expect(register.status).toBe(200)
      const accept = await api.post(`/admin/invites/accept?token=${encodeURIComponent(invitation.data.invite.token)}`, { email, first_name: "Support" }, { headers: { Authorization: `Bearer ${register.data.token}` }, validateStatus: () => true })
      expect(accept.status).toBe(200)
      const [createdGrant] = await access.listStaffGrants({ user_id: accept.data.user.id })
      expect(createdGrant.role).toBe("customer_support")
    })
  },
})

jest.setTimeout(120000)
