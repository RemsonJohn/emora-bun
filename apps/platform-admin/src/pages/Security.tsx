import { useRef, useState } from "react"
import { Check, Copy, ShieldCheck } from "lucide-react"
import { api, type Me } from "@/lib/api"
import { ZoomDialog } from "@/components/ZoomDialog"
import { Button, Card } from "@/components/ui"

export function Security({ me }: { me: Me }) {
  const [codes, setCodes] = useState<string[] | null>(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const button = useRef<HTMLButtonElement>(null)

  return (
    <div>
      <h1 className="text-[24px] leading-tight font-semibold tracking-tight">Security</h1>
      <p className="mt-0.5 text-muted">Your sign-in protection for the Emora platform.</p>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card title="Two-factor sign-in">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-ok-soft text-ok">
              <ShieldCheck className="size-4.5" />
            </span>
            <div>
              <p className="font-medium">On for {me.user.email}</p>
              <p className="text-muted">Every sign-in needs a code from your authenticator app. It is required for all Emora staff.</p>
            </div>
          </div>
        </Card>
        <Card title="Recovery codes">
          <p className="text-muted">New codes replace the old ones. Keep them in a password manager.</p>
          {error && <p role="alert" className="mt-3 rounded-md bg-bad-soft px-3 py-2 text-bad">{error}</p>}
          <Button
            ref={button}
            className="mt-4"
            busy={busy}
            onClick={async () => {
              setBusy(true)
              setError(null)
              try {
                setCodes((await api.recoveryCodes()).recovery_codes)
                setOpen(true)
              } catch {
                setError("Could not create new codes. Sign in again and retry.")
              } finally {
                setBusy(false)
              }
            }}
          >
            Create new recovery codes
          </Button>
        </Card>
      </div>
      <ZoomDialog open={open} onClose={() => setOpen(false)} origin={button.current} title="New recovery codes" size="sm">
        <ul className="grid grid-cols-2 gap-1.5 rounded-lg bg-soft p-3 font-mono text-[12px] tabular-nums">
          {codes?.map((c) => <li key={c}>{c}</li>)}
        </ul>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            onClick={async () => {
              await navigator.clipboard.writeText((codes ?? []).join("\n"))
              setCopied(true)
              window.setTimeout(() => setCopied(false), 1500)
            }}
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} Copy
          </Button>
          <Button variant="primary" onClick={() => setOpen(false)}>Done</Button>
        </div>
      </ZoomDialog>
    </div>
  )
}
