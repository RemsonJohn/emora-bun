import { forwardRef } from "react"
import { Loader2 } from "lucide-react"

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger"
  busy?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", busy, className = "", children, disabled, ...rest },
  ref
) {
  const styles = {
    primary: "bg-ink text-surface hover:bg-ink/90 shadow-[0_1px_2px_rgba(0,0,0,0.12)]",
    secondary: "bg-surface text-ink border border-line hover:bg-soft shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
    ghost: "text-muted hover:text-ink hover:bg-soft",
    danger: "bg-bad text-white hover:bg-bad/90",
  }[variant]
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled || busy}
      className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-3 font-medium whitespace-nowrap transition-colors duration-150 disabled:cursor-default disabled:opacity-55 ${styles} ${className}`}
      {...rest}
    >
      {busy && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
})

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
}: {
  label: string
  hint?: string
  error?: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block font-medium text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-[12px] text-bad" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-[12px] text-muted">{hint}</p>
      ) : null}
    </div>
  )
}

export const inputClass =
  "h-8 w-full rounded-md border border-line bg-surface px-2.5 text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors placeholder:text-muted/70 hover:border-muted/40 focus:border-accent focus:outline-none"

/** On/off switch with a sliding knob. */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-50 ${
        checked ? "bg-accent" : "bg-muted/45"
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute size-4 rounded-full bg-white shadow transition-transform duration-200 ease-out-expo ${
          checked ? "translate-x-[18px]" : "translate-x-0.5"
        }`}
      />
    </button>
  )
}

export function StatusBadge({ status, stale }: { status: "not_checked" | "connected" | "needs_attention"; stale?: boolean }) {
  const map = {
    connected: { text: stale ? "Connected · stale" : "Connected", cls: stale ? "bg-warn-soft text-warn" : "bg-ok-soft text-ok", dot: stale ? "bg-warn" : "bg-ok" },
    needs_attention: { text: "Needs attention", cls: "bg-bad-soft text-bad", dot: "bg-bad" },
    not_checked: { text: "Not connected", cls: "bg-soft text-muted", dot: "bg-muted/60" },
  }[status]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[12px] font-medium ${map.cls}`}>
      <span aria-hidden="true" className={`size-1.5 rounded-full ${map.dot}`} />
      {map.text}
    </span>
  )
}

export function Card({ title, actions, children, className = "" }: { title?: string; actions?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-line bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
          {title && <h2 className="text-[14px] font-semibold tracking-tight">{title}</h2>}
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  )
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`skeleton block ${className}`} />
}
