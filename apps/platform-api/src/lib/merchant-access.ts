import type { MedusaContainer } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import { REGISTRY_MODULE } from "../modules/registry"
import type RegistryModuleService from "../modules/registry/service"
import { recordCheckWorkflow } from "../workflows/merchants"
import { decryptSecret } from "./secrets"
import { callShop, ShopCallError } from "./shop-client"

export type ShopSummary = {
  currency: string
  days: number
  orders: number
  canceled: number
  revenue_total: number
  revenue_collected: number
  cod_to_collect: number
  awaiting_review: number
  open_enquiries: number
  last_order_at: string | null
}

/** The fields of a merchant that may leave the platform API (no secret). */
export function publicMerchant(m: Record<string, unknown>) {
  const { secret_ciphertext, ...rest } = m
  return { ...rest, secret_configured: Boolean(secret_ciphertext) }
}

/** Resolves a merchant with a usable backend address and secret, for a call to its shop. */
export async function shopTarget(container: MedusaContainer, merchantId: string) {
  const merchant = await container.resolve<RegistryModuleService>(REGISTRY_MODULE).retrieveMerchant(merchantId)
  if (!merchant.backend_url || !merchant.secret_ciphertext) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Add the shop's backend address and shared secret first")
  }
  return { merchant, backendUrl: merchant.backend_url, secret: decryptSecret(merchant.secret_ciphertext) }
}

/**
 * Checks a shop: health, 30-day summary and feature switches, and stores the
 * result on the merchant. Never throws for an unreachable shop; the failure is
 * recorded as "needs attention".
 */
export async function checkMerchant(container: MedusaContainer, merchantId: string) {
  const merchant = await container.resolve<RegistryModuleService>(REGISTRY_MODULE).retrieveMerchant(merchantId)
  let result: Record<string, unknown>
  if (!merchant.backend_url || !merchant.secret_ciphertext) {
    result = { check_status: "not_checked", checked_at: new Date(), check_error: "Backend address or shared secret missing", check_latency_ms: null }
  } else {
    try {
      const secret = decryptSecret(merchant.secret_ciphertext)
      const health = await callShop<{ ok: boolean }>(merchant.backend_url, secret, "/platform/health")
      const summary = await callShop<ShopSummary>(merchant.backend_url, secret, "/platform/summary?days=30")
      const features = await callShop<{ features: Record<string, boolean> }>(merchant.backend_url, secret, "/platform/features")
      result = {
        check_status: health.data.ok ? "connected" : "needs_attention",
        checked_at: new Date(),
        check_latency_ms: health.latencyMs,
        check_error: null,
        summary: { ...summary.data, fetched_at: new Date().toISOString() },
        features: features.data.features,
      }
    } catch (error) {
      result = {
        check_status: "needs_attention",
        checked_at: new Date(),
        check_latency_ms: null,
        check_error: error instanceof ShopCallError ? error.message : "The check failed",
      }
    }
  }
  const { result: updated } = await recordCheckWorkflow(container).run({ input: { id: merchantId, result } })
  return updated
}
