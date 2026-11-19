import { z } from "@medusajs/framework/zod"

const url = z
  .string()
  .trim()
  .url()
  .max(300)
  .refine((v) => /^https?:\/\//.test(v), "Use an http or https address")
const nullableUrl = url.nullable().optional()

export const CreateMerchantSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    handle: z.string().trim().regex(/^[a-z0-9-]{2,40}$/, "Lower-case letters, numbers and dashes"),
    owner_email: z.string().trim().toLowerCase().email().max(120).nullable().optional(),
    storefront_url: nullableUrl,
    storefront_host: z.string().trim().max(40).nullable().optional(),
    backend_url: nullableUrl,
    backend_host: z.string().trim().max(40).nullable().optional(),
    dashboard_url: nullableUrl,
    notes: z.string().trim().max(1000).nullable().optional(),
  })
  .strict()
export type CreateMerchantBody = z.infer<typeof CreateMerchantSchema>

export const UpdateMerchantSchema = CreateMerchantSchema.partial()
  .extend({ status: z.enum(["draft", "active", "suspended"]).optional() })
  .strict()
export type UpdateMerchantBody = z.infer<typeof UpdateMerchantSchema>

export const SetSecretSchema = z.object({ secret: z.string().min(32).max(256) }).strict()
export type SetSecretBody = z.infer<typeof SetSecretSchema>

export const UpdateFeaturesSchema = z.object({ features: z.record(z.string(), z.boolean()) }).strict()
export type UpdateFeaturesBody = z.infer<typeof UpdateFeaturesSchema>

export const OwnerInviteSchema = z.object({ email: z.string().trim().toLowerCase().email().max(120) }).strict()
export type OwnerInviteBody = z.infer<typeof OwnerInviteSchema>
