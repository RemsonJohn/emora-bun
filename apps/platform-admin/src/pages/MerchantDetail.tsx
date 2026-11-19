import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowLeft, Check, Copy, ExternalLink, KeyRound, Pencil, RefreshCw } from "lucide-react"
import { ApiError, api, type AuditEvent, type Me, type Merchant } from "@/lib/api"
import { ago, dateTime, hostOf, initials, isStale, money } from "@/lib/format"
import { Link } from "@/lib/router"
import { ActivityList } from "@/components/ActivityList"
import { MerchantForm } from "@/components/MerchantForm"
import { SlidingPills } from "@/components/SlidingPills"
import { ZoomDialog } from "@/components/ZoomDialog"
import { Button, Card, Field, Skeleton, StatusBadge, Switch, inputClass } from "@/components/ui"

type Tab = "overview" | "features" | "access" | "activity"

const FEATURES: { key: string; label: string; body: string; enforced: boolean }[] = [
  { key: "customisation", label: "Product customisation", body: "Names, numbers, colours and logos on customisable products.", enforced: true },
  { key: "complete_the_look", label: "Complete the Look", body: "Sell a kurti with its matching pieces as one look.", enforced: true },
  { key: "bulk_orders", label: "Bulk team orders", body: "Team quote requests saved for the shop to follow up.", enforced: true },
  { key: "reviews", label: "Product reviews", body: "Shown by the storefront when it supports reviews.", enforced: false },
  { key: "wishlist", label: "Wishlist", body: "Saved pieces on the shopper's device.", enforced: false },
  { key: "video_spotlight", label: "Video spotlight", body: "Short product clips on the storefront.", enforced: false },
]

/** Public-site captures for the storefront preview (saved images, not live). */
const PREVIEWS: Record<string, { desktop: string; mobile: string; captured: string }> = {
  "sagar-sportz": { desktop: "/previews/sagar-desktop.png", mobile: "/previews/sagar-mobile.png", captured: "19 Nov 2026" },
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-line p-3.5">
      <p className="text-[12px] text-muted">{label}</p>
      <p className="mt-1 text-[20px] leading-none font-semibold tracking-tight tabular-nums">{value}</p>
      {hint && <p className="mt-1.5 text-[12px] text-muted">{hint}</p>}
    </div>
  )
}

export function MerchantDetail({ id, me }: { id: string; me: Me }) {
  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>("overview")
  const [checking, setChecking] = useState(false)
  const [events, setEvents] = useState<AuditEvent[] | null>(null)
  const [dialog, setDialog] = useState<null | "edit" | "secret" | "preview-desktop" | "preview-mobile">(null)
  const [origin, setOrigin] = useState<HTMLElement | null>(null)
  const isAdmin = me.user.role === "admin"

  const open = (which: NonNullable<typeof dialog>) => (e: React.MouseEvent<HTMLElement>) => {
    setOrigin(e.currentTarget)
    setDialog(which)
  }

  const load = useCallback(async () => {
    try {
      setMerchant((await api.merchant(id)).merchant)
    } catch (err) {
      setError(err instanceof ApiError && err.status === 404 ? "This merchant does not exist." : "Could not load this merchant.")
    }
  }, [id])

  const loadEvents = useCallback(async () => {
    setEvents((await api.activity(id)).events)
  }, [id])

  useEffect(() => {
    void load()
  }, [load])
  useEffect(() => {
    if (tab === "activity") void loadEvents()
  }, [tab, loadEvents])

  const recheck = async () => {
    setChecking(true)
    try {
      setMerchant((await api.check(id)).merchant)
    } finally {
      setChecking(false)
    }
  }

  if (error) {
    return (
      <div className="py-20 text-center">
        <p className="font-medium">{error}</p>
        <Link to="/merchants" className="mt-3 inline-block text-accent hover:underline">Back to merchants</Link>
      </div>
    )
  }

  const m = merchant
  const stale = m?.check_status === "connected" && isStale(m.checked_at)
  const preview = m ? PREVIEWS[m.handle] : undefined
  const s = m?.summary

  return (
    <div>
      <Link to="/merchants" className="inline-flex items-center gap-1 text-muted hover:text-ink">
        <ArrowLeft className="size-3.5" /> Merchants
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {m ? (
            <span aria-hidden="true" className="grid size-10 place-items-center rounded-lg bg-accent-soft text-[14px] font-semibold text-accent">
              {initials(m.name)}
            </span>
          ) : (
            <Skeleton className="size-10 rounded-lg" />
          )}
          <div>
            {m ? <h1 className="text-[22px] leading-tight font-semibold tracking-tight">{m.name}</h1> : <Skeleton className="h-6 w-48" />}
            <div className="mt-1 flex flex-wrap items-center gap-2 text-muted">
              {m && <StatusBadge status={m.check_status} stale={stale} />}
              {m?.storefront_url && (
                <a href={m.storefront_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-ink">
                  {hostOf(m.storefront_url)} <ExternalLink className="size-3" aria-label="(opens in a new tab)" />
                </a>
              )}
            </div>
          </div>
        </div>
        <Button onClick={() => void recheck()} busy={checking} disabled={!m?.secret_configured}>
          {!checking && <RefreshCw className="size-3.5" />} Recheck now
        </Button>
      </div>

      <div className="mt-6">
        <SlidingPills<Tab>
          variant="tabs"
          label="Merchant sections"
          value={tab}
          onChange={setTab}
          options={[
            { value: "overview", label: "Overview" },
            { value: "features", label: "Features" },
            { value: "access", label: "Owner & access" },
            { value: "activity", label: "Activity" },
          ]}
        />
      </div>

      <div className="mt-6">
        {!m ? (
          <div className="grid gap-4 lg:grid-cols-3" aria-hidden="true">
            <Skeleton className="h-48 lg:col-span-2" />
            <Skeleton className="h-48" />
          </div>
        ) : tab === "overview" ? (
          <div className="grid gap-4 lg:grid-cols-3">
            <Card
              className="lg:col-span-2"
              title="Last 30 days"
              actions={s && <span className="text-[12px] text-muted" title={dateTime(s.fetched_at)}>Updated {ago(s.fetched_at)}</span>}
            >
              {s ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <Stat label="Orders" value={String(s.orders)} hint={s.canceled ? `${s.canceled} cancelled` : undefined} />
                  <Stat label="Order value" value={money(s.revenue_total)} hint="GST included" />
                  <Stat label="Payment collected" value={money(s.revenue_collected)} />
                  <Stat label="COD to collect" value={money(s.cod_to_collect)} />
                  <Stat label="Awaiting review" value={String(s.awaiting_review)} hint="Custom orders" />
                  <Stat label="Open enquiries" value={String(s.open_enquiries)} hint="Bulk quotes" />
                </div>
              ) : (
                <p className="text-muted">
                  No figures yet. They appear after the first successful connection check.
                </p>
              )}
              {s?.last_order_at && <p className="mt-3 text-[12px] text-muted">Last order {ago(s.last_order_at)}</p>}
            </Card>

            <Card
              title="Connection"
              actions={isAdmin && (
                <Button variant="ghost" onClick={open("edit")}>
                  <Pencil className="size-3.5" /> Edit
                </Button>
              )}
            >
              <dl className="space-y-2.5">
                <div className="flex justify-between gap-3"><dt className="text-muted">Status</dt><dd><StatusBadge status={m.check_status} stale={stale} /></dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted">Last checked</dt><dd title={dateTime(m.checked_at)}>{ago(m.checked_at)}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted">Response</dt><dd className="tabular-nums">{m.check_latency_ms != null ? `${m.check_latency_ms} ms` : "—"}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted">Backend</dt><dd className="truncate">{hostOf(m.backend_url) ?? "Not set"}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted">Hosting</dt><dd>{m.storefront_host ?? "—"} · {m.backend_host ?? "—"}</dd></div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Shared secret</dt>
                  <dd>{m.secret_configured ? `Set ${ago(m.secret_set_at)}` : "Not set"}</dd>
                </div>
              </dl>
              {m.check_error && <p role="status" className="mt-3 rounded-md bg-bad-soft px-3 py-2 text-[12px] text-bad">{m.check_error}</p>}
              {isAdmin && (
                <Button className="mt-4 w-full" onClick={open("secret")}>
                  <KeyRound className="size-3.5" /> {m.secret_configured ? "Replace shared secret" : "Add shared secret"}
                </Button>
              )}
            </Card>

            <Card className="lg:col-span-3" title="Storefront" actions={preview && <span className="text-[12px] text-muted">Saved capture of the public site, {preview.captured}</span>}>
              {preview ? (
                <div className="flex flex-wrap items-end gap-4">
                  <button
                    type="button"
                    onClick={open("preview-desktop")}
                    aria-label={`Enlarge desktop capture of ${m.name}`}
                    className="group relative overflow-hidden rounded-lg border border-line"
                  >
                    <img src={preview.desktop} alt="" className="h-44 w-auto object-cover object-top transition-transform duration-300 ease-out-expo group-hover:scale-[1.02]" />
                  </button>
                  <button
                    type="button"
                    onClick={open("preview-mobile")}
                    aria-label={`Enlarge mobile capture of ${m.name}`}
                    className="group relative overflow-hidden rounded-lg border border-line"
                  >
                    <img src={preview.mobile} alt="" className="h-44 w-auto object-cover object-top transition-transform duration-300 ease-out-expo group-hover:scale-[1.02]" />
                  </button>
                </div>
              ) : (
                <p className="text-muted">No capture yet. Live previews will come with the capture job.</p>
              )}
            </Card>
          </div>
        ) : tab === "features" ? (
          <Features merchant={m} isAdmin={isAdmin} onChange={(features) => setMerchant({ ...m, features })} />
        ) : tab === "access" ? (
          <OwnerAccess merchant={m} isAdmin={isAdmin} />
        ) : (
          <Card title="Activity">
            <ActivityList events={events} />
          </Card>
        )}
      </div>

      {m && (
        <>
          <ZoomDialog open={dialog === "edit"} onClose={() => setDialog(null)} origin={origin} title="Edit merchant" size="lg">
            <MerchantForm
              initial={m}
              submitLabel="Save changes"
              onCancel={() => setDialog(null)}
              onSubmit={async (input) => {
                const { merchant } = await api.updateMerchant(m.id, input)
                setMerchant(merchant)
                setDialog(null)
              }}
            />
          </ZoomDialog>
          <ZoomDialog open={dialog === "secret"} onClose={() => setDialog(null)} origin={origin} title="Shared secret" size="md">
            <SecretForm
              merchant={m}
              onDone={async () => {
                setDialog(null)
                await recheck()
              }}
              onCancel={() => setDialog(null)}
            />
          </ZoomDialog>
          {preview && (
            <>
              <ZoomDialog open={dialog === "preview-desktop"} onClose={() => setDialog(null)} origin={origin} title={`${m.name}, desktop capture`} size="full" bare>
                <img src={preview.desktop} alt={`${m.name} storefront on desktop, captured ${preview.captured}`} className="block w-full" />
              </ZoomDialog>
              <ZoomDialog open={dialog === "preview-mobile"} onClose={() => setDialog(null)} origin={origin} title={`${m.name}, mobile capture`} size="sm" bare>
                <img src={preview.mobile} alt={`${m.name} storefront on mobile, captured ${preview.captured}`} className="block w-full" />
              </ZoomDialog>
            </>
          )}
        </>
      )}
    </div>
  )
}

function SecretForm({ merchant, onDone, onCancel }: { merchant: Merchant; onDone: () => void; onCancel: () => void }) {
  const [secret, setSecret] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setError(null)
        try {
          await api.setSecret(merchant.id, secret)
          onDone()
        } catch (err) {
          setError(err instanceof ApiError ? err.message : "Could not save")
        } finally {
          setBusy(false)
        }
      }}
      className="space-y-4"
    >
      <p className="text-muted">
        Paste the <code className="rounded bg-soft px-1">PLATFORM_SHARED_SECRET</code> from this shop's backend settings. It is stored encrypted and can only be replaced, never shown again.
      </p>
      <Field label="Shared secret" htmlFor="secret" error={error ?? undefined}>
        <input id="secret" type="password" autoComplete="off" minLength={32} required value={secret} onChange={(e) => setSecret(e.target.value)} className={inputClass} />
      </Field>
      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" busy={busy}>Save and check</Button>
      </div>
    </form>
  )
}

function Features({ merchant, isAdmin, onChange }: { merchant: Merchant; isAdmin: boolean; onChange: (f: Record<string, boolean>) => void }) {
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const known = merchant.features

  if (!known) {
    return <Card><p className="text-muted">Feature switches appear once the shop is connected.</p></Card>
  }

  const toggle = async (key: string, next: boolean) => {
    setSaving(key)
    setError(null)
    onChange({ ...known, [key]: next })
    try {
      const { features } = await api.setFeatures(merchant.id, { [key]: next })
      onChange(features)
    } catch (err) {
      onChange(known)
      setError(err instanceof ApiError ? err.message : "The shop could not be updated")
    } finally {
      setSaving(null)
    }
  }

  return (
    <Card title="Features" actions={<span className="text-[12px] text-muted">Changes apply to the shop immediately</span>}>
      {error && <p role="alert" className="mb-4 rounded-md bg-bad-soft px-3 py-2 text-bad">{error}</p>}
      <ul className="divide-y divide-line">
        {FEATURES.map((f) => (
          <li key={f.key} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
            <div>
              <p className="font-medium">{f.label}</p>
              <p className="text-muted">
                {f.body} <span className="text-[12px]">{f.enforced ? "Enforced by the shop's backend." : "Storefront setting."}</span>
              </p>
            </div>
            <Switch
              label={f.label}
              checked={known[f.key] !== false}
              disabled={!isAdmin || saving === f.key}
              onChange={(next) => void toggle(f.key, next)}
            />
          </li>
        ))}
      </ul>
      {!isAdmin && <p className="mt-4 text-[12px] text-muted">Only platform admins can change features.</p>}
    </Card>
  )
}

function OwnerAccess({ merchant, isAdmin }: { merchant: Merchant; isAdmin: boolean }) {
  const [email, setEmail] = useState(merchant.owner_email ?? "")
  const [result, setResult] = useState<{ url: string; expires: string; email: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const linkRef = useRef<HTMLInputElement>(null)

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2" title="Invite the owner">
        <p className="text-muted">
          Creates an administrator invitation on {merchant.name}'s own backend. The owner opens the link, chooses their password and signs in to their merchant dashboard. Emora never sees their password.
        </p>
        {result ? (
          <div className="mt-4 space-y-3" role="status">
            <p>
              Invitation for <span className="font-medium">{result.email}</span>, valid until {dateTime(result.expires)}. Send this link to them yourself; it is shown only once.
            </p>
            <div className="flex gap-2">
              <input ref={linkRef} readOnly value={result.url} onFocus={(e) => e.currentTarget.select()} className={`${inputClass} font-mono text-[12px]`} aria-label="Invitation link" />
              <Button
                onClick={async () => {
                  await navigator.clipboard.writeText(result.url)
                  setCopied(true)
                  window.setTimeout(() => setCopied(false), 1500)
                }}
              >
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <Button variant="ghost" onClick={() => setResult(null)}>Create another</Button>
          </div>
        ) : (
          <form
            className="mt-4 flex flex-wrap items-end gap-2"
            onSubmit={async (e) => {
              e.preventDefault()
              setBusy(true)
              setError(null)
              try {
                const r = await api.ownerInvite(merchant.id, email)
                setResult({ url: r.invite_url, expires: r.invite.expires_at, email: r.invite.email })
              } catch (err) {
                setError(err instanceof ApiError ? err.message : "Could not create the invitation")
              } finally {
                setBusy(false)
              }
            }}
          >
            <div className="min-w-64 flex-1">
              <Field label="Owner email" htmlFor="owner-email" error={error ?? undefined}>
                <input id="owner-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={!isAdmin} className={inputClass} />
              </Field>
            </div>
            <Button type="submit" variant="primary" busy={busy} disabled={!isAdmin || !merchant.secret_configured}>
              Create invitation link
            </Button>
          </form>
        )}
      </Card>
      <Card title="How access works">
        <ul className="list-disc space-y-1.5 pl-4 text-muted">
          <li>Owners manage products, orders and media in their merchant dashboard, not here.</li>
          <li>Automatic invitation emails come later; for now staff send the link.</li>
          <li>Each new invitation is recorded in Activity, without the link.</li>
        </ul>
      </Card>
    </div>
  )
}
