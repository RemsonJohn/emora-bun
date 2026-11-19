import { model } from "@medusajs/framework/utils"

/**
 * A customer enquiry that is not a direct order, such as a bulk team order
 * that needs a quotation. Staff move it through new -> quoted -> won / lost.
 */
export const Enquiry = model.define("enquiry", {
  id: model.id({ prefix: "enq" }).primaryKey(),
  kind: model.enum(["bulk_order"]).default("bulk_order"),
  status: model.enum(["new", "quoted", "won", "lost"]).default("new"),
  name: model.text(),
  phone: model.text(),
  email: model.text().nullable(),
  organisation: model.text().nullable(),
  details: model.json(),
  staff_notes: model.text().nullable(),
})
