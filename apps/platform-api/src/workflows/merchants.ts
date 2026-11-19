import { createStep, createWorkflow, StepResponse, WorkflowResponse, transform } from "@medusajs/framework/workflows-sdk"
import { REGISTRY_MODULE } from "../modules/registry"
import type RegistryModuleService from "../modules/registry/service"
import { encryptSecret } from "../lib/secrets"

type Actor = { actor_id: string; actor_email: string | null }

export type MerchantInput = {
  name?: string
  handle?: string
  status?: "draft" | "active" | "suspended"
  owner_email?: string | null
  storefront_url?: string | null
  storefront_host?: string | null
  backend_url?: string | null
  backend_host?: string | null
  dashboard_url?: string | null
  notes?: string | null
}

const registry = (container: { resolve: <T>(key: string) => T }) => container.resolve<RegistryModuleService>(REGISTRY_MODULE)

export const recordAuditStep = createStep(
  "record-platform-audit",
  async (input: Actor & { merchant_id?: string | null; action: string; details?: Record<string, unknown> }, { container }) => {
    const event = await registry(container).createAuditEvents({
      actor_id: input.actor_id,
      actor_email: input.actor_email,
      merchant_id: input.merchant_id ?? null,
      action: input.action,
      details: input.details ?? null,
    })
    return new StepResponse(event, event.id)
  },
  async (id, { container }) => {
    if (id) await registry(container).deleteAuditEvents(id)
  }
)

const createMerchantStep = createStep(
  "create-merchant",
  async (input: MerchantInput & { name: string; handle: string }, { container }) => {
    const merchant = await registry(container).createMerchants(input)
    return new StepResponse(merchant, merchant.id)
  },
  async (id, { container }) => {
    if (id) await registry(container).deleteMerchants(id)
  }
)

export const createMerchantWorkflow = createWorkflow(
  "create-merchant",
  (input: { merchant: MerchantInput & { name: string; handle: string }; actor: Actor }) => {
    const merchant = createMerchantStep(input.merchant)
    const audit = transform({ input, merchant }, ({ input, merchant }) => ({
      ...input.actor,
      merchant_id: merchant.id,
      action: "merchant.created",
      details: { name: merchant.name, handle: merchant.handle },
    }))
    recordAuditStep(audit)
    return new WorkflowResponse(merchant)
  }
)

const updateMerchantStep = createStep(
  "update-merchant",
  async (input: { id: string; update: Record<string, unknown> }, { container }) => {
    const service = registry(container)
    const before = await service.retrieveMerchant(input.id)
    const previous = Object.fromEntries(Object.keys(input.update).map((k) => [k, (before as Record<string, unknown>)[k]]))
    const merchant = await service.updateMerchants({ id: input.id, ...input.update })
    return new StepResponse(merchant, { id: input.id, previous })
  },
  async (data, { container }) => {
    if (data) await registry(container).updateMerchants({ id: data.id, ...data.previous })
  }
)

export const updateMerchantWorkflow = createWorkflow(
  "update-merchant",
  (input: { id: string; update: MerchantInput; actor: Actor }) => {
    const merchant = updateMerchantStep({ id: input.id, update: input.update as Record<string, unknown> })
    const audit = transform({ input }, ({ input }) => ({
      ...input.actor,
      merchant_id: input.id,
      action: "merchant.updated",
      details: { fields: Object.keys(input.update) },
    }))
    recordAuditStep(audit)
    return new WorkflowResponse(merchant)
  }
)

/** Stores the shop's shared secret encrypted; the plain value is never kept or logged. */
export const setMerchantSecretWorkflow = createWorkflow(
  "set-merchant-secret",
  (input: { id: string; secret: string; actor: Actor }) => {
    const update = transform({ input }, ({ input }) => ({
      id: input.id,
      update: { secret_ciphertext: encryptSecret(input.secret), secret_set_at: new Date() } as Record<string, unknown>,
    }))
    updateMerchantStep(update)
    const audit = transform({ input }, ({ input }) => ({
      ...input.actor,
      merchant_id: input.id,
      action: "merchant.secret_set",
    }))
    recordAuditStep(audit)
    return new WorkflowResponse({ id: input.id })
  }
)

/** Saves the outcome of a connection check (from staff or the scheduled job). */
export const recordCheckWorkflow = createWorkflow(
  "record-merchant-check",
  (input: { id: string; result: Record<string, unknown> }) => {
    const update = transform({ input }, ({ input }) => ({ id: input.id, update: input.result }))
    return new WorkflowResponse(updateMerchantStep(update))
  }
)

/** Records an action taken on a shop through its /platform API. */
export const recordShopActionWorkflow = createWorkflow(
  "record-shop-action",
  (input: Actor & { merchant_id: string; action: string; details?: Record<string, unknown> }) => {
    return new WorkflowResponse(recordAuditStep(input))
  }
)
