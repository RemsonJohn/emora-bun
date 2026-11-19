import type { Permission } from "./policy"

type Rule = { method: string; pattern: RegExp; permission: Permission }

// Restricted roles use an allowlist. New or unknown routes require explicit review.
const rules: Rule[] = [
  { method: "GET", pattern: /^\/admin\/staff-access\/?$/, permission: "staff.manage" },
  { method: "POST", pattern: /^\/admin\/staff-access\/[^/]+\/?$/, permission: "staff.manage" },
  { method: "GET", pattern: /^\/admin\/(users|invites)(\/[^/]+)*\/?$/, permission: "staff.manage" },
  { method: "POST", pattern: /^\/admin\/(users|invites)(\/[^/]+)*\/?$/, permission: "staff.manage" },
  { method: "DELETE", pattern: /^\/admin\/(users|invites)(\/[^/]+)*\/?$/, permission: "staff.manage" },
  { method: "GET", pattern: /^\/admin\/(products|product-categories|collections|product-tags|product-types)(\/[^/]+)*\/?$/, permission: "products.read" },
  { method: "POST", pattern: /^\/admin\/(products|product-categories|collections|product-tags|product-types)(\/[^/]+)*\/?$/, permission: "products.write" },
  { method: "DELETE", pattern: /^\/admin\/(products|product-categories|collections|product-tags|product-types)(\/[^/]+)*\/?$/, permission: "products.write" },
  { method: "POST", pattern: /^\/admin\/uploads\/?$/, permission: "products.write" },
  { method: "POST", pattern: /^\/admin\/uploads\/presigned-urls\/?$/, permission: "products.write" },
  { method: "GET", pattern: /^\/admin\/(inventory-items|stock-locations)(\/[^/]+)*\/?$/, permission: "inventory.read" },
  { method: "POST", pattern: /^\/admin\/(inventory-items|stock-locations)(\/[^/]+)*\/?$/, permission: "inventory.write" },
  { method: "DELETE", pattern: /^\/admin\/(inventory-items|stock-locations)(\/[^/]+)*\/?$/, permission: "inventory.write" },
  { method: "GET", pattern: /^\/admin\/orders(?:\/[^/]+)?\/?$/, permission: "orders.read" },
  { method: "POST", pattern: /^\/admin\/orders\/[^/]+\/fulfillments\/?$/, permission: "orders.fulfill" },
  { method: "POST", pattern: /^\/admin\/orders\/[^/]+\/fulfillments\/[^/]+\/(shipments|mark-as-delivered)\/?$/, permission: "orders.fulfill" },
  { method: "POST", pattern: /^\/admin\/orders\/[^/]+\/approve\/?$/, permission: "orders.approve" },
  { method: "POST", pattern: /^\/admin\/orders\/[^/]+\/complete\/?$/, permission: "orders.complete" },
  { method: "POST", pattern: /^\/admin\/payments\/[^/]+\/refund\/?$/, permission: "orders.refund" },
  { method: "GET", pattern: /^\/admin\/payments(?:\/[^/]+)?\/?$/, permission: "billing.read" },
  { method: "GET", pattern: /^\/admin\/customers(?:\/[^/]+)?\/?$/, permission: "customers.read" },
  { method: "GET", pattern: /^\/admin\/enquiries(?:\/[^/]+)?\/?$/, permission: "customers.read" },
  { method: "POST", pattern: /^\/admin\/enquiries\/[^/]+\/?$/, permission: "customers.write" },
  { method: "POST", pattern: /^\/admin\/customers(?:\/[^/]+)?\/?$/, permission: "customers.write" },
  { method: "GET", pattern: /^\/admin\/promotions(?:\/[^/]+)?\/?$/, permission: "discounts.read" },
  { method: "POST", pattern: /^\/admin\/promotions(?:\/[^/]+)*\/?$/, permission: "discounts.write" },
  { method: "DELETE", pattern: /^\/admin\/promotions(?:\/[^/]+)*\/?$/, permission: "discounts.write" },
  { method: "GET", pattern: /^\/admin\/(stores|regions|tax-regions|shipping-profiles)(?:\/[^/]+)*\/?$/, permission: "settings.read" },
  { method: "POST", pattern: /^\/admin\/(stores|regions|tax-regions|shipping-profiles)(?:\/[^/]+)*\/?$/, permission: "settings.write" },
]

export function permissionForRequest(method: string, path: string): Permission | undefined {
  return rules.find(rule => rule.method === method.toUpperCase() && rule.pattern.test(path))?.permission
}
