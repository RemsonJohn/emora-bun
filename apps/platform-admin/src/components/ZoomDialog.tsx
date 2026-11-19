import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { reducedMotion } from "@/lib/format"

/**
 * A dialog that grows out of the element that opened it (a button or an
 * image) and shrinks back into it on close. Escape and the backdrop close it;
 * focus moves into the dialog and returns to the trigger afterwards.
 */
export function ZoomDialog({
  open,
  onClose,
  origin,
  title,
  children,
  size = "md",
  bare = false,
}: {
  open: boolean
  onClose: () => void
  /** The element the dialog grows from (and returns focus to). */
  origin: HTMLElement | null
  title: string
  children: React.ReactNode
  size?: "sm" | "md" | "lg" | "full"
  /** No padding or header chrome (for image previews). */
  bare?: boolean
}) {
  const panel = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(open)
  const [shown, setShown] = useState(false)

  // Mount, then animate in on the next frame; animate out, then unmount.
  useEffect(() => {
    if (open) {
      setMounted(true)
      // Two frames so the start position is painted before the transition;
      // the timer covers tabs where animation frames are paused.
      const id = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)))
      const fallback = window.setTimeout(() => setShown(true), 80)
      return () => {
        cancelAnimationFrame(id)
        window.clearTimeout(fallback)
      }
    }
    setShown(false)
    const t = window.setTimeout(() => setMounted(false), reducedMotion() ? 0 : 260)
    return () => window.clearTimeout(t)
  }, [open])

  // Transform origin: from the trigger's centre to the panel's centre.
  const [from, setFrom] = useState("translate(0,0) scale(0.96)")
  useLayoutEffect(() => {
    if (!mounted || !panel.current) return
    const o = origin?.getBoundingClientRect()
    if (!o || reducedMotion()) {
      setFrom("translate(0,0) scale(1)")
      return
    }
    // Untransformed size; the panel is centred in the viewport by its flex container.
    const width = panel.current.offsetWidth
    const height = panel.current.offsetHeight
    const dx = o.left + o.width / 2 - window.innerWidth / 2
    const dy = o.top + o.height / 2 - window.innerHeight / 2
    const s = Math.max(Math.min(o.width / width, o.height / height), 0.08)
    setFrom(`translate(${dx}px, ${dy}px) scale(${s})`)
    // Measured once per opening, from where the dialog was opened.
  }, [mounted])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "Tab" && panel.current) {
        const items = panel.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (!items.length) return
        const first = items[0]!
        const last = items[items.length - 1]!
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener("keydown", onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const t = window.setTimeout(() => {
      const el =
        panel.current?.querySelector<HTMLElement>("[data-autofocus]") ??
        panel.current?.querySelector<HTMLElement>("input, select, textarea, button")
      el?.focus()
    }, 30)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
      window.clearTimeout(t)
      origin?.focus()
    }
  }, [open, onClose, origin])

  if (!mounted) return null
  const width = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-3xl", full: "max-w-6xl" }[size]

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`absolute inset-0 bg-[#14151a]/35 backdrop-blur-[2px] transition-opacity duration-200 ${shown ? "opacity-100" : "opacity-0"}`}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${width} max-h-[90vh] overflow-auto rounded-xl border border-line bg-surface shadow-[0_24px_64px_-24px_rgba(20,20,30,0.45)] transition-[transform,opacity] duration-[260ms] ease-out-expo ${
          shown ? "opacity-100" : "opacity-0"
        }`}
        style={{ transform: shown ? "translate(0,0) scale(1)" : from }}
      >
        {bare ? (
          <>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-3 right-3 z-10 grid size-8 place-items-center rounded-full bg-surface/90 text-muted shadow hover:text-ink"
            >
              <X className="size-4" />
            </button>
            {children}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid size-8 place-items-center rounded-md text-muted hover:bg-soft hover:text-ink"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
