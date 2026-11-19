import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Features Emora can switch on or off for a shop from the super admin. Stored
 * in store.metadata.emora_features. A feature that was never set is on, so
 * shops that existed before the switches keep working.
 *
 * The backend enforces the switches it can (customisation, Complete the Look,
 * bulk orders); storefronts read GET /store/features to hide the rest.
 */
export const FEATURE_KEYS = [
  "customisation",
  "complete_the_look",
  "bulk_orders",
  "reviews",
  "wishlist",
  "video_spotlight",
] as const

export type FeatureKey = (typeof FEATURE_KEYS)[number]
export type Features = Record<FeatureKey, boolean>

export function readFeatures(storeMetadata: Record<string, unknown> | null | undefined): Features {
  const stored = (storeMetadata?.emora_features ?? {}) as Record<string, unknown>
  return Object.fromEntries(FEATURE_KEYS.map((key) => [key, stored[key] !== false])) as Features
}

export async function loadFeatures(container: MedusaContainer): Promise<Features> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({ entity: "store", fields: ["id", "metadata"] })
  return readFeatures(data[0]?.metadata)
}

export async function isFeatureEnabled(container: MedusaContainer, key: FeatureKey) {
  return (await loadFeatures(container))[key]
}
