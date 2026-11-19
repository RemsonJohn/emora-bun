import { randomBytes } from "node:crypto"
import { signRequest } from "./platform-signature"

/**
 * Signed calls from the platform to a shop backend's /platform API. Only
 * backends whose origin is listed in ALLOWED_SHOP_ORIGINS can be called, so a
 * merchant record cannot point the platform at an arbitrary address.
 */
export class ShopCallError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message)
  }
}

export function allowedOrigin(backendUrl: string) {
  let origin: string
  try {
    origin = new URL(backendUrl).origin
  } catch {
    return false
  }
  const allowed = (process.env.ALLOWED_SHOP_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter(Boolean)
  return allowed.includes(origin)
}

export async function callShop<T>(
  backendUrl: string,
  secret: string,
  path: string,
  init: { method?: "GET" | "POST"; body?: unknown; timeoutMs?: number } = {}
): Promise<{ data: T; latencyMs: number }> {
  if (!allowedOrigin(backendUrl)) throw new ShopCallError("This backend address is not on the allowed list")
  const method = init.method ?? "GET"
  const url = new URL(path, backendUrl)
  const body = init.body === undefined ? "" : JSON.stringify(init.body)
  const timestamp = String(Math.floor(Date.now() / 1000))
  const nonce = randomBytes(18).toString("base64url")
  const signature = signRequest(secret, {
    timestamp,
    nonce,
    method,
    path: url.pathname + url.search,
    body: method === "GET" ? "" : body,
  })
  const started = Date.now()
  let response: Response
  try {
    response = await fetch(url, {
      method,
      headers: {
        "content-type": "application/json",
        "x-emora-timestamp": timestamp,
        "x-emora-nonce": nonce,
        "x-emora-signature": signature,
      },
      body: method === "GET" ? undefined : body,
      redirect: "error",
      signal: AbortSignal.timeout(init.timeoutMs ?? 8000),
    })
  } catch (error) {
    throw new ShopCallError(error instanceof Error && error.name === "TimeoutError" ? "The shop did not answer in time" : "Could not reach the shop")
  }
  const latencyMs = Date.now() - started
  const json = (await response.json().catch(() => ({}))) as T & { message?: string }
  if (!response.ok) {
    throw new ShopCallError(
      response.status === 401
        ? "The shop rejected the platform's signature (check the shared secret)"
        : json.message ?? `The shop answered with status ${response.status}`,
      response.status
    )
  }
  return { data: json, latencyMs }
}
