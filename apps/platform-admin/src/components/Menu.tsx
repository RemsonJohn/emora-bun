import { useEffect, useId, useRef, useState } from "react"

export type MenuItem = {
  label: string
  icon?: React.ReactNode
  onSelect: () => void
  disabled?: boolean
}

/**
 * Dropdown menu whose highlight slides to the hovered or focused item.
 * Opens below its trigger; arrow keys, Home/End, Escape and outside clicks work.
 */
export function Menu({ trigger, items, label }: { trigger: (props: React.ButtonHTMLAttributes<HTMLButtonElement> & { ref: React.Ref<HTMLButtonElement> }) => React.ReactNode; items: MenuItem[]; label: string }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [shown, setShown] = useState(false)
  const button = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const id = useId()

  useEffect(() => {
    if (!open) {
      setShown(false)
      return
    }
    const raf = requestAnimationFrame(() => setShown(true))
    const onDown = (e: MouseEvent) => {
      if (!list.current?.contains(e.target as Node) && !button.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener("mousedown", onDown)
    }
  }, [open])

  useEffect(() => {
    if (open && active >= 0) itemRefs.current[active]?.focus()
  }, [open, active])

  const close = (focusTrigger = true) => {
    setOpen(false)
    setActive(-1)
    if (focusTrigger) button.current?.focus()
  }

  const onKey = (e: React.KeyboardEvent) => {
    const enabled = items.map((it, i) => (it.disabled ? -1 : i)).filter((i) => i >= 0)
    const pos = enabled.indexOf(active)
    if (e.key === "Escape") {
      e.preventDefault()
      close()
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive(enabled[(pos + 1) % enabled.length] ?? -1)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive(enabled[(pos - 1 + enabled.length) % enabled.length] ?? -1)
    } else if (e.key === "Home") {
      e.preventDefault()
      setActive(enabled[0] ?? -1)
    } else if (e.key === "End") {
      e.preventDefault()
      setActive(enabled[enabled.length - 1] ?? -1)
    } else if (e.key === "Tab") {
      close(false)
    }
  }

  const activeEl = active >= 0 ? itemRefs.current[active] : null

  return (
    <div className="relative inline-block">
      {trigger({
        ref: button,
        "aria-haspopup": "menu",
        "aria-expanded": open,
        "aria-controls": open ? id : undefined,
        "aria-label": label,
        onClick: (e) => {
          e.stopPropagation()
          setOpen((v) => !v)
          setActive(-1)
        },
        onKeyDown: (e) => {
          if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            setOpen(true)
            setActive(items.findIndex((it) => !it.disabled))
          }
        },
      })}
      {open && (
        <div
          ref={list}
          id={id}
          role="menu"
          aria-label={label}
          onKeyDown={onKey}
          onMouseLeave={() => setActive(-1)}
          className={`absolute right-0 z-40 mt-1.5 min-w-48 origin-top-right rounded-lg border border-line bg-surface p-1 shadow-[0_12px_32px_-12px_rgba(20,20,30,0.35)] transition-[opacity,transform] duration-150 ease-out-expo ${
            shown ? "scale-100 opacity-100" : "scale-95 opacity-0"
          }`}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-1 left-1 rounded-md bg-soft transition-[top,height,opacity] duration-150 ease-out-expo"
            style={{
              top: activeEl?.offsetTop ?? 0,
              height: activeEl?.offsetHeight ?? 0,
              opacity: activeEl ? 1 : 0,
            }}
          />
          {items.map((item, i) => (
            <button
              key={item.label}
              ref={(el) => {
                itemRefs.current[i] = el
              }}
              type="button"
              role="menuitem"
              tabIndex={-1}
              disabled={item.disabled}
              onMouseEnter={() => !item.disabled && setActive(i)}
              onClick={(e) => {
                e.stopPropagation()
                close(false)
                item.onSelect()
              }}
              className="relative z-10 flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left whitespace-nowrap text-ink outline-none focus-visible:outline-none disabled:opacity-45"
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
