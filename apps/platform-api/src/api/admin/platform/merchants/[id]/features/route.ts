import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { shopTarget } from "../../../../../../lib/merchant-access"
import { callShop, ShopCallError } from "../../../../../../lib/shop-client"
import { requireStaff } from "../../../../../../lib/staff"
import { recordCheckWorkflow, recordShopActionWorkflow } from "../../../../../../workflows/merchants"
import type { UpdateFeaturesBody } from "../../../validators"

/** Switches features on the shop's own backend, then keeps the platform's copy in step. */
export async function POST(req: AuthenticatedMedusaRequest<UpdateFeaturesBody>, res: MedusaResponse) {
  const staff = await requireStaff(req, "admin")
  const { backendUrl, secret } = await shopTarget(req.scope, req.params.id)
  let features: Record<string, boolean>
  try {
    const { data } = await callShop<{ features: Record<string, boolean> }>(backendUrl, secret, "/platform/features", {
      method: "POST",
      body: { features: req.validatedBody.features },
    })
    features = data.features
  } catch (error) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      error instanceof ShopCallError ? error.message : "The shop could not be updated"
    )
  }
  await recordCheckWorkflow(req.scope).run({ input: { id: req.params.id, result: { features } } })
  await recordShopActionWorkflow(req.scope).run({
    input: {
      ...staff.actor,
      merchant_id: req.params.id,
      action: "merchant.features_changed",
      details: { changes: req.validatedBody.features },
    },
  })
  return res.json({ features })
}
