import type { ExecArgs } from "@medusajs/framework/types"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { updateUsersWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Gives an Emora staff member a platform role (create the user first with
 * `bun run medusa user -e <email> -p <password>`):
 *
 *   bun run medusa exec ./src/scripts/set-staff-role.ts <email> admin|operator
 */
export default async function setStaffRole({ container, args }: ExecArgs) {
  const [email, role] = args
  if (!email || !["admin", "operator"].includes(role ?? "")) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Usage: set-staff-role.ts <email> admin|operator")
  }
  const [user] = await container.resolve(Modules.USER).listUsers({ email })
  if (!user) throw new MedusaError(MedusaError.Types.NOT_FOUND, `No user with email ${email}`)
  await updateUsersWorkflow(container).run({
    input: { updates: [{ id: user.id, metadata: { ...(user.metadata ?? {}), platform_role: role } }] },
  })
  console.log(`${email} is now a platform ${role}. They must set up two-factor sign-in at first sign-in.`)
}
