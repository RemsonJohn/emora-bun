import type { MedusaContainer } from "@medusajs/framework/types"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { STAFF_ACCESS_MODULE } from "../modules/staff-access"
import type StaffAccessService from "../modules/staff-access/service"

/** Bootstrap helper; not registered to run automatically. Must be one-shot at cutover. */
export default async function bootstrapStaffAccess({ container }: { container: MedusaContainer }) {
  const users = container.resolve(Modules.USER)
  const access = container.resolve<StaffAccessService>(STAFF_ACCESS_MODULE)
  const markerId = "emora-staff-access-bootstrap-v1"
  let [marker] = await access.listStaffGrants({ user_id: markerId })
  if (!marker) {
    const ids: string[] = []
    while (true) {
      const page = await users.listUsers({}, { skip: ids.length, take: 100, order: { id: "ASC" } })
      if (!page.length) break
      ids.push(...page.map(user => user.id))
    }
    marker = await access.createStaffGrants({ user_id: markerId, role: "bootstrap", overrides: { user_ids: ids, complete: false } })
  }
  const state = marker.overrides as { complete?: boolean; user_ids?: string[] }
  if (state.complete) return
  if (!Array.isArray(state.user_ids)) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid bootstrap state")
  for (let offset = 0; offset < state.user_ids.length; offset += 100) {
    const ids = state.user_ids.slice(offset, offset + 100)
    const existing = await access.listStaffGrants({ user_id: ids }, { take: 100 })
    const alreadyGranted = new Set(existing.map(grant => grant.user_id))
    const grants = ids.filter(id => !alreadyGranted.has(id)).map(id => ({ user_id: id, role: "admin", overrides: {} }))
    if (grants.length) await access.createStaffGrants(grants)
  }
  await access.updateStaffGrants({ id: marker.id, overrides: { complete: true } })
}
