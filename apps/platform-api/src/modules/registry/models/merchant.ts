import { model } from "@medusajs/framework/utils"

/** A business Emora runs a shop for, and where its systems live. */
export const Merchant = model.define("merchant", {
  id: model.id({ prefix: "mer" }).primaryKey(),
  name: model.text(),
  handle: model.text().unique(),
  status: model.enum(["draft", "active", "suspended"]).default("draft"),
  owner_email: model.text().nullable(),
  storefront_url: model.text().nullable(),
  storefront_host: model.text().nullable(),
  backend_url: model.text().nullable(),
  backend_host: model.text().nullable(),
  dashboard_url: model.text().nullable(),
  notes: model.text().nullable(),
  // AES-256-GCM encrypted PLATFORM_SHARED_SECRET of the shop backend (never returned by the API).
  secret_ciphertext: model.text().nullable(),
  secret_set_at: model.dateTime().nullable(),
  // Result of the latest connection check.
  check_status: model.enum(["not_checked", "connected", "needs_attention"]).default("not_checked"),
  checked_at: model.dateTime().nullable(),
  check_latency_ms: model.number().nullable(),
  check_error: model.text().nullable(),
  // Latest figures from the shop (counts and totals only).
  summary: model.json().nullable(),
  features: model.json().nullable(),
})
