import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { sdk } from "../../lib/medusa";
import { SellerInvites } from "./SellerInvites";
import { Dropdown } from "../../lib/ui/Dropdown";
import { PanelDialog } from "../../lib/ui/Dialog";

type StaffMember = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email: string;
};
type Role = "admin" | "inventory_manager" | "customer_support";
type Grant = {
  user_id: string;
  role: Role;
  overrides: Record<string, boolean>;
};
const roleNames: Record<Role, string> = {
  admin: "Admin",
  inventory_manager: "Inventory manager",
  customer_support: "Customer support",
};
const capabilities = [
  "products.read",
  "products.write",
  "inventory.read",
  "inventory.write",
  "orders.read",
  "orders.fulfill",
  "orders.approve",
  "orders.capture",
  "orders.complete",
  "orders.refund",
  "customers.read",
  "customers.write",
  "discounts.read",
  "discounts.write",
  "billing.read",
  "analytics.read",
  "content.read",
  "content.write",
  "settings.read",
  "settings.write",
  "staff.manage",
];
const defaults: Record<Role, string[]> = {
  admin: capabilities,
  inventory_manager: [
    "products.read",
    "products.write",
    "inventory.read",
    "inventory.write",
    "orders.read",
    "orders.fulfill",
    "orders.approve",
    "orders.capture",
    "orders.complete",
  ],
  customer_support: ["orders.read", "customers.read", "customers.write"],
};

export function StaffDialog({
  onClose,
  demo,
}: {
  onClose: () => void;
  demo: boolean;
}) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [count, setCount] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!demo);
  const [grants, setGrants] = useState<Grant[] | null>(null);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [role, setRole] = useState<Role>("customer_support");
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (demo) return;
    let active = true;
    sdk.admin.user
      .list({ limit: 100 })
      .then((result) => {
        if (active) {
          setStaff(result.users);
          setCount(result.count);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError(
            "Could not load staff. Check your connection and access, then reopen this window.",
          );
          setLoading(false);
        }
      });
    sdk.client
      .fetch<{ grants: Grant[]; enforcement: boolean }>("/admin/staff-access")
      .then((result) => {
        if (
          active &&
          result.enforcement === true &&
          Array.isArray(result.grants)
        )
          setGrants(result.grants);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [demo]);

  async function save() {
    if (!editing) return;
    setSaving(true);
    setError("");
    try {
      const result = await sdk.client.fetch<{ grant: Grant }>(
        `/admin/staff-access/${editing.id}`,
        { method: "POST", body: { role, overrides } },
      );
      setGrants((previous) => [
        ...(previous || []).filter((item) => item.user_id !== editing.id),
        result.grant,
      ]);
      setEditing(null);
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Could not update access.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <PanelDialog title="Staff & permissions" description="Manage the people who work in this store." onClose={onClose}>
        {!grants && (
          <div className="staff-warning" role="status">
            <ShieldAlert size={20} />
            <div>
              <strong>Unable to load permissions</strong>
              <p>
                Check your connection and access, then reopen this window.
                Invitations and permission changes are unavailable until
                permissions are verified.
              </p>
            </div>
          </div>
        )}
        <section className="staff-section">
          <div className="staff-section-title">
            <div>
              <h3>Store staff</h3>
              <p>People with an account on this Medusa backend.</p>
            </div>
            {!loading && !error && !demo && (
              <span>
                {count} {count === 1 ? "person" : "people"}
              </span>
            )}
          </div>
          {demo ? (
            <p className="staff-empty">
              Staff are unavailable in preview mode.
            </p>
          ) : loading ? (
            <p className="staff-empty">Loading staff…</p>
          ) : error && !staff.length ? (
            <p className="login-error" role="alert">
              {error}
            </p>
          ) : staff.length === 0 ? (
            <p className="staff-empty">No staff accounts found.</p>
          ) : (
            <>
              <div className="staff-list">
                {staff.map((member) => {
                  const grant = grants?.find(
                    (item) => item.user_id === member.id,
                  );
                  return (
                    <div className="staff-person" key={member.id}>
                      <span className="staff-avatar">
                        {(member.first_name || member.email)
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                      <span>
                        <strong>
                          {[member.first_name, member.last_name]
                            .filter(Boolean)
                            .join(" ") || member.email}
                        </strong>
                        <small>{member.email}</small>
                      </span>
                      <span className="staff-access">
                        {grant
                          ? roleNames[grant.role]
                          : "Access not configured"}
                      </span>
                      {grants && (
                        <button
                          className="button"
                          onClick={() => {
                            setEditing(member);
                            setRole(grant?.role || "customer_support");
                            setOverrides(grant?.overrides || {});
                            setError("");
                          }}
                        >
                          Edit access
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              {count > staff.length && (
                <p className="staff-empty">
                  Showing the first {staff.length} of {count} staff members.
                </p>
              )}
            </>
          )}
        </section>
        {editing && (
          <section className="staff-section staff-editor">
            <h3>Edit access for {editing.email}</h3>
            <label>
              Role{" "}
              <Dropdown
                label="Role"
                value={role}
                options={Object.entries(roleNames).map(([value, label]) => ({
                  value,
                  label,
                }))}
                onValueChange={(value) => {
                  setRole(value as Role);
                  setOverrides({});
                }}
              />
            </label>
            <p className="staff-description">
              Change individual permissions below. Changing the role restores
              its defaults. Staff management requires a full Admin account.
            </p>
            <div className="staff-permissions">
              {capabilities.map((permission) => (
                <label className="staff-permission" key={permission}>
                  <input
                    type="checkbox"
                    disabled={
                      permission === "orders.capture" ||
                      (permission === "staff.manage" && role !== "admin")
                    }
                    checked={
                      permission === "orders.capture"
                        ? false
                        : (overrides[permission] ??
                          defaults[role].includes(permission))
                    }
                    onChange={(e) =>
                      setOverrides((current) => ({
                        ...current,
                        [permission]: e.target.checked,
                      }))
                    }
                  />
                  <span className="staff-permission-text">
                    {permission.replace(".", " — ")}
                    {permission === "orders.capture" && (
                      <small>Requires verified Razorpay integration</small>
                    )}
                  </span>
                </label>
              ))}
            </div>
            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}
            <div className="staff-edit-actions">
              <button className="button" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button
                className="button primary"
                onClick={save}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save access"}
              </button>
            </div>
          </section>
        )}
        {!demo && grants && <SellerInvites />}
    </PanelDialog>
  );
}
