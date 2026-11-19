import { defineMiddlewares, validateAndTransformBody } from "@medusajs/framework/http"
import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  CreateMerchantSchema,
  OwnerInviteSchema,
  SetSecretSchema,
  UpdateFeaturesSchema,
  UpdateMerchantSchema,
} from "./admin/platform/validators"

/**
 * Deny by default. Medusa's built-in admin and store routes are unreachable;
 * only /admin/platform/* is served, to signed-in Emora staff, and only after
 * two-factor sign-in (except /admin/platform/me, so the app can ask for setup).
 * Medusa itself requires the 2FA challenge at sign-in once a factor is enabled.
 */
async function platformGuard(request: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  const req = request as MedusaRequest & { auth_context?: { actor_type?: string; actor_id?: string; mfa_enabled?: boolean } }
  const path = `${req.baseUrl || ""}${req.path}`.replace(/\/+$/, "")
  if (!path.startsWith("/admin/platform/")) {
    return res.status(404).json({ message: "Not found" })
  }
  if (req.auth_context?.actor_type !== "user" || !req.auth_context.actor_id) {
    return res.status(401).json({ message: "Sign in to continue" })
  }
  if (path !== "/admin/platform/me" && !req.auth_context.mfa_enabled) {
    return res.status(403).json({ type: "mfa_required", message: "Set up two-factor sign-in first" })
  }
  next()
}

function notFound(_req: MedusaRequest, res: MedusaResponse) {
  return res.status(404).json({ message: "Not found" })
}

export default defineMiddlewares({
  routes: [
    { matcher: "/admin*", middlewares: [platformGuard] },
    { matcher: "/store*", middlewares: [notFound] },
    { method: ["POST"], matcher: "/admin/platform/merchants", middlewares: [validateAndTransformBody(CreateMerchantSchema)] },
    { method: ["POST"], matcher: "/admin/platform/merchants/:id", middlewares: [validateAndTransformBody(UpdateMerchantSchema)] },
    { method: ["POST"], matcher: "/admin/platform/merchants/:id/secret", middlewares: [validateAndTransformBody(SetSecretSchema)] },
    { method: ["POST"], matcher: "/admin/platform/merchants/:id/features", middlewares: [validateAndTransformBody(UpdateFeaturesSchema)] },
    { method: ["POST"], matcher: "/admin/platform/merchants/:id/owner-invite", middlewares: [validateAndTransformBody(OwnerInviteSchema)] },
  ],
})
