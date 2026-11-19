/**
 * Client for the Emora platform API. Signed-in staff use Medusa's session
 * cookie (httpOnly, SameSite=strict), so no token is kept in the browser.
 */
export class ApiError extends Error {
  readonly status: number
  readonly type?: string
  constructor(message: string, status: number, type?: string) {
    super(message)
    this.status = status
    this.type = type
  }
}

async function request<T>(path: string, init: { method?: string; body?: unknown; token?: string } = {}): Promise<T> {
  const response = await fetch(path, {
    method: init.method ?? "GET",
    credentials: "same-origin",
    headers: {
      ...(init.body !== undefined ? { "content-type": "application/json" } : {}),
      ...(init.token ? { authorization: `Bearer ${init.token}` } : {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  })
  const json = (await response.json().catch(() => ({}))) as { message?: string; type?: string }
  if (!response.ok) throw new ApiError(json.message ?? "Something went wrong", response.status, json.type)
  return json as T
}

export type Role = "admin" | "operator" | null

export type Me = {
  user: { id: string; email: string; first_name: string | null; last_name: string | null; role: Role }
  mfa_enabled: boolean
}

export type Summary = {
  currency: string
  days: number
  orders: number
  canceled: number
  revenue_total: number
  revenue_collected: number
  cod_to_collect: number
  awaiting_review: number
  open_enquiries: number
  last_order_at: string | null
  fetched_at: string
}

export type Merchant = {
  id: string
  name: string
  handle: string
  status: "draft" | "active" | "suspended"
  owner_email: string | null
  storefront_url: string | null
  storefront_host: string | null
  backend_url: string | null
  backend_host: string | null
  dashboard_url: string | null
  notes: string | null
  secret_configured: boolean
  secret_set_at: string | null
  check_status: "not_checked" | "connected" | "needs_attention"
  checked_at: string | null
  check_latency_ms: number | null
  check_error: string | null
  summary: Summary | null
  features: Record<string, boolean> | null
  created_at: string
}

export type AuditEvent = {
  id: string
  actor_email: string | null
  merchant_id: string | null
  action: string
  details: Record<string, unknown> | null
  created_at: string
}

export type MerchantInput = Partial<
  Pick<
    Merchant,
    "name" | "handle" | "status" | "owner_email" | "storefront_url" | "storefront_host" | "backend_url" | "backend_host" | "dashboard_url" | "notes"
  >
>

export const api = {
  /* Sign-in: password, then (when enabled) a 2FA code, then a cookie session. */
  signIn: (email: string, password: string) =>
    request<{ token: string; mfa_required?: boolean; mfa_challenge?: { id: string } }>("/auth/user/emailpass", {
      method: "POST",
      body: { email, password },
    }),
  verifyChallenge: (challengeId: string, token: string, method: "totp" | "recovery_code", code: string) =>
    request<{ token: string }>(`/auth/mfa/challenges/${challengeId}/verify`, { method: "POST", token, body: { method, code } }),
  startSession: (token: string) => request<unknown>("/auth/session", { method: "POST", token }),
  signOut: () => request<unknown>("/auth/session", { method: "DELETE" }),
  me: () => request<Me>("/admin/platform/me"),

  /* Two-factor enrolment for the signed-in staff member. */
  startTotp: (label: string) =>
    request<{ mfa_factor: { id: string }; secret: string; otpauth_url: string }>("/auth/mfa/factors", {
      method: "POST",
      body: { provider: "totp", label, issuer: "Emora Platform" },
    }),
  verifyTotp: (factorId: string, code: string) =>
    request<{ mfa_factor: { status: string } }>(`/auth/mfa/factors/${factorId}/verify`, { method: "POST", body: { code } }),
  recoveryCodes: () => request<{ recovery_codes: string[] }>("/auth/mfa/recovery-codes", { method: "POST", body: {} }),

  /* Merchants */
  merchants: () => request<{ merchants: Merchant[] }>("/admin/platform/merchants"),
  merchant: (id: string) => request<{ merchant: Merchant }>(`/admin/platform/merchants/${id}`),
  createMerchant: (body: MerchantInput) => request<{ merchant: Merchant }>("/admin/platform/merchants", { method: "POST", body }),
  updateMerchant: (id: string, body: MerchantInput) =>
    request<{ merchant: Merchant }>(`/admin/platform/merchants/${id}`, { method: "POST", body }),
  setSecret: (id: string, secret: string) =>
    request<{ secret_configured: boolean }>(`/admin/platform/merchants/${id}/secret`, { method: "POST", body: { secret } }),
  check: (id: string) => request<{ merchant: Merchant }>(`/admin/platform/merchants/${id}/check`, { method: "POST" }),
  setFeatures: (id: string, features: Record<string, boolean>) =>
    request<{ features: Record<string, boolean> }>(`/admin/platform/merchants/${id}/features`, { method: "POST", body: { features } }),
  ownerInvite: (id: string, email: string) =>
    request<{ invite: { email: string; expires_at: string }; invite_url: string }>(`/admin/platform/merchants/${id}/owner-invite`, {
      method: "POST",
      body: { email },
    }),
  activity: (merchantId?: string) =>
    request<{ events: AuditEvent[] }>(`/admin/platform/activity?limit=100${merchantId ? `&merchant_id=${encodeURIComponent(merchantId)}` : ""}`),
}
