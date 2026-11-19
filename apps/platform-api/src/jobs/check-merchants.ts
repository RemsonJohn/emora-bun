import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { REGISTRY_MODULE } from "../modules/registry"
import type RegistryModuleService from "../modules/registry/service"
import { checkMerchant } from "../lib/merchant-access"

/** Checks every connected shop every 10 minutes, one at a time, so pages never have to. */
export default async function checkMerchants(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const merchants = await container.resolve<RegistryModuleService>(REGISTRY_MODULE).listMerchants(
    { status: ["draft", "active"] },
    { select: ["id", "name", "backend_url", "secret_ciphertext"] }
  )
  for (const m of merchants) {
    if (!m.backend_url || !m.secret_ciphertext) continue
    const checked = await checkMerchant(container, m.id)
    if (checked.check_status !== "connected") logger.warn(`Shop "${m.name}" needs attention: ${checked.check_error ?? "unknown"}`)
  }
}

export const config = {
  name: "check-merchants",
  schedule: "*/10 * * * *",
}
