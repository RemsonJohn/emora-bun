import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { STAFF_ACCESS_MODULE } from "../modules/staff-access"
import type StaffAccessService from "../modules/staff-access/service"
import type { Overrides, StaffRole } from "../access-control/policy"

type Input = { user_id: string; role: StaffRole; overrides: Overrides; actor_id: string }

const saveStaffGrantStep = createStep("save-staff-grant", async (input: Input, { container }) => {
  const access = container.resolve<StaffAccessService>(STAFF_ACCESS_MODULE)
  const users = container.resolve(Modules.USER)
  const lock = container.resolve(Modules.LOCKING)
  await users.retrieveUser(input.user_id)
  if (input.actor_id === input.user_id) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "You cannot change your own access")
  const saved = await lock.execute("emora-staff-grants", async () => {
    const [actor] = await access.listStaffGrants({ user_id: input.actor_id })
    if (!actor || actor.role !== "admin" || Object.values(actor.overrides as Record<string, unknown>).some(value => value === false)) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "A full administrator is required")
    }
    const [current] = await access.listStaffGrants({ user_id: input.user_id })
    const fullyPrivileged = (role: string, overrides: Overrides) => role === "admin" && !Object.values(overrides).some(value => value === false)
    if (current && fullyPrivileged(current.role, current.overrides as Overrides) && !fullyPrivileged(input.role, input.overrides)) {
      const admins = await access.listStaffGrants({ role: "admin" })
      if (!admins.some(admin => admin.id !== current.id && fullyPrivileged(admin.role, admin.overrides as Overrides))) {
        throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "The store must keep at least one administrator")
      }
    }
    const data = { role: input.role, overrides: input.overrides }
    const result = current
      ? await access.updateStaffGrants({ id: current.id, ...data })
      : await access.createStaffGrants({ user_id: input.user_id, ...data })
    return result
  }, { timeout: 5 })
  return new StepResponse(saved)
})

export const saveStaffGrantWorkflow = createWorkflow("save-staff-grant", (input: Input) => {
  const grant = saveStaffGrantStep(input)
  return new WorkflowResponse(grant)
})
