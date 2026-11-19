import { z } from "@medusajs/framework/zod"

/**
 * Customisation details a shopper can attach to a cart line (for example a
 * Sagar Sportz team jersey). Stored on the line item as metadata.customisation
 * and copied to the order line, so production staff see exactly what was asked.
 *
 * This is the base model (version 1). To change it later, add a new version
 * here and keep accepting the old one for orders already placed.
 *
 * Products opt in with product.metadata.customizable = true. Orders that
 * contain customised lines need staff approval unless the product sets
 * product.metadata.requires_approval = false.
 */
const text = (max: number) => z.string().trim().min(1).max(max)
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/)

export const customisationV1Schema = z
  .object({
    version: z.literal(1),
    sport: text(40).optional(),
    neck: text(40).optional(),
    pattern: text(40).optional(),
    primary_colour: hex.optional(),
    secondary_colour: hex.optional(),
    primary_colour_name: text(40).optional(),
    secondary_colour_name: text(40).optional(),
    team_name: text(40).optional(),
    player_name: text(30).optional(),
    player_number: z.string().regex(/^[0-9]{1,3}$/).optional(),
    // File names only for now; the artwork itself is collected by the store.
    logo_file_name: text(120).optional(),
    sponsor_file_name: text(120).optional(),
    notes: text(500).optional(),
  })
  .strict()

export type CustomisationV1 = z.infer<typeof customisationV1Schema>

/** Line item metadata a storefront may set through the standard cart routes. */
export const storeLineItemMetadataSchema = z
  .object({
    customisation: customisationV1Schema.optional(),
  })
  .strict()

/** Metadata keys that only the backend may set (Complete the Look sets and discounts). */
export const RESERVED_LINE_ITEM_KEYS = ["set_key", "set_of", "set_role", "look_discount"] as const

export function productAllowsCustomisation(productMetadata: Record<string, unknown> | null | undefined) {
  return productMetadata?.customizable === true
}

export function productRequiresApproval(productMetadata: Record<string, unknown> | null | undefined) {
  return productMetadata?.requires_approval !== false
}
