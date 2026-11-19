/**
 * Complete the Look (Anushq): a main kurti plus matching pieces bought together.
 *
 * Product metadata (set by the catalogue import, editable in Medusa Admin):
 * - complete_the_look: [{ role: "bottom" | "dupatta", options: [product handle, ...] }]
 *   on the kurti, listing the pieces that may be added with it.
 * - ctl_discount_enabled: true on a kurti whose look may be discounted.
 * - set_only: true on a piece that is sold only as part of a look.
 *
 * Store metadata (Settings > Store > Metadata):
 * - ctl_discount_enabled: "true" to switch the discount on for the whole store
 * - ctl_discount_type: "percentage" | "fixed"
 * - ctl_discount_value: number (percent, or rupees off each matching piece)
 *
 * The discount applies only to the matching pieces, only with the kurti in
 * the same set, and those pieces are not discountable by other promotions.
 */
export type LookSlot = { role: string; options: string[] }

export type LookDiscountSettings = {
  enabled: boolean
  type: "percentage" | "fixed"
  value: number
}

export function readLookSlots(productMetadata: Record<string, unknown> | null | undefined): LookSlot[] {
  const raw = productMetadata?.complete_the_look
  if (!Array.isArray(raw)) return []
  return raw.flatMap((slot) => {
    if (!slot || typeof slot !== "object") return []
    const { role, options } = slot as { role?: unknown; options?: unknown }
    if (typeof role !== "string" || !Array.isArray(options)) return []
    return [{ role, options: options.filter((o): o is string => typeof o === "string") }]
  })
}

const truthy = (value: unknown) => value === true || value === "true"

export function readDiscountSettings(
  storeMetadata: Record<string, unknown> | null | undefined,
  kurtiMetadata: Record<string, unknown> | null | undefined
): LookDiscountSettings {
  const type = storeMetadata?.ctl_discount_type === "fixed" ? "fixed" : "percentage"
  const value = Number(storeMetadata?.ctl_discount_value ?? 0)
  const enabled =
    truthy(storeMetadata?.ctl_discount_enabled) &&
    truthy(kurtiMetadata?.ctl_discount_enabled) &&
    Number.isFinite(value) &&
    value > 0
  return { enabled, type, value: enabled ? value : 0 }
}

/** Discounted unit price for a matching piece, rounded to paise and never below zero. */
export function discountedPrice(price: number, settings: LookDiscountSettings): number {
  if (!settings.enabled) return price
  const off = settings.type === "percentage" ? (price * Math.min(settings.value, 100)) / 100 : settings.value
  return Math.max(0, Math.round((price - off) * 100) / 100)
}

type CartLine = {
  id: string
  quantity: number
  metadata?: Record<string, unknown> | null
  product?: { metadata?: Record<string, unknown> | null } | null
  title?: string | null
}

/**
 * Checks a cart against the Complete the Look rules. Returns the problems
 * found; an empty list means the cart may be completed.
 */
export function findLookProblems(items: CartLine[]): string[] {
  const problems: string[] = []
  const mains = new Map<string, CartLine>()
  for (const item of items) {
    const key = item.metadata?.set_key
    if (typeof key === "string" && item.metadata?.set_role === "main") mains.set(key, item)
  }
  for (const item of items) {
    const meta = item.metadata ?? {}
    const isPiece = typeof meta.set_key === "string" && meta.set_role !== "main"
    if (isPiece) {
      const main = mains.get(meta.set_key as string)
      if (!main) {
        problems.push(`${item.title ?? "A matching piece"} can only be bought with its kurti`)
      } else if (Number(item.quantity) > Number(main.quantity)) {
        problems.push(`${item.title ?? "A matching piece"} cannot exceed the quantity of its kurti`)
      }
    } else if (item.product?.metadata?.set_only === true) {
      problems.push(`${item.title ?? "This piece"} is sold only as part of a look`)
    }
  }
  return problems
}
