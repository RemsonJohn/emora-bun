import { z } from "@medusajs/framework/zod"

export const UpdateEnquirySchema = z
  .object({
    status: z.enum(["new", "quoted", "won", "lost"]).optional(),
    staff_notes: z.string().trim().max(2000).nullable().optional(),
  })
  .strict()
export type UpdateEnquiryBody = z.infer<typeof UpdateEnquirySchema>
