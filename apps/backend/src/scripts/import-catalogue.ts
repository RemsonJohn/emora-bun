import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError, PriceListStatus, ProductStatus } from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"
import {
  createInventoryLevelsWorkflow,
  createPriceListsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"

/**
 * Imports a shop catalogue exported by its storefront (catalogue.json) into
 * that shop's backend. Safe to run again: products and categories that
 * already exist (same handle) are left untouched.
 *
 *   bun run shop sagar exec ./src/scripts/import-catalogue.ts <path to catalogue.json>
 *
 * Prices are in rupees and include GST. A variant's sale_price goes into an
 * active "Sale" price list, so the storefront can show the original price.
 */
const variantSchema = z.object({
  title: z.string().min(1),
  sku: z.string().min(1),
  options: z.record(z.string(), z.string()),
  price: z.number().nonnegative(),
  sale_price: z.number().nonnegative().optional(),
  manage_inventory: z.boolean(),
  stock: z.number().int().nonnegative().default(0),
})

const catalogueSchema = z.object({
  version: z.literal(1),
  shop: z.string().min(1),
  store_metadata: z.record(z.string(), z.unknown()).optional(),
  categories: z.array(
    z.object({
      handle: z.string().min(1),
      name: z.string().min(1),
      rank: z.number().int().optional(),
      description: z.string().optional(),
    })
  ),
  products: z.array(
    z.object({
      handle: z.string().min(1),
      title: z.string().min(1),
      subtitle: z.string().optional(),
      description: z.string().optional(),
      category_handles: z.array(z.string()).default([]),
      thumbnail: z.string().optional(),
      images: z.array(z.string()).default([]),
      options: z.array(z.object({ title: z.string(), values: z.array(z.string()).min(1) })).min(1),
      variants: z.array(variantSchema).min(1),
      metadata: z.record(z.string(), z.unknown()).default({}),
    })
  ),
})

export default async function importCatalogue({ container, args }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const file = args[0]
  if (!file) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Pass the path to catalogue.json")
  const catalogue = catalogueSchema.parse(JSON.parse(readFileSync(resolve(file), "utf8")))

  const expectedShop = process.env.EMORA_SHOP
  if (expectedShop && expectedShop !== catalogue.shop) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, `This catalogue is for "${catalogue.shop}", but the backend is running for "${expectedShop}"`)
  }

  const { data: stores } = await query.graph({
    entity: "store",
    fields: ["id", "metadata", "default_sales_channel_id"],
  })
  const store = stores[0]
  const salesChannelId = store.default_sales_channel_id
  if (!salesChannelId) throw new MedusaError(MedusaError.Types.INVALID_DATA, "The store has no default sales channel; run db:migrate first")

  if (catalogue.store_metadata) {
    // Only add missing keys, so settings a merchant changed are kept.
    const missing = Object.fromEntries(
      Object.entries(catalogue.store_metadata).filter(([key]) => store.metadata?.[key] === undefined)
    )
    if (Object.keys(missing).length) {
      await updateStoresWorkflow(container).run({
        input: { selector: { id: store.id }, update: { metadata: { ...(store.metadata ?? {}), ...missing } } },
      })
    }
  }

  const { data: shippingProfiles } = await query.graph({ entity: "shipping_profile", fields: ["id", "type"] })
  const shippingProfile = shippingProfiles.find((p) => p.type === "default") ?? shippingProfiles[0]

  const { data: stockLocations } = await query.graph({ entity: "stock_location", fields: ["id"] })
  const stockLocation = stockLocations[0]

  // Categories
  const { data: existingCategories } = await query.graph({ entity: "product_category", fields: ["id", "handle"] })
  const categoryIds = new Map(existingCategories.map((c) => [c.handle, c.id]))
  const newCategories = catalogue.categories.filter((c) => !categoryIds.has(c.handle))
  if (newCategories.length) {
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: newCategories.map((c) => ({
          name: c.name,
          handle: c.handle,
          description: c.description,
          rank: c.rank,
          is_active: true,
        })),
      },
    })
    result.forEach((c) => categoryIds.set(c.handle, c.id))
  }
  logger.info(`Categories: ${newCategories.length} created, ${catalogue.categories.length - newCategories.length} already present`)

  // Products
  const { data: existingProducts } = await query.graph({ entity: "product", fields: ["handle"] })
  const existingHandles = new Set(existingProducts.map((p) => p.handle))
  const toCreate = catalogue.products.filter((p) => !existingHandles.has(p.handle))

  const batchSize = 20
  const salePrices: { sku: string; amount: number }[] = []
  for (let i = 0; i < toCreate.length; i += batchSize) {
    const batch = toCreate.slice(i, i + batchSize)
    const { result: created } = await createProductsWorkflow(container).run({
      input: {
        products: batch.map((p) => ({
          title: p.title,
          subtitle: p.subtitle,
          handle: p.handle,
          description: p.description,
          status: ProductStatus.PUBLISHED,
          thumbnail: p.thumbnail,
          images: p.images.map((url) => ({ url })),
          category_ids: p.category_handles.map((h) => categoryIds.get(h)).filter((id): id is string => Boolean(id)),
          shipping_profile_id: shippingProfile.id,
          sales_channels: [{ id: salesChannelId }],
          metadata: p.metadata,
          options: p.options,
          variants: p.variants.map((v) => ({
            title: v.title,
            sku: v.sku,
            options: v.options,
            manage_inventory: v.manage_inventory,
            prices: [{ currency_code: "inr", amount: v.price }],
          })),
        })),
      },
    })
    for (const p of batch) {
      for (const v of p.variants) {
        if (v.sale_price !== undefined && v.sale_price < v.price) salePrices.push({ sku: v.sku, amount: v.sale_price })
      }
    }
    logger.info(`Products: created ${created.length} (${Math.min(i + batchSize, toCreate.length)}/${toCreate.length})`)
  }

  const createdSkus = toCreate.flatMap((p) => p.variants.map((v) => v.sku))
  if (!createdSkus.length) {
    logger.info("No new products to import.")
    return
  }

  const { data: variants } = await query.graph({
    entity: "variant",
    fields: ["id", "sku", "manage_inventory", "inventory_items.inventory_item_id"],
    filters: { sku: createdSkus },
  })
  const variantBySku = new Map(variants.map((v) => [v.sku, v]))

  // Stock at the shop's warehouse for variants whose inventory is tracked.
  const stockBySku = new Map(toCreate.flatMap((p) => p.variants.map((v) => [v.sku, v.stock] as const)))
  const levels = variants.flatMap((v) =>
    v.manage_inventory
      ? (v.inventory_items ?? []).map((item) => ({
          inventory_item_id: item!.inventory_item_id,
          location_id: stockLocation.id,
          stocked_quantity: stockBySku.get(v.sku!) ?? 0,
        }))
      : []
  )
  if (levels.length) {
    await createInventoryLevelsWorkflow(container).run({ input: { inventory_levels: levels } })
  }
  logger.info(`Stock levels set for ${levels.length} variants`)

  if (salePrices.length) {
    await createPriceListsWorkflow(container).run({
      input: {
        price_lists_data: [
          {
            title: "Sale",
            description: `Sale prices imported from the ${catalogue.shop} catalogue`,
            status: PriceListStatus.ACTIVE,
            prices: salePrices
              .filter((s) => variantBySku.has(s.sku))
              .map((s) => ({ variant_id: variantBySku.get(s.sku)!.id, amount: s.amount, currency_code: "inr" })),
          },
        ],
      },
    })
    logger.info(`Sale prices: ${salePrices.length} variants`)
  }

  logger.info("Catalogue import finished.")
}
