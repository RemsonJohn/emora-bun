import type { AuditEvent } from "@/lib/api"
import { ago, dateTime } from "@/lib/format"
import { Skeleton } from "./ui"

const FEATURE_LABELS: Record<string, string> = {
  customisation: "Product customisation",
  complete_the_look: "Complete the Look",
  bulk_orders: "Bulk team orders",
  reviews: "Product reviews",
  wishlist: "Wishlist",
  video_spotlight: "Video spotlight",
}

export function describe(e: AuditEvent) {
  const d = (e.details ?? {}) as Record<string, unknown>
  switch (e.action) {
    case "merchant.created":
      return "Added the merchant"
    case "merchant.updated":
      return `Updated ${Array.isArray(d.fields) ? (d.fields as string[]).map((f) => f.replace(/_/g, " ")).join(", ") : "details"}`
    case "merchant.secret_set":
      return "Set the shared secret"
    case "merchant.features_changed": {
      const changes = Object.entries((d.changes ?? {}) as Record<string, boolean>)
      return changes.length
        ? changes.map(([k, on]) => `${on ? "Turned on" : "Turned off"} ${FEATURE_LABELS[k] ?? k}`).join(", ")
        : "Changed features"
    }
    case "merchant.owner_invited":
      return `Created an owner invitation for ${String(d.email ?? "")}`
    default:
      return e.action
  }
}

export function ActivityList({
  events,
  merchantNames,
}: {
  events: AuditEvent[] | null
  merchantNames?: Record<string, string>
}) {
  if (events === null) {
    return (
      <ul className="space-y-3" aria-hidden="true">
        {Array.from({ length: 4 }, (_, i) => (
          <li key={i} className="flex gap-3">
            <Skeleton className="mt-1 size-2 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-3.5 w-64" />
              <Skeleton className="mt-1.5 h-3 w-32" />
            </div>
          </li>
        ))}
      </ul>
    )
  }
  if (events.length === 0) return <p className="text-muted">Nothing has happened here yet.</p>
  return (
    <ol className="relative space-y-4 border-l border-line pl-5">
      {events.map((e) => (
        <li key={e.id} className="relative">
          <span aria-hidden="true" className="absolute top-1.5 -left-[24.5px] size-2 rounded-full border-2 border-surface bg-accent" />
          <p>
            {merchantNames && e.merchant_id && merchantNames[e.merchant_id] && (
              <span className="font-medium">{merchantNames[e.merchant_id]}: </span>
            )}
            {describe(e)}
          </p>
          <p className="text-[12px] text-muted" title={dateTime(e.created_at)}>
            {e.actor_email ?? "System"} · {ago(e.created_at)}
          </p>
        </li>
      ))}
    </ol>
  )
}

export { FEATURE_LABELS }
