import type { MedusaContainer } from "@medusajs/framework/types"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { STAFF_ACCESS_MODULE } from "../modules/staff-access"
import type StaffAccessService from "../modules/staff-access/service"

export default async function checkStaffAccess({ container }: { container: MedusaContainer }) {
  const users = container.resolve(Modules.USER)
  const grants = container.resolve<StaffAccessService>(STAFF_ACCESS_MODULE)
  let count = 0
  let missing = 0
  while (true) {
    const page = await users.listUsers({}, { skip: count, take: 100, order: { id: "ASC" } })
    if (!page.length) break
    const found = await grants.listStaffGrants({ user_id: page.map(user => user.id) }, { take: 100 })
    const existing = new Set(found.map(grant => grant.user_id))
    missing += page.filter(user => !existing.has(user.id)).length
    count += page.length
  }
  console.info(`Checked ${count} existing users; ${missing} have no staff grant.`)
  if (missing) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Some existing users have no staff grant")
}
