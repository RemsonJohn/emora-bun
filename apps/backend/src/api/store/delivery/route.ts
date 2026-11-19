import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type PriceRow = {
  amount: number
  currency_code?: string | null
  price_rules?: ({ attribute?: string; operator?: string; value?: string | number } | null)[] | null
}

/**
 * Delivery charges for India, read from the shop's standard shipping option,
 * so storefront copy follows what the merchant sets in Admin:
 * - flat: the charge below the free-delivery threshold (rupees)
 * - free_above: order value (items, GST included) from which delivery is free, or null
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "type.code", "service_zone.geo_zones.country_code", "prices.*", "prices.price_rules.*"],
  })
  const india = data.find(
    (o) =>
      o.type?.code === "standard" &&
      (o.service_zone?.geo_zones ?? []).some((z) => z?.country_code === "in")
  )
  const prices = ((india as { prices?: PriceRow[] } | undefined)?.prices ?? []).filter(
    (p) => !p.currency_code || p.currency_code === "inr"
  )
  const flat = prices.find((p) => !p.price_rules?.length)?.amount ?? null
  const thresholds = prices
    .filter((p) => Number(p.amount) === 0)
    .flatMap((p) => p.price_rules ?? [])
    .filter((r) => r?.attribute === "item_total" && (r.operator === "gte" || r.operator === "gt"))
    .map((r) => Number(r!.value))
    .filter((n) => Number.isFinite(n))

  res.setHeader("Cache-Control", "public, max-age=300")
  return res.json({
    currency: "inr",
    india: {
      flat: flat === null ? null : Number(flat),
      free_above: thresholds.length ? Math.min(...thresholds) : null,
    },
    international: { quoted: true },
  })
}
