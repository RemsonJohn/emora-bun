import { useEffect, useId, useRef } from "react"
import type { ReactNode } from "react"
import { X } from "lucide-react"

/** Native modal behavior shared by all dashboard dialogs. Mount to open. */
export function Dialog({ children, className, label, labelledBy, onClose, closeOnBackdrop = false }: {
  children: ReactNode
  className: string
  label?: string
  labelledBy?: string
  onClose: () => void
  closeOnBackdrop?: boolean
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const element = dialog.current
    if (element && !element.open) element.showModal()
    return () => { if (element?.open) element.close() }
  }, [])
  return <dialog ref={dialog} className={className} aria-label={label} aria-labelledby={labelledBy}
    onCancel={event => { event.preventDefault(); onClose() }}
    onClick={event => { if (closeOnBackdrop && event.target === event.currentTarget) onClose() }}>
    {children}
  </dialog>
}

/** Standard titled popup with a scrollable content area. */
export function PanelDialog({ title, description, children, onClose, className = "" }: {
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
  className?: string
}) {
  const titleId = useId()
  return <Dialog className={`staff-dialog ${className}`} labelledBy={titleId} onClose={onClose}>
    <div className="staff-dialog-header">
      <div><h2 id={titleId}>{title}</h2>{description && <p>{description}</p>}</div>
      <button type="button" className="staff-close" aria-label={`Close ${title.toLowerCase()}`} onClick={onClose}><X size={20} /></button>
    </div>
    <div className="staff-dialog-content">{children}</div>
  </Dialog>
}
