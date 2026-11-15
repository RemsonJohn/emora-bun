import Medusa from "@medusajs/js-sdk";

export const sdk = new Medusa({
  baseUrl: import.meta.env.VITE_MEDUSA_BACKEND_URL || window.location.origin,
  auth: {
    type: "jwt",
    jwtTokenStorageMethod: "session",
    jwtTokenStorageKey: "emora_admin_token",
  },
});
export const api = <T>(path: string, query?: Record<string, unknown>) =>
  sdk.client.fetch<T>(path, { query });
export interface Product {
  id: string;
  title: string;
  handle: string;
  description?: string;
  status: string;
  thumbnail?: string;
  collection_id?: string | null;
  collection?: { id?: string; title: string } | null;
  images?: { id?: string; url: string }[];
  options?: { id: string; title: string; values?: { id: string; value: string }[] }[];
  variants?: ProductVariant[];
}
export interface ProductVariant {
  id: string;
  title: string;
  sku?: string | null;
  barcode?: string | null;
  hs_code?: string | null;
  weight?: number | null;
  manage_inventory?: boolean;
  allow_backorder?: boolean;
  prices?: { id?: string; currency_code: string; amount: number; min_quantity?: number | null; max_quantity?: number | null; price_list_id?: string | null; price_rules?: { attribute: string; value: string }[] }[];
}
export interface Customer {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  created_at: string;
}
export interface Order {
  id: string;
  display_id: number;
  email: string;
  created_at: string;
  currency_code: string;
  total: number;
  status: string;
  metadata?: Record<string, unknown> | null;
  payment_status: string;
  fulfillment_status: string;
  subtotal?: number;
  discount_total?: number;
  shipping_total?: number;
  tax_total?: number;
  billing_address?: {
    first_name?: string;
    last_name?: string;
    address_1?: string;
    address_2?: string;
    city?: string;
    province?: string;
    postal_code?: string;
    country_code?: string;
  };
  items?: {
    id: string;
    title: string;
    quantity: number;
    unit_price: number;
    total?: number;
  }[];
}
export const money = (value: number, currency = "inr") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 2,
  }).format(value || 0);
export const date = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
export const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : "Something went wrong. Please try again.";
export const demoProducts: Product[] = [
  {
    id: "demo_1",
    title: "Essential linen shirt",
    handle: "linen-shirt",
    status: "published",
    collection: { title: "Everyday essentials" },
    variants: [
      { id: "v1", title: "Natural / M", sku: "LIN-NAT-M" },
      { id: "v2", title: "Natural / L", sku: "LIN-NAT-L" },
    ],
  },
  {
    id: "demo_2",
    title: "Classic cotton tee",
    handle: "cotton-tee",
    status: "published",
    collection: { title: "Everyday essentials" },
    variants: [{ id: "v3", title: "Olive / M", sku: "TEE-OLV-M" }],
  },
  {
    id: "demo_3",
    title: "Relaxed fit trousers",
    handle: "trousers",
    status: "published",
    collection: { title: "New arrivals" },
    variants: [{ id: "v4", title: "Sand / 32", sku: "TRS-SND-32" }],
  },
  {
    id: "demo_4",
    title: "Weekend overshirt",
    handle: "overshirt",
    status: "draft",
    variants: [{ id: "v5", title: "Charcoal / L", sku: "OVR-CHR-L" }],
  },
];
export const demoOrders: Order[] = Array.from({ length: 24 }, (_, i) => ({
  id: `demo_order_${i}`,
  display_id: 1048 - i,
  email: [
    "aisha@example.com",
    "arjun@example.com",
    "meera@example.com",
    "rahul@example.com",
  ][i % 4],
  created_at: new Date(Date.now() - i * 3.8 * 3600000).toISOString(),
  currency_code: "inr",
  total: [2490, 1890, 4290, 1290, 3490][i % 5],
  status: "pending",
  payment_status: i % 6 === 0 ? "awaiting" : "captured",
  fulfillment_status: i % 3 === 0 ? "fulfilled" : "not_fulfilled",
  items: [
    {
      id: `line_${i}`,
      title: demoProducts[i % 4].title,
      quantity: 1,
      unit_price: [2490, 1890, 4290, 1290, 3490][i % 5],
    },
  ],
}));
export const demoCustomers: Customer[] = [
  "Aisha Menon",
  "Arjun Nair",
  "Meera Shah",
  "Rahul Kumar",
].map((name, i) => ({
  id: `demo_customer_${i}`,
  first_name: name.split(" ")[0],
  last_name: name.split(" ")[1],
  email: demoOrders[i].email,
  phone: "+91 90000 00000",
  created_at: demoOrders[i].created_at,
}));
