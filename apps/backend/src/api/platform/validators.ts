import { z } from "@medusajs/framework/zod"
import { FEATURE_KEYS } from "../../lib/features"

export const UpdateFeaturesSchema = z
  .object({
    features: z
      .object(Object.fromEntries(FEATURE_KEYS.map((key) => [key, z.boolean().optional()])) as Record<
        (typeof FEATURE_KEYS)[number],
        z.ZodOptional<z.ZodBoolean>
      >)
      .strict(),
  })
  .strict()
export type UpdateFeaturesBody = z.infer<typeof UpdateFeaturesSchema>

export const OwnerInviteSchema = z.object({ email: z.string().trim().toLowerCase().email().max(120) }).strict()
export type OwnerInviteBody = z.infer<typeof OwnerInviteSchema>
