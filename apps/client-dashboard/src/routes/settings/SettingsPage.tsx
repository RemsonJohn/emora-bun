import { ChevronRight, ExternalLink } from "lucide-react";

export function SettingsPage({
  storeName,
  demo,
  nativeAdmin,
  setStaffOpen,
}: {
  storeName: string;
  demo: boolean;
  nativeAdmin: (path: string) => string;
  setStaffOpen: (value: boolean) => void;
}) {
  return (
    <section className="panel settings-panel">
      <div className="panel-heading">
        <h2>Store settings</h2>
        <span className="muted">{storeName}</span>
      </div>
      {[
        {
          title: "Store details",
          text: "Business name, contact details and store information",
          path: "/settings/store",
        },
        {
          title: "Staff & permissions",
          text: "Manage access to your store",
          path: "/settings/users",
        },
        {
          title: "Payments",
          text: "Providers are configured in the backend; merchant onboarding is planned",
          path: "/settings/regions",
        },
        {
          title: "Shipping & fulfilment",
          text: "Shipping profiles and delivery options",
          path: "/settings/shipping-profiles",
        },
        {
          title: "Taxes & regions",
          text: "Tax regions, rates and currencies",
          path: "/settings/tax-regions",
        },
      ].map((s) =>
        s.title === "Staff & permissions" ? (
          <button
            className="settings-staff-button"
            key={s.title}
            onClick={() => setStaffOpen(true)}
          >
            <span>
              <strong>{s.title}</strong>
              <small>{s.text}</small>
            </span>
            <ChevronRight size={17} />
          </button>
        ) : (
          <a
            key={s.title}
            href={demo ? undefined : nativeAdmin(s.path)}
            target="_blank"
            rel="noreferrer"
            aria-disabled={demo}
          >
            <span>
              <strong>{s.title}</strong>
              <small>{s.text}</small>
            </span>
            <ExternalLink size={17} />
          </a>
        ),
      )}
      <p className="settings-note">
        Advanced settings open in Medusa Admin. Razorpay onboarding, GST
        invoices, R2 media, and custom staff permissions are not implemented in
        this release.
      </p>
    </section>
  );
}
