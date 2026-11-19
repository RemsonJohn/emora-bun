import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { shopTarget } from "../../../../../../lib/merchant-access"
import { callShop, ShopCallError } from "../../../../../../lib/shop-client"
import { requireStaff } from "../../../../../../lib/staff"
import { recordShopActionWorkflow } from "../../../../../../workflows/merchants"
import type { OwnerInviteBody } from "../../../validators"

type InviteResponse = { invite: { id: string; email: string; expires_at: string }; invite_url: string }

/**
 * Creates the owner's invitation on the shop's backend and returns its link
 * once, for staff to send by hand (no email provider yet). The link is not
 * stored or logged by the platform.
 */
export async function POST(req: AuthenticatedMedusaRequest<OwnerInviteBody>, res: MedusaResponse) {
  const staff = await requireStaff(req, "admin")
  const { backendUrl, secret } = await shopTarget(req.scope, req.params.id)
  let data: InviteResponse
  try {
    ;({ data } = await callShop<InviteResponse>(backendUrl, secret, "/platform/owner-invite", {
      method: "POST",
      body: { email: req.validatedBody.email },
    }))
  } catch (error) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      error instanceof ShopCallError ? error.message : "The invitation could not be created"
    )
  }
  await recordShopActionWorkflow(req.scope).run({
    input: {
      ...staff.actor,
      merchant_id: req.params.id,
      action: "merchant.owner_invited",
      details: { email: data.invite.email, expires_at: data.invite.expires_at },
    },
  })
  return res.status(201).json(data)
}
