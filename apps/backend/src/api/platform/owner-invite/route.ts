import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { createInvitesWorkflow } from "@medusajs/medusa/core-flows"
import type { OwnerInviteBody } from "../validators"

/**
 * Creates an administrator invitation for the shop owner and returns the
 * merchant dashboard link with the one-time token. The platform shows it once
 * to Emora staff; it is not stored there.
 */
export async function POST(req: MedusaRequest<OwnerInviteBody>, res: MedusaResponse) {
  const dashboardUrl = process.env.MERCHANT_DASHBOARD_URL
  if (!dashboardUrl) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "MERCHANT_DASHBOARD_URL is not set for this shop")
  }
  const { result } = await createInvitesWorkflow(req.scope).run({
    input: {
      invites: [{ email: req.validatedBody.email, metadata: { emora_role: "admin", invited_by: "emora-platform" } }],
    },
  })
  const invite = result[0]
  const url = new URL("/register", dashboardUrl)
  url.searchParams.set("token", invite.token)
  return res.status(201).json({
    invite: { id: invite.id, email: invite.email, expires_at: invite.expires_at },
    invite_url: url.toString(),
  })
}
