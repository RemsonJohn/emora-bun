import { z } from "@medusajs/framework/zod"

export const AddLookSchema = z
  .object({
    main_variant_id: z.string().min(1).max(100),
    quantity: z.number().int().min(1).max(10).default(1),
    piece_variant_ids: z.array(z.string().min(1).max(100)).min(1).max(4),
  })
  .strict()
export type AddLookBody = z.infer<typeof AddLookSchema>

const text = (max: number) => z.string().trim().min(1).max(max)

export const CreateEnquirySchema = z
  .object({
    kind: z.literal("bulk_order").default("bulk_order"),
    name: text(80),
    phone: z.string().trim().regex(/^\+?[0-9 ]{8,16}$/),
    email: z.string().trim().email().max(120).optional(),
    organisation: text(120).optional(),
    details: z
      .object({
        sport: text(40).optional(),
        product: text(120).optional(),
        quantity: z.number().int().min(1).max(100000).optional(),
        city: text(80).optional(),
        needed_by: text(40).optional(),
        message: text(1000).optional(),
      })
      .strict(),
  })
  .strict()
export type CreateEnquiryBody = z.infer<typeof CreateEnquirySchema>
