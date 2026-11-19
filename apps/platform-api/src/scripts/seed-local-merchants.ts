import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { parseEnv } from "node:util"
import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { REGISTRY_MODULE } from "../modules/registry"
import type RegistryModuleService from "../modules/registry/service"
import { createMerchantWorkflow, setMerchantSecretWorkflow } from "../workflows/merchants"

/**
 * LOCAL DEVELOPMENT ONLY. Registers Sagar Sportz and Anushq with their local
 * backends, reading each shop's PLATFORM_SHARED_SECRET from apps/backend/.env.<shop>.
 * In production, staff enter the secret in the super admin instead.
 *
 *   bun run medusa exec ./src/scripts/seed-local-merchants.ts
 */
const SHOPS = [
  {
    env: "sagar",
    name: "Sagar Sportz",
    handle: "sagar-sportz",
    storefront_url: "https://sagarsportz.com",
    storefront_host: "Vercel",
    backend_url: "http://localhost:9000",
    backend_host: "Local",
    dashboard_url: "http://localhost:5174",
  },
  {
    env: "anushq",
    name: "Anushq by Dhaksha",
    handle: "anushq",
    storefront_url: "https://anushq.in",
    storefront_host: "Netlify",
    backend_url: "http://localhost:9001",
    backend_host: "Local",
    dashboard_url: null,
  },
]

export default async function seedLocalMerchants({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const registry = container.resolve<RegistryModuleService>(REGISTRY_MODULE)
  const actor = { actor_id: "system", actor_email: "local-seed" }
  for (const { env, ...shop } of SHOPS) {
    const [existing] = await registry.listMerchants({ handle: shop.handle })
    const merchant =
      existing ?? (await createMerchantWorkflow(container).run({ input: { merchant: { ...shop, status: "active" }, actor } })).result
    const file = resolve(process.cwd(), `../backend/.env.${env}`)
    const secret = parseEnv(readFileSync(file, "utf8")).PLATFORM_SHARED_SECRET
    if (secret) {
      await setMerchantSecretWorkflow(container).run({ input: { id: merchant.id, secret, actor } })
    }
    logger.info(`${shop.name}: ${existing ? "already registered" : "registered"}${secret ? ", secret set" : ", no secret found"}`)
  }
}
