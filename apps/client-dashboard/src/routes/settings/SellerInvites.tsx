import { useState } from "react";
import type { FormEvent } from "react";
import { sdk } from "../../lib/medusa";
import { Dropdown } from "../../lib/ui/Dropdown";

export function SellerInvites() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [link, setLink] = useState("");
  const [expiry, setExpiry] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  async function create(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setLink("");
    setCopied(false);
    try {
      const { invite } = await sdk.admin.invite.create({
        email: email.trim(),
        metadata: { emora_role: role },
      });
      if (!invite.token)
        throw new Error(
          "The invitation was created, but its link is unavailable. Check your permissions in Medusa Admin.",
        );
      const url = new URL("/register", window.location.origin);
      url.searchParams.set("token", invite.token);
      setLink(url.toString());
      setExpiry(
        invite.expires_at
          ? new Date(invite.expires_at).toLocaleString("en-IN")
          : "",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create invitation.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="seller-invites">
      <h3>Invite a merchant</h3>
      <p>
        Create a registration link and share it privately. The selected role
        controls this user's access to the current store.
      </p>
      <form onSubmit={create}>
        <label>
          Merchant email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="merchant@example.com"
          />
        </label>
        <label>
          Staff role
          <Dropdown
            label="Staff role"
            name="staff-role"
            required
            value={role}
            placeholder="Select a role"
            onValueChange={setRole}
            options={[
              { value: "admin", label: "Admin" },
              { value: "inventory_manager", label: "Inventory manager" },
              { value: "customer_support", label: "Customer support" },
            ]}
          />
        </label>
        <button className="button primary" disabled={busy}>
          {busy ? "Creating…" : "Create invitation link"}
        </button>
      </form>
      {error && (
        <p className="login-error" role="alert">
          {error}
        </p>
      )}
      {link && (
        <div className="invite-result">
          <label>
            Invitation link
            <input
              readOnly
              value={link}
              onFocus={(e) => e.currentTarget.select()}
            />
          </label>
          <button
            className="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(link);
                setCopied(true);
              } catch {
                setError("Copy the selected link manually.");
              }
            }}
          >
            {copied ? "Copied" : "Copy link"}
          </button>
          <small>Share privately. {expiry && `Expires ${expiry}.`}</small>
        </div>
      )}
    </div>
  );
}
