import { MedusaContainer } from "@medusajs/framework";
import { DEFAULT_REGION_STORE_POLICIES } from "../lib/region-store-policies";
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  Modules,
  defaultCountries,
} from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows";

/**
 * Initial setup for one shop's database (runs once, on its first db:migrate).
 *
 * Every Emora shop sells in India in rupees, with prices that include GST
 * (tax rates are added later per shop). Two regions:
 * - India: home delivery with a flat charge below a free-delivery threshold,
 *   cash on delivery and, when configured, Razorpay.
 * - International: every other country. The store quotes delivery and takes
 *   payment separately, so the order is placed with "pay later".
 *
 * Shop-specific values come from the shop's env file (see .env.shop.template).
 * The catalogue is imported separately with src/scripts/import-catalogue.ts.
 */
export default async function initial_data_seed({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(
    ModuleRegistrationName.FULFILLMENT
  );
  const paymentModuleService = container.resolve(Modules.PAYMENT);

  const env = process.env;
  const shopName = env.EMORA_SHOP_NAME || "Emora Shop";
  const flatShipping = Number(env.EMORA_SHIPPING_FLAT_INR ?? 0);
  const freeShippingAbove = Number(env.EMORA_SHIPPING_FREE_ABOVE_INR ?? 0);

  const internationalCountries = defaultCountries
    .map((country) => country.alpha2.toLowerCase())
    .filter((code) => code !== "in");

  const registeredProviders = new Set(
    (await paymentModuleService.listPaymentProviders({}, { select: ["id"] })).map(
      (provider) => provider.id
    )
  );
  const onlyRegistered = (ids: string[]) => ids.filter((id) => registeredProviders.has(id));

  logger.info(`Setting up store "${shopName}"...`);
  const {
    result: [defaultSalesChannel],
  } = await createSalesChannelsWorkflow(container).run({
    input: {
      salesChannelsData: [
        {
          name: `${shopName} storefront`,
          description: "Orders placed on the shop's website",
        },
      ],
    },
  });

  const {
    result: [publishableApiKey],
  } = await createApiKeysWorkflow(container).run({
    input: {
      api_keys: [
        {
          title: `${shopName} storefront key`,
          type: "publishable",
          created_by: "",
        },
      ],
    },
  });

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishableApiKey.id,
      add: [defaultSalesChannel.id],
    },
  });

  await createStoresWorkflow(container).run({
    input: {
      stores: [
        {
          name: shopName,
          supported_currencies: [{ currency_code: "inr", is_default: true }],
          default_sales_channel_id: defaultSalesChannel.id,
        },
      ],
    },
  });

  logger.info("Setting up regions...");
  const { result: regions } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "India",
          currency_code: "inr",
          countries: ["in"],
          is_tax_inclusive: true,
          payment_providers: onlyRegistered(["pp_manual_cod", "pp_razorpay_razorpay"]),
          metadata: {
            ...DEFAULT_REGION_STORE_POLICIES,
            shipping_rate: flatShipping,
          },
        },
        {
          name: "International",
          currency_code: "inr",
          countries: internationalCountries,
          is_tax_inclusive: true,
          payment_providers: onlyRegistered(["pp_manual_paylater"]),
          metadata: {
            ...DEFAULT_REGION_STORE_POLICIES,
            shipping_rate: 0,
            delivery_quoted_separately: true,
          },
        },
      ],
    },
  });
  const india = regions.find((region) => region.name === "India")!;

  await createTaxRegionsWorkflow(container).run({
    input: [{ country_code: "in", provider_id: "tp_system" }],
  });

  logger.info("Setting up the warehouse and delivery...");
  const { result: stockLocations } = await createStockLocationsWorkflow(
    container
  ).run({
    input: {
      locations: [
        {
          name: `${shopName} warehouse`,
          address: {
            address_1: env.EMORA_WAREHOUSE_ADDRESS || "",
            city: env.EMORA_WAREHOUSE_CITY || "",
            province: env.EMORA_WAREHOUSE_PROVINCE || "",
            postal_code: env.EMORA_WAREHOUSE_POSTAL_CODE || "",
            country_code: "IN",
          },
        },
      ],
    },
  });
  const stockLocation = stockLocations[0];

  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
    [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
  });

  // This is created by a migration script in core.
  const { data: shippingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  });
  const shippingProfile = shippingProfiles[0];

  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: `${shopName} delivery`,
    type: "shipping",
    service_zones: [
      {
        name: "India",
        geo_zones: [{ country_code: "in", type: "country" }],
      },
      {
        name: "International",
        geo_zones: internationalCountries.map((country_code) => ({
          country_code,
          type: "country" as const,
        })),
      },
    ],
  });
  const indiaZone = fulfillmentSet.service_zones.find((zone) => zone.name === "India")!;
  const internationalZone = fulfillmentSet.service_zones.find(
    (zone) => zone.name === "International"
  )!;

  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
    [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
  });

  const storeRules = [
    { attribute: "enabled_in_store", value: "true", operator: "eq" as const },
    { attribute: "is_return", value: "false", operator: "eq" as const },
  ];

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Standard delivery",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: indiaZone.id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Standard",
          description: "Delivery within India",
          code: "standard",
        },
        prices: [
          { currency_code: "inr", amount: flatShipping },
          { region_id: india.id, amount: flatShipping },
          ...(freeShippingAbove > 0
            ? [
                {
                  region_id: india.id,
                  amount: 0,
                  rules: [
                    {
                      attribute: "item_total",
                      operator: "gte" as const,
                      value: freeShippingAbove,
                    },
                  ],
                },
              ]
            : []),
        ],
        rules: storeRules,
      },
      {
        name: "International delivery (quoted by the store)",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: internationalZone.id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Quoted",
          description:
            "The store contacts you with the delivery charge and payment details",
          code: "international-quoted",
        },
        prices: [{ currency_code: "inr", amount: 0 }],
        rules: storeRules,
      },
    ],
  });

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [defaultSalesChannel.id],
    },
  });

  logger.info(
    `Store "${shopName}" is ready. Publishable key: ${publishableApiKey.token}`
  );
}
