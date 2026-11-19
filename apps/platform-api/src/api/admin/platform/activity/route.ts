import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { REGISTRY_MODULE } from "../../../../modules/registry"
import type RegistryModuleService from "../../../../modules/registry/service"
import { requireStaff } from "../../../../lib/staff"

/** Recent platform activity, newest first. Optional ?merchant_id= and ?limit= (max 200). */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  await requireStaff(req, "operator")
  const merchantId = typeof req.query.merchant_id === "string" ? req.query.merchant_id : undefined
  const limit = Math.min(Number(req.query.limit) || 50, 200)
  const events = await req.scope
    .resolve<RegistryModuleService>(REGISTRY_MODULE)
    .listAuditEvents(merchantId ? { merchant_id: merchantId } : {}, { order: { created_at: "DESC" }, take: limit })
  return res.json({ events })
}
