import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { requireStaff } from "../../../../../../lib/staff"
import { setMerchantSecretWorkflow } from "../../../../../../workflows/merchants"
import type { SetSecretBody } from "../../../validators"

/** Saves the shop's PLATFORM_SHARED_SECRET (encrypted). It can be replaced but never read back. */
export async function POST(req: AuthenticatedMedusaRequest<SetSecretBody>, res: MedusaResponse) {
  const staff = await requireStaff(req, "admin")
  await setMerchantSecretWorkflow(req.scope).run({
    input: { id: req.params.id, secret: req.validatedBody.secret, actor: staff.actor },
  })
  return res.json({ secret_configured: true })
}
