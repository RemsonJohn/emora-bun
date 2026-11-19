import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { Activity, BookOpen, LogOut, Menu as MenuIcon, ShieldCheck, Store, X } from "lucide-react"
import type { Me } from "@/lib/api"
import { Link, useRouter } from "@/lib/router"

const NAV = [
  { to: "/merchants", label: "Merchants", icon: Store },
  { to: "/activity", label: "Activity", icon: Activity },
  { to: "/security", label: "Security", icon: ShieldCheck },
  { to: "/guide", label: "Guide", icon: BookOpen },
]

/** Sidebar navigation whose highlight pill slides to the current section. */
function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const { path } = useRouter()
  const current = NAV.find((n) => path === n.to || path.startsWith(`${n.to}/`))?.to ?? "/merchants"
  const refs = useRef(new Map<string, HTMLAnchorElement>())
  const [pill, setPill] = useState<{ top: number; height: number } | null>(null)

  useLayoutEffect(() => {
    const el = refs.current.get(current)
    if (el) setPill({ top: el.offsetTop, height: el.offsetHeight })
  }, [current])

  return (
    <nav aria-label="Main" className="relative flex flex-col gap-0.5">
      {pill && (
        <span
          aria-hidden="true"
          className="absolute right-0 left-0 rounded-md border border-line/70 bg-surface/90 shadow-[0_1px_2px_rgba(0,0,0,0.05)] backdrop-blur transition-[top,height] duration-200 ease-out-expo"
          style={{ top: pill.top, height: pill.height }}
        />
      )}
      {NAV.map(({ to, label, icon: Icon }) => {
        const active = to === current
        return (
          <Link
            key={to}
            to={to}
            ref={(el: HTMLAnchorElement | null) => {
              if (el) refs.current.set(to, el)
            }}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`relative z-10 flex items-center gap-2.5 rounded-md px-2.5 py-1.5 transition-colors duration-150 ${
              active ? "font-medium text-ink" : "text-muted hover:text-ink"
            }`}
          >
            <Icon className="size-4" strokeWidth={1.7} aria-hidden="true" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

export function Shell({ me, onSignOut, children }: { me: Me; onSignOut: () => void; children: React.ReactNode }) {
  const [drawer, setDrawer] = useState(false)
  useEffect(() => {
    if (!drawer) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false)
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [drawer])
  const name = [me.user.first_name, me.user.last_name].filter(Boolean).join(" ") || me.user.email

  const sidebar = (onNavigate?: () => void) => (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center gap-2 px-2.5">
        <span aria-hidden="true" className="grid size-6 place-items-center rounded-md bg-ink text-[11px] font-bold text-surface">
          E
        </span>
        <span className="font-semibold tracking-tight">Emora Platform</span>
      </div>
      <Nav onNavigate={onNavigate} />
      <div className="mt-auto border-t border-line py-3">
        <div className="px-2.5">
          <p className="truncate font-medium">{name}</p>
          <p className="truncate text-[12px] text-muted">
            {me.user.role === "admin" ? "Platform admin" : me.user.role === "operator" ? "Operator" : "No role"}
          </p>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="mt-2 flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-muted transition-colors hover:bg-soft hover:text-ink"
        >
          <LogOut className="size-4" strokeWidth={1.7} aria-hidden="true" /> Sign out
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen lg:flex">
      <aside className="sticky top-0 hidden h-screen w-[226px] shrink-0 border-r border-line bg-shell px-3.5 pt-6 lg:block">
        {sidebar()}
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-shell/85 px-4 py-2.5 backdrop-blur lg:hidden">
        <span className="font-semibold tracking-tight">Emora Platform</span>
        <button
          type="button"
          onClick={() => setDrawer(true)}
          aria-label="Open navigation"
          aria-expanded={drawer}
          className="grid size-9 place-items-center rounded-md text-muted hover:bg-soft hover:text-ink"
        >
          <MenuIcon className="size-5" />
        </button>
      </header>

      <div
        className={`fixed inset-0 z-40 lg:hidden ${drawer ? "" : "pointer-events-none"}`}
        aria-hidden={!drawer}
        inert={!drawer}
      >
        <div
          onClick={() => setDrawer(false)}
          className={`absolute inset-0 bg-[#14151a]/30 transition-opacity duration-200 ${drawer ? "opacity-100" : "opacity-0"}`}
        />
        <div
          role="dialog"
          aria-label="Navigation"
          className={`absolute inset-y-0 left-0 w-[260px] border-r border-line bg-shell/95 px-3.5 pt-5 backdrop-blur transition-transform duration-250 ease-out-expo ${
            drawer ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <button
            type="button"
            onClick={() => setDrawer(false)}
            aria-label="Close navigation"
            className="absolute top-3 right-3 grid size-8 place-items-center rounded-md text-muted hover:bg-soft"
          >
            <X className="size-4" />
          </button>
          {sidebar(() => setDrawer(false))}
        </div>
      </div>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:py-8">
        <div className="mx-auto max-w-[1180px]">{children}</div>
      </main>
    </div>
  )
}
