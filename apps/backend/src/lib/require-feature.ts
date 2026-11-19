import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { isFeatureEnabled, type FeatureKey } from "./features"

/** Refuses a route when Emora has switched the feature off for this shop. */
export function requireFeature(key: FeatureKey) {
  return async (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
    if (!(await isFeatureEnabled(req.scope, key))) {
      return res.status(403).json({ message: "This feature is not available in this shop" })
    }
    next()
  }
}
