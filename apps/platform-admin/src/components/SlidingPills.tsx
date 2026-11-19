import { useLayoutEffect, useRef, useState } from "react"

type Option<T extends string> = { value: T; label: string; count?: number }

/**
 * Segmented control / tab list with a pill that slides to the selected option.
 * Keyboard: arrow keys move between options (roving tab index).
 */
export function SlidingPills<T extends string>({
  options,
  value,
  onChange,
  label,
  variant = "segmented",
}: {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  variant?: "segmented" | "tabs"
}) {
  const refs = useRef(new Map<T, HTMLButtonElement>())
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null)

  useLayoutEffect(() => {
    const el = refs.current.get(value)
    if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth })
  }, [value, options])

  const onKey = (e: React.KeyboardEvent, index: number) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = options[(index + step + options.length) % options.length]!
    onChange(next.value)
    refs.current.get(next.value)?.focus()
  }

  const tabs = variant === "tabs"
  return (
    <div
      role="tablist"
      aria-label={label}
      className={
        tabs
          ? "relative inline-flex gap-1 border-b border-line"
          : "relative inline-flex rounded-lg bg-soft p-0.5"
      }
    >
      {pill && (
        <span
          aria-hidden="true"
          className={
            tabs
              ? "absolute -bottom-px h-0.5 rounded-full bg-accent transition-[left,width] duration-200 ease-out-expo"
              : "absolute top-0.5 bottom-0.5 rounded-md bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)] transition-[left,width] duration-200 ease-out-expo"
          }
          style={{ left: pill.left, width: pill.width }}
        />
      )}
      {options.map((o, i) => {
        const selected = o.value === value
        return (
          <button
            key={o.value}
            ref={(el) => {
              if (el) refs.current.set(o.value, el)
              else refs.current.delete(o.value)
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => onKey(e, i)}
            className={`relative z-10 inline-flex items-center gap-1.5 whitespace-nowrap transition-colors duration-150 ${
              tabs ? "px-3 py-2" : "rounded-md px-3 py-1.5"
            } ${selected ? "text-ink font-medium" : "text-muted hover:text-ink"}`}
          >
            {o.label}
            {o.count !== undefined && (
              <span className={`tabular-nums text-[11px] ${selected ? "text-muted" : "text-muted/80"}`}>{o.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
