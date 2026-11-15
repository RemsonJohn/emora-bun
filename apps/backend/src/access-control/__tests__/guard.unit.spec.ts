import { staffAccessGuard } from "../guard"

function request(method: string, path: string, role: string, overrides: Record<string, boolean> = {}) {
  const result = { code: 200, body: undefined as unknown, passed: false }
  const service = { listStaffGrants: async () => [{ role, overrides }] }
  const users = { retrieveUser: async () => ({ id: "user_test" }) }
  const req = { method, path, auth_context: { actor_type: "user", actor_id: "user_test" }, scope: { resolve: (key: string) => key === "user" ? users : service } }
  const res = { status: (code: number) => { result.code = code; return res }, json: (body: unknown) => { result.body = body; return res } }
  return { req, res, result, next: () => { result.passed = true } }
}

describe("API access guard", () => {
  it("rejects direct calls to product writes and secret keys for support", async () => {
    for (const path of ["/admin/products", "/admin/api-keys"]) {
      const ctx = request("POST", path, "customer_support")
      await staffAccessGuard(ctx.req as never, ctx.res as never, ctx.next)
      expect(ctx.result.code).toBe(403)
      expect(ctx.result.passed).toBe(false)
    }
  })
  it("does not let a staff-management override create an administrator", async () => {
    const ctx = request("POST", "/admin/invites", "customer_support", { "staff.manage": true })
    await staffAccessGuard(ctx.req as never, ctx.res as never, ctx.next)
    expect(ctx.result.code).toBe(403)
  })
  it("requires a role on new invitations", async () => {
    const ctx = request("POST", "/admin/invites", "admin")
    await staffAccessGuard(ctx.req as never, ctx.res as never, ctx.next)
    expect(ctx.result.code).toBe(400)
  })
  it("does not allow unverified payment capture", async () => {
    const ctx = request("POST", "/admin/payments/pay_1/capture", "admin")
    await staffAccessGuard(ctx.req as never, ctx.res as never, ctx.next)
    expect(ctx.result.code).toBe(409)
  })
})
