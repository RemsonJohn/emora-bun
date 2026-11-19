import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { loadFeatures } from "../../../lib/features"

/** Which optional features this shop has switched on, so the storefront can hide the others. */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  return res.json({ features: await loadFeatures(req.scope) })
}
