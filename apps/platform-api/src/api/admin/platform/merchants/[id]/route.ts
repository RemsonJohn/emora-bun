import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { REGISTRY_MODULE } from "../../../../../modules/registry"
import type RegistryModuleService from "../../../../../modules/registry/service"
import { publicMerchant } from "../../../../../lib/merchant-access"
import { requireStaff } from "../../../../../lib/staff"
import { updateMerchantWorkflow } from "../../../../../workflows/merchants"
import type { UpdateMerchantBody } from "../../validators"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  await requireStaff(req, "operator")
  const merchant = await req.scope.resolve<RegistryModuleService>(REGISTRY_MODULE).retrieveMerchant(req.params.id)
  return res.json({ merchant: publicMerchant(merchant as unknown as Record<string, unknown>) })
}

export async function POST(req: AuthenticatedMedusaRequest<UpdateMerchantBody>, res: MedusaResponse) {
  const staff = await requireStaff(req, "admin")
  const { result } = await updateMerchantWorkflow(req.scope).run({
    input: { id: req.params.id, update: req.validatedBody, actor: staff.actor },
  })
  return res.json({ merchant: publicMerchant(result as unknown as Record<string, unknown>) })
}
