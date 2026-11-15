import { model } from "@medusajs/framework/utils"

export const StaffGrant = model.define("staff_grant", {
  id: model.id().primaryKey(),
  user_id: model.text().unique(),
  role: model.text(),
  overrides: model.json(),
})
