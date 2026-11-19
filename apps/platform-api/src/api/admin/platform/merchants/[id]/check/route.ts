import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { checkMerchant, publicMerchant } from "../../../../../../lib/merchant-access"
import { requireStaff } from "../../../../../../lib/staff"

/** Runs a connection check now (health, 30-day summary, feature switches). */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  await requireStaff(req, "operator")
  const merchant = await checkMerchant(req.scope, req.params.id)
  return res.json({ merchant: publicMerchant(merchant as unknown as Record<string, unknown>) })
}
