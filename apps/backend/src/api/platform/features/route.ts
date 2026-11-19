import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateStoresWorkflow } from "@medusajs/medusa/core-flows"
import { FEATURE_KEYS, loadFeatures, readFeatures } from "../../../lib/features"
import type { UpdateFeaturesBody } from "../validators"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  return res.json({ features: await loadFeatures(req.scope) })
}

/** Switches features on or off for this shop. Unlisted features keep their current state. */
export async function POST(req: MedusaRequest<UpdateFeaturesBody>, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({ entity: "store", fields: ["id", "metadata"] })
  const store = data[0]
  const current = readFeatures(store.metadata)
  const next = { ...current }
  for (const key of FEATURE_KEYS) {
    const value = req.validatedBody.features[key]
    if (typeof value === "boolean") next[key] = value
  }
  await updateStoresWorkflow(req.scope).run({
    input: {
      selector: { id: store.id },
      update: { metadata: { ...(store.metadata ?? {}), emora_features: next } },
    },
  })
  return res.json({ features: next })
}
