import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { permissions } from "../../../../access-control/policy"
import { saveStaffGrantWorkflow } from "../../../../workflows/save-staff-grant"

const schema = z.object({
  role: z.enum(["admin", "inventory_manager", "customer_support"]),
  overrides: z.partialRecord(z.enum(permissions), z.boolean()),
}).strict()

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: "Invalid role or permissions" })
  if (parsed.data.role !== "admin" && parsed.data.overrides["staff.manage"] === true) return res.status(400).json({ message: "Staff management requires the Admin role" })
  const { result } = await saveStaffGrantWorkflow(req.scope).run({ input: { ...parsed.data, user_id: req.params.id, actor_id: req.auth_context.actor_id } })
  return res.json({ grant: result })
}
