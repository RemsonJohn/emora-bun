import { useEffect, useRef, useState } from "react"
import { Check, Copy, KeyRound } from "lucide-react"
import { api, type Me } from "@/lib/api"
import { Button, Field, inputClass } from "@/components/ui"

/**
 * Required before any merchant data is shown: add the account to an
 * authenticator app, confirm a code, save recovery codes, then sign in again
 * so the session carries the completed two-factor sign-in.
 */
export function SetupTwoFactor({ me, onDone }: { me: Me; onDone: () => void }) {
  const [factor, setFactor] = useState<{ id: string; secret: string; otpauth_url: string } | null>(null)
  const [code, setCode] = useState("")
  const [codes, setCodes] = useState<string[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    api
      .startTotp(me.user.email)
      .then((r) => setFactor({ id: r.mfa_factor.id, secret: r.secret, otpauth_url: r.otpauth_url }))
      .catch(() => setError("Could not start two-factor setup. Reload the page to try again."))
  }, [me.user.email])

  const copy = async (text: string, what: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(what)
    window.setTimeout(() => setCopied(null), 1500)
  }

  const verify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!factor) return
    setBusy(true)
    setError(null)
    try {
      await api.verifyTotp(factor.id, code)
      const { recovery_codes } = await api.recoveryCodes()
      setCodes(recovery_codes)
    } catch {
      setError("That code did not work. Try the newest code from your app.")
    } finally {
      setBusy(false)
    }
  }

  const grouped = factor?.secret.replace(/(.{4})/g, "$1 ").trim()

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="mb-5 flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
            <KeyRound className="size-4.5" />
          </span>
          <div>
            <h1 className="text-[18px] font-semibold tracking-tight">Set up two-factor sign-in</h1>
            <p className="text-muted">Required for everyone on the Emora team before merchant data is shown.</p>
          </div>
        </div>

        {codes ? (
          <div className="space-y-4">
            <p>
              Two-factor sign-in is on. Save these recovery codes somewhere safe (a password manager). Each works once if you lose your phone.
            </p>
            <ul className="grid grid-cols-2 gap-1.5 rounded-lg bg-soft p-3 font-mono text-[12px] tabular-nums">
              {codes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <div className="flex gap-2">
              <Button onClick={() => copy(codes.join("\n"), "codes")}>
                {copied === "codes" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} Copy codes
              </Button>
              <Button variant="primary" onClick={onDone} className="flex-1">
                I saved them. Sign in again
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={verify} className="space-y-4">
            <ol className="list-decimal space-y-1.5 pl-4 text-muted">
              <li>Open an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password…).</li>
              <li>Add an account with the setup key below, or open the setup link on this device.</li>
              <li>Enter the 6-digit code it shows.</li>
            </ol>
            <div className="rounded-lg border border-line bg-soft p-3">
              <p className="text-[12px] text-muted">Setup key</p>
              {factor ? (
                <div className="mt-1 flex items-center justify-between gap-2">
                  <code className="font-mono text-[13px] break-all">{grouped}</code>
                  <Button variant="ghost" onClick={() => copy(factor.secret, "key")} aria-label="Copy setup key">
                    {copied === "key" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  </Button>
                </div>
              ) : (
                <span className="skeleton mt-1.5 block h-4 w-56" />
              )}
              {factor && (
                <a href={factor.otpauth_url} className="mt-2 inline-block text-[12px] text-accent underline-offset-2 hover:underline">
                  Open setup link in an authenticator app
                </a>
              )}
            </div>
            <Field label="6-digit code" htmlFor="totp">
              <input
                id="totp"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className={`${inputClass} text-center text-[18px] tracking-[0.4em] tabular-nums`}
              />
            </Field>
            {error && <p role="alert" className="rounded-md bg-bad-soft px-3 py-2 text-bad">{error}</p>}
            <Button type="submit" variant="primary" busy={busy} disabled={!factor || code.length !== 6} className="w-full">
              Turn on two-factor sign-in
            </Button>
          </form>
        )}
      </div>
    </main>
  )
}
