import type { ExecArgs } from "@medusajs/framework/types"
import { MedusaError, Modules } from "@medusajs/framework/utils"

/**
 * Turns two-factor sign-in off for one Emora staff member (lost phone and no
 * recovery codes). At their next sign-in the super admin asks them to set it
 * up again and shows new recovery codes.
 *
 *   bun run medusa exec ./src/scripts/reset-staff-2fa.ts <email>
 */
export default async function resetStaff2fa({ container, args }: ExecArgs) {
  const email = args[0]
  if (!email) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Usage: reset-staff-2fa.ts <email>")
  const auth = container.resolve(Modules.AUTH)
  const [identity] = await auth.listProviderIdentities({ entity_id: email, provider: "emailpass" })
  if (!identity) throw new MedusaError(MedusaError.Types.NOT_FOUND, `No sign-in for ${email}`)
  const factors = await auth.listAuthMfa({ auth_identity_id: identity.auth_identity_id })
  let disabled = 0
  for (const factor of factors) {
    if (factor.status === "disabled") continue
    await auth.disableAuthMfa({ id: factor.id })
    disabled += 1
  }
  console.log(`${email}: ${disabled} two-factor method(s) turned off. They set it up again at next sign-in.`)
}
