import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { REGISTRY_MODULE } from "../../../../modules/registry"
import type RegistryModuleService from "../../../../modules/registry/service"
import { publicMerchant } from "../../../../lib/merchant-access"
import { requireStaff } from "../../../../lib/staff"
import { createMerchantWorkflow } from "../../../../workflows/merchants"
import type { CreateMerchantBody } from "../validators"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  await requireStaff(req, "operator")
  const merchants = await req.scope
    .resolve<RegistryModuleService>(REGISTRY_MODULE)
    .listMerchants({}, { order: { name: "ASC" } })
  return res.json({ merchants: merchants.map((m) => publicMerchant(m as unknown as Record<string, unknown>)) })
}

export async function POST(req: AuthenticatedMedusaRequest<CreateMerchantBody>, res: MedusaResponse) {
  const staff = await requireStaff(req, "admin")
  const { result } = await createMerchantWorkflow(req.scope).run({
    input: { merchant: req.validatedBody, actor: staff.actor },
  })
  return res.status(201).json({ merchant: publicMerchant(result as unknown as Record<string, unknown>) })
}
