import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Medusa from "@medusajs/js-sdk";

const backend =
  import.meta.env.VITE_MEDUSA_BACKEND_URL || window.location.origin;

export function SellerRegistration({
  token,
  onExit,
}: {
  token: string;
  onExit: () => void;
}) {
  const [invite, setInvite] = useState<{ email: string } | null>(null);
  const [state, setState] = useState<"checking" | "ready" | "invalid" | "done">(
    token ? "checking" : "invalid",
  );
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(false);

  useEffect(() => {
    let active = true;
    if (!token) return;
    fetch(`${backend}/auth/seller/invites/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      cache: "no-store",
      referrerPolicy: "no-referrer",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("invalid");
        const data = await response.json();
        if (!data.email || typeof data.email !== "string")
          throw new Error("invalid");
        if (active) {
          setInvite(data);
          setState("ready");
        }
      })
      .catch(() => {
        if (active) setState("invalid");
      });
    return () => {
      active = false;
    };
  }, [token]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!invite || busy) return;
    if (password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError("");
    const registration = new Medusa({
      baseUrl: backend,
      auth: { type: "jwt", jwtTokenStorageMethod: "memory" },
    });
    try {
      const credentials = { email: invite.email, password };
      const result = retry
        ? await registration.auth.login("user", "emailpass", credentials)
        : await registration.auth.register("user", "emailpass", credentials);
      if (typeof result !== "string")
        throw new Error("Additional authentication required");
      await registration.admin.invite.accept({
        email: invite.email,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        invite_token: token,
      });
      setPassword("");
      setConfirmation("");
      setState("done");
    } catch {
      setError(
        "We couldn't complete registration. Check your details and invitation. If you already set a password for this invitation, try continuing with it.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-brand">
        <span className="brand-mark">
          e<span />
        </span>
        emora
      </div>
      <div className="login-layout">
        <section className="login-intro">
          <span className="intro-line" />
          <h1>
            Your store.
            <br />
            Your next chapter.
          </h1>
          <p>Accept your invitation to manage your store with Emora.</p>
        </section>
        <section className="login-card">
          <h2>Set up your merchant account</h2>
          {state === "checking" && <p>Checking your invitation…</p>}
          {state === "invalid" && (
            <>
              <p role="alert">
                This invitation is invalid, expired, or could not be checked.
                Ask your store administrator for a new link.
              </p>
              <button className="button" onClick={onExit}>
                Go to sign in
              </button>
            </>
          )}
          {state === "done" && (
            <>
              <p>
                Your account is ready. Sign in with your email and password. If
                another user is already signed in in this browser, sign out
                first or use a private window.
              </p>
              <button className="button primary" onClick={onExit}>
                Return to Emora
              </button>
            </>
          )}
          {state === "ready" && invite && (
            <>
              <p>You're joining the store that sent this invitation.</p>
              <form onSubmit={submit}>
                <label>
                  Email address
                  <input type="email" value={invite.email} readOnly />
                </label>
                <label>
                  First name
                  <input
                    autoComplete="given-name"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </label>
                <label>
                  Last name
                  <input
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
                <label>
                  Confirm password
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                  />
                </label>
                <label className="invite-retry">
                  <input
                    type="checkbox"
                    checked={retry}
                    onChange={(e) => setRetry(e.target.checked)}
                  />{" "}
                  I already set a password for this invitation
                </label>
                {error && (
                  <div className="login-error" role="alert">
                    {error}
                  </div>
                )}
                <button className="button primary" disabled={busy}>
                  {busy ? "Creating account…" : "Create account"}
                </button>
              </form>
              <button className="invite-back" onClick={onExit}>
                Back to sign in
              </button>
            </>
          )}
        </section>
      </div>
      <footer>
        Emora Admin<span>Your business. Beautifully organised.</span>
      </footer>
    </div>
  );
}
