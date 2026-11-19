import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { updateRegionsWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Offers Razorpay in the India region once the shop's Razorpay keys are in its
 * env file and the backend has been restarted (so the provider is registered).
 *
 *   bun run shop sagar exec ./src/scripts/enable-razorpay.ts
 */
export default async function enableRazorpay({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const providers = await container.resolve(Modules.PAYMENT).listPaymentProviders({ id: ["pp_razorpay_razorpay"] })
  if (!providers.length) {
    throw new Error("Razorpay is not registered. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in this shop's env file.")
  }
  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "payment_providers.id"],
    filters: { name: "India" },
  })
  const india = regions[0]
  if (!india) throw new Error("No India region found")
  const current = (india.payment_providers ?? []).map((p) => p!.id)
  if (current.includes("pp_razorpay_razorpay")) {
    logger.info("Razorpay is already offered in India.")
    return
  }
  await updateRegionsWorkflow(container).run({
    input: { selector: { id: india.id }, update: { payment_providers: [...current, "pp_razorpay_razorpay"] } },
  })
  logger.info("Razorpay is now offered in the India region.")
}
