import { useState } from "react"
import { ApiError, api } from "@/lib/api"
import { Button, Field, inputClass } from "@/components/ui"

/** Email and password, then the authenticator code when two-factor is on. */
export function SignIn({ onSignedIn }: { onSignedIn: () => void }) {
  const [step, setStep] = useState<"password" | "code">("password")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [useRecovery, setUseRecovery] = useState(false)
  const [challenge, setChallenge] = useState<{ id: string; token: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const result = await api.signIn(email.trim(), password)
      if (result.mfa_required && result.mfa_challenge) {
        setChallenge({ id: result.mfa_challenge.id, token: result.token })
        setStep("code")
      } else {
        await api.startSession(result.token)
        onSignedIn()
      }
    } catch (err) {
      setError(err instanceof ApiError && err.status === 429 ? "Too many attempts. Wait a minute and try again." : "Email or password is incorrect.")
    } finally {
      setBusy(false)
    }
  }

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!challenge) return
    setError(null)
    setBusy(true)
    try {
      const { token } = await api.verifyChallenge(challenge.id, challenge.token, useRecovery ? "recovery_code" : "totp", code.trim())
      await api.startSession(token)
      onSignedIn()
    } catch {
      setError(useRecovery ? "That recovery code did not work." : "That code did not work. Check the time on your phone and try the newest code.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2">
          <span aria-hidden="true" className="grid size-7 place-items-center rounded-md bg-ink text-[12px] font-bold text-surface">
            E
          </span>
          <span className="text-[15px] font-semibold tracking-tight">Emora Platform</span>
        </div>
        <div className="rounded-xl border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          {step === "password" ? (
            <form onSubmit={submitPassword} className="space-y-4">
              <div>
                <h1 className="text-[20px] font-semibold tracking-tight">Sign in</h1>
                <p className="mt-0.5 text-muted">For the Emora team only.</p>
              </div>
              <Field label="Email" htmlFor="email">
                <input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
              </Field>
              <Field label="Password" htmlFor="password">
                <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
              </Field>
              {error && <p role="alert" className="rounded-md bg-bad-soft px-3 py-2 text-bad">{error}</p>}
              <Button type="submit" variant="primary" busy={busy} className="w-full">
                Continue
              </Button>
            </form>
          ) : (
            <form onSubmit={submitCode} className="space-y-4">
              <div>
                <h1 className="text-[20px] font-semibold tracking-tight">Two-factor sign-in</h1>
                <p className="mt-0.5 text-muted">
                  {useRecovery ? "Enter one of your saved recovery codes." : "Enter the 6-digit code from your authenticator app."}
                </p>
              </div>
              <Field label={useRecovery ? "Recovery code" : "Code"} htmlFor="code">
                <input
                  id="code"
                  data-autofocus
                  inputMode={useRecovery ? "text" : "numeric"}
                  autoComplete="one-time-code"
                  maxLength={useRecovery ? 64 : 6}
                  required
                  value={code}
                  onChange={(e) => setCode(useRecovery ? e.target.value : e.target.value.replace(/\D/g, ""))}
                  className={`${inputClass} ${useRecovery ? "" : "text-center text-[18px] tracking-[0.4em] tabular-nums"}`}
                />
              </Field>
              {error && <p role="alert" className="rounded-md bg-bad-soft px-3 py-2 text-bad">{error}</p>}
              <Button type="submit" variant="primary" busy={busy} className="w-full">
                Verify
              </Button>
              <button
                type="button"
                onClick={() => {
                  setUseRecovery((v) => !v)
                  setCode("")
                  setError(null)
                }}
                className="w-full text-center text-[12px] text-muted underline-offset-2 hover:text-ink hover:underline"
              >
                {useRecovery ? "Use an authenticator code instead" : "Lost your phone? Use a recovery code"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
