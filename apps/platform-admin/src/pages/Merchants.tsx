import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ExternalLink, MoreHorizontal, Plus, RefreshCw, Search, Store } from "lucide-react"
import { ApiError, api, type Me, type Merchant } from "@/lib/api"
import { ago, dateTime, hostOf, initials, isStale } from "@/lib/format"
import { Link, useRouter } from "@/lib/router"
import { Menu } from "@/components/Menu"
import { MerchantForm } from "@/components/MerchantForm"
import { SlidingPills } from "@/components/SlidingPills"
import { ZoomDialog } from "@/components/ZoomDialog"
import { Button, Skeleton, StatusBadge } from "@/components/ui"

type Filter = "all" | "attention" | "setup"

const needsAttention = (m: Merchant) => m.check_status === "needs_attention" || (m.check_status === "connected" && isStale(m.checked_at))
const settingUp = (m: Merchant) => m.status === "draft" || !m.secret_configured || !m.backend_url

export function Merchants({ me }: { me: Me }) {
  const { path, navigate } = useRouter()
  const params = new URLSearchParams(path.split("?")[1] ?? "")
  const [merchants, setMerchants] = useState<Merchant[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [query, setQuery] = useState(params.get("q") ?? "")
  const [filter, setFilter] = useState<Filter>((params.get("filter") as Filter) || "all")
  const [adding, setAdding] = useState(false)
  const [checking, setChecking] = useState<string | null>(null)
  const addButton = useRef<HTMLButtonElement>(null)
  const isAdmin = me.user.role === "admin"

  const load = useCallback(async () => {
    setRefreshing(true)
    try {
      setMerchants((await api.merchants()).merchants)
      setError(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load merchants")
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  // Keep search and filter in the URL, so coming back from a merchant restores them.
  useEffect(() => {
    const next = new URLSearchParams()
    if (query) next.set("q", query)
    if (filter !== "all") next.set("filter", filter)
    const url = `/merchants${next.size ? `?${next}` : ""}`
    window.history.replaceState(null, "", url)
  }, [query, filter])

  const counts = useMemo(() => {
    const list = merchants ?? []
    return { all: list.length, attention: list.filter(needsAttention).length, setup: list.filter(settingUp).length }
  }, [merchants])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (merchants ?? [])
      .filter((m) => (filter === "attention" ? needsAttention(m) : filter === "setup" ? settingUp(m) : true))
      .filter((m) => !q || [m.name, m.handle, m.storefront_url, m.owner_email].some((s) => s?.toLowerCase().includes(q)))
  }, [merchants, query, filter])

  const recheck = async (m: Merchant) => {
    setChecking(m.id)
    try {
      const { merchant } = await api.check(m.id)
      setMerchants((list) => list?.map((x) => (x.id === m.id ? merchant : x)) ?? null)
    } finally {
      setChecking(null)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] leading-tight font-semibold tracking-tight">Merchants</h1>
          <p className="mt-0.5 text-muted">Businesses Emora runs shops for, and how their systems are doing.</p>
        </div>
        {isAdmin && (
          <Button ref={addButton} variant="primary" onClick={() => setAdding(true)}>
            <Plus className="size-3.5" /> Add merchant
          </Button>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-line bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <SlidingPills<Filter>
            label="Filter merchants"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All", count: merchants ? counts.all : undefined },
              { value: "attention", label: "Needs attention", count: merchants ? counts.attention : undefined },
              { value: "setup", label: "Setting up", count: merchants ? counts.setup : undefined },
            ]}
          />
          <div className="flex w-full items-center gap-2 sm:w-auto">
            {refreshing && merchants && <span className="text-[12px] text-muted">Updating…</span>}
            <label className="relative w-full sm:w-auto">
              <span className="sr-only">Search merchants</span>
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search merchants"
                className="h-8 w-full rounded-md sm:w-56 border border-line bg-surface pr-2.5 pl-8 placeholder:text-muted/70 focus:border-accent focus:outline-none"
              />
            </label>
          </div>
        </div>

        {error && (
          <div role="alert" className="flex items-center justify-between gap-3 border-b border-line bg-bad-soft px-4 py-2.5 text-bad">
            <span>{error}{merchants ? " Showing the last loaded list." : ""}</span>
            <Button onClick={() => void load()}>Retry</Button>
          </div>
        )}

        {/* Desktop table */}
        <table className="hidden w-full text-left md:table">
          <thead className="text-[12px] text-muted">
            <tr className="border-b border-line">
              <th className="px-4 py-2.5 font-medium">Merchant</th>
              <th className="px-4 py-2.5 font-medium">Storefront</th>
              <th className="px-4 py-2.5 font-medium">Connection</th>
              <th className="px-4 py-2.5 font-medium">Hosting</th>
              <th className="px-4 py-2.5 font-medium">Last checked</th>
              <th className="w-12 px-4 py-2.5"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {merchants === null
              ? Array.from({ length: 3 }, (_, i) => (
                  <tr key={i} className="border-b border-line last:border-0">
                    <td className="px-4 py-3.5"><div className="flex items-center gap-2.5"><Skeleton className="size-7 rounded-md" /><Skeleton className="h-3.5 w-32" /></div></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-3.5 w-28" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-24 rounded-full" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-3.5 w-24" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-3.5 w-20" /></td>
                    <td className="px-4 py-3.5" />
                  </tr>
                ))
              : visible.map((m) => (
                  <tr key={m.id} className="group border-b border-line transition-colors last:border-0 hover:bg-soft/60">
                    <td className="px-4 py-3">
                      <Link to={`/merchants/${m.id}`} className="flex items-center gap-2.5 font-medium hover:text-accent">
                        <span aria-hidden="true" className="grid size-7 place-items-center rounded-md bg-accent-soft text-[11px] font-semibold text-accent">
                          {initials(m.name)}
                        </span>
                        {m.name}
                        {m.status !== "active" && <span className="rounded bg-soft px-1.5 text-[11px] font-normal text-muted capitalize">{m.status}</span>}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {m.storefront_url ? (
                        <a href={m.storefront_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-muted hover:text-ink">
                          {hostOf(m.storefront_url)} <ExternalLink className="size-3" aria-label="(opens in a new tab)" />
                        </a>
                      ) : (
                        <span className="text-muted">Not set</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={m.check_status} stale={m.check_status === "connected" && isStale(m.checked_at)} />
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {m.storefront_host ?? "—"} <span aria-hidden="true">·</span> {m.backend_host ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted" title={dateTime(m.checked_at)}>
                      {checking === m.id ? "Checking…" : ago(m.checked_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Menu
                        label={`Actions for ${m.name}`}
                        trigger={(props) => (
                          <button {...props} type="button" className="grid size-7 place-items-center rounded-md text-muted hover:bg-soft hover:text-ink">
                            <MoreHorizontal className="size-4" />
                          </button>
                        )}
                        items={[
                          { label: "View merchant", icon: <Store className="size-3.5" />, onSelect: () => navigate(`/merchants/${m.id}`) },
                          { label: "Open storefront", icon: <ExternalLink className="size-3.5" />, disabled: !m.storefront_url, onSelect: () => window.open(m.storefront_url!, "_blank", "noopener") },
                          { label: "Recheck connection", icon: <RefreshCw className="size-3.5" />, disabled: !m.secret_configured || checking === m.id, onSelect: () => void recheck(m) },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        {/* Mobile list */}
        <ul className="md:hidden">
          {merchants === null
            ? Array.from({ length: 3 }, (_, i) => (
                <li key={i} className="border-b border-line px-4 py-3 last:border-0"><Skeleton className="h-4 w-40" /><Skeleton className="mt-2 h-3 w-24" /></li>
              ))
            : visible.map((m) => (
                <li key={m.id} className="border-b border-line last:border-0">
                  <Link to={`/merchants/${m.id}`} className="flex items-center justify-between gap-3 px-4 py-3">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{m.name}</span>
                      <span className="block truncate text-[12px] text-muted">{hostOf(m.storefront_url) ?? "No storefront yet"}</span>
                    </span>
                    <StatusBadge status={m.check_status} stale={m.check_status === "connected" && isStale(m.checked_at)} />
                  </Link>
                </li>
              ))}
        </ul>

        {merchants !== null && visible.length === 0 && (
          <div className="px-4 py-14 text-center">
            {merchants.length === 0 ? (
              <>
                <p className="font-medium">Add your first merchant</p>
                <p className="mt-1 text-muted">Record the business, then connect its shop backend.</p>
              </>
            ) : (
              <>
                <p className="font-medium">No merchants match</p>
                <Button
                  className="mt-3"
                  onClick={() => {
                    setQuery("")
                    setFilter("all")
                  }}
                >
                  Clear filters
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <ZoomDialog open={adding} onClose={() => setAdding(false)} origin={addButton.current} title="Add merchant" size="lg">
        <MerchantForm
          submitLabel="Add merchant"
          onCancel={() => setAdding(false)}
          onSubmit={async (input) => {
            const { merchant } = await api.createMerchant(input)
            setAdding(false)
            navigate(`/merchants/${merchant.id}`)
          }}
        />
      </ZoomDialog>
    </div>
  )
}
