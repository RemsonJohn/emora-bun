import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { STAFF_ACCESS_MODULE } from "../../../modules/staff-access"
import type StaffAccessService from "../../../modules/staff-access/service"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const access = req.scope.resolve<StaffAccessService>(STAFF_ACCESS_MODULE)
  const grants = await access.listStaffGrants({}, { take: 1000 })
  return res.json({ grants, enforcement: true })
}
