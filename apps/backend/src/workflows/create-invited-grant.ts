import { createStep, createWorkflow, StepResponse, WorkflowResponse, transform } from "@medusajs/framework/workflows-sdk"
import { acceptInviteWorkflow } from "@medusajs/medusa/core-flows"
import { STAFF_ACCESS_MODULE } from "../modules/staff-access"
import type StaffAccessService from "../modules/staff-access/service"
import type { StaffRole } from "../access-control/policy"

const createInvitedGrantStep = createStep("create-invited-grant", async (input: { user_id: string; role: StaffRole }, { container }) => {
  const access = container.resolve<StaffAccessService>(STAFF_ACCESS_MODULE)
  const grant = await access.createStaffGrants({ ...input, overrides: {} })
  return new StepResponse(grant, grant.id)
}, async (id, { container }) => {
  if (id) await container.resolve<StaffAccessService>(STAFF_ACCESS_MODULE).deleteStaffGrants([id])
})
type AcceptInput = { invite_token: string; auth_identity_id: string; user: { email: string; first_name?: string; last_name?: string }; role: StaffRole }
export const acceptStaffInviteWorkflow = createWorkflow("accept-staff-invite", (input: AcceptInput) => {
  const users = acceptInviteWorkflow.runAsStep({ input: transform({ input }, ({ input }) => ({ invite_token: input.invite_token, auth_identity_id: input.auth_identity_id, user: input.user })) })
  const grant = transform({ users, input }, ({ users, input }) => ({ user_id: users[0].id, role: input.role }))
  createInvitedGrantStep(grant)
  return new WorkflowResponse(users)
})
