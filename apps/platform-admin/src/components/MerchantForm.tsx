import { useState } from "react"
import { ApiError, type Merchant, type MerchantInput } from "@/lib/api"
import { Button, Field, inputClass } from "./ui"

const HOSTS = ["Vercel", "Netlify", "Hostinger VPS", "Local", "Other"]

/** Merchant details and where its systems live. Used for adding and editing. */
export function MerchantForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<Merchant>
  submitLabel: string
  onSubmit: (input: MerchantInput) => Promise<void>
  onCancel: () => void
}) {
  const [v, setV] = useState({
    name: initial?.name ?? "",
    handle: initial?.handle ?? "",
    owner_email: initial?.owner_email ?? "",
    storefront_url: initial?.storefront_url ?? "",
    storefront_host: initial?.storefront_host ?? "",
    backend_url: initial?.backend_url ?? "",
    backend_host: initial?.backend_host ?? "",
    dashboard_url: initial?.dashboard_url ?? "",
  })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const editing = Boolean(initial?.id)

  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.value
    setV((x) => ({
      ...x,
      [k]: value,
      ...(k === "name" && !editing ? { handle: value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) } : {}),
    }))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const blank = (s: string) => (s.trim() ? s.trim() : null)
    try {
      await onSubmit({
        name: v.name.trim(),
        ...(editing ? {} : { handle: v.handle.trim() }),
        owner_email: blank(v.owner_email),
        storefront_url: blank(v.storefront_url),
        storefront_host: blank(v.storefront_host),
        backend_url: blank(v.backend_url),
        backend_host: blank(v.backend_host),
        dashboard_url: blank(v.dashboard_url),
      })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save")
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Business name" htmlFor="m-name">
          <input id="m-name" data-autofocus required minLength={2} maxLength={80} value={v.name} onChange={set("name")} className={inputClass} />
        </Field>
        <Field label="Handle" htmlFor="m-handle" hint={editing ? "Cannot be changed" : "Used in addresses and logs"}>
          <input id="m-handle" required pattern="[a-z0-9-]{2,40}" disabled={editing} value={v.handle} onChange={set("handle")} className={`${inputClass} disabled:bg-soft`} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Owner email" htmlFor="m-owner" hint="The person who will manage products and orders">
            <input id="m-owner" type="email" value={v.owner_email} onChange={set("owner_email")} className={inputClass} />
          </Field>
        </div>
        <Field label="Storefront address" htmlFor="m-sf">
          <input id="m-sf" type="url" placeholder="https://" value={v.storefront_url} onChange={set("storefront_url")} className={inputClass} />
        </Field>
        <Field label="Storefront hosting" htmlFor="m-sfh">
          <select id="m-sfh" value={v.storefront_host} onChange={set("storefront_host")} className={inputClass}>
            <option value="">Not set</option>
            {HOSTS.map((h) => (
              <option key={h}>{h}</option>
            ))}
          </select>
        </Field>
        <Field label="Shop backend address" htmlFor="m-be" hint="Must be on the platform's allowed list">
          <input id="m-be" type="url" placeholder="https://" value={v.backend_url} onChange={set("backend_url")} className={inputClass} />
        </Field>
        <Field label="Backend hosting" htmlFor="m-beh">
          <select id="m-beh" value={v.backend_host} onChange={set("backend_host")} className={inputClass}>
            <option value="">Not set</option>
            {HOSTS.map((h) => (
              <option key={h}>{h}</option>
            ))}
          </select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Merchant dashboard address" htmlFor="m-db">
            <input id="m-db" type="url" placeholder="https://" value={v.dashboard_url} onChange={set("dashboard_url")} className={inputClass} />
          </Field>
        </div>
      </div>
      {error && <p role="alert" className="rounded-md bg-bad-soft px-3 py-2 text-bad">{error}</p>}
      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" busy={busy}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
