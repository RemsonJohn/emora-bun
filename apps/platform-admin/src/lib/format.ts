const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })
export const money = (n: number | null | undefined) => (n == null ? "—" : inr.format(n))

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" })
export function ago(iso: string | null | undefined) {
  if (!iso) return "Never"
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000)
  const abs = Math.abs(seconds)
  if (abs < 45) return "Just now"
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), "minute")
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), "hour")
  return rtf.format(Math.round(seconds / 86400), "day")
}

export const dateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—"

export const hostOf = (url: string | null | undefined) => {
  if (!url) return null
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

/** A check older than 30 minutes is shown as stale rather than as current health. */
export const isStale = (iso: string | null | undefined) => !iso || Date.now() - new Date(iso).getTime() > 30 * 60 * 1000

/** Two-letter initials, skipping small joining words ("Anushq by Dhaksha" -> "AD"). */
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => w && !/^(by|and|of|the|&)$/i.test(w))
    .map((w) => w[0]!.toUpperCase())
    .slice(0, 2)
    .join("")

export const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
