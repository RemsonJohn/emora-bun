import { model } from "@medusajs/framework/utils"

/** Who did what on the platform. Never stores secrets, tokens or passwords. */
export const AuditEvent = model.define("audit_event", {
  id: model.id({ prefix: "aud" }).primaryKey(),
  actor_id: model.text().nullable(),
  actor_email: model.text().nullable(),
  merchant_id: model.text().nullable(),
  action: model.text(),
  details: model.json().nullable(),
})
