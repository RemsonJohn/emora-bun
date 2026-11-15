import { useEffect, useState } from "react";
import { Activity, RefreshCw } from "lucide-react";
import { api, errorMessage } from "../../lib/medusa";
import { Dropdown } from "../../lib/ui/Dropdown";
import "./storefront-analytics.css";

type Stage =
  | "storefront"
  | "product"
  | "cart"
  | "checkout"
  | "checkout_address"
  | "checkout_delivery"
  | "checkout_payment"
  | "checkout_review"
  | "confirmation";
type Report = {
  counts: Record<Stage, number>;
  observed: number;
  total: number;
  truncated: boolean;
  inactivity_minutes: number;
};
const labels: { key: Stage; name: string; description: string }[] = [
  {
    key: "storefront",
    name: "Other storefront pages",
    description: "Home, collections and other pages",
  },
  {
    key: "product",
    name: "Product pages",
    description: "Viewed an individual product",
  },
  { key: "cart", name: "Cart", description: "Last seen on the cart page" },
  {
    key: "checkout",
    name: "Checkout",
    description: "Last seen during checkout",
  },
  {
    key: "checkout_address",
    name: "Checkout · Address",
    description: "Last seen on address details",
  },
  {
    key: "checkout_delivery",
    name: "Checkout · Delivery",
    description: "Last seen choosing delivery",
  },
  {
    key: "checkout_payment",
    name: "Checkout · Payment",
    description: "Last seen choosing payment",
  },
  {
    key: "checkout_review",
    name: "Checkout · Review",
    description: "Last seen reviewing the order",
  },
  {
    key: "confirmation",
    name: "Order confirmation",
    description: "Reached the confirmation page",
  },
];

export function StorefrontAnalytics({ demo }: { demo: boolean }) {
  const [days, setDays] = useState(7);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!demo);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (demo) return;
    let active = true;
    queueMicrotask(() => {
      if (active) {
        setLoading(true);
        setError("");
        setReport(null);
      }
    });
    api<Report>("/admin/storefront-analytics", { days })
      .then((data) => {
        if (active) setReport(data);
      })
      .catch((reason) => {
        if (active) setError(errorMessage(reason));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [days, demo, retry]);
  return (
    <section
      className="panel storefront-report"
      aria-labelledby="storefront-report-title"
    >
      <div className="storefront-report-header">
        <div>
          <h2 id="storefront-report-title">Where shoppers were last seen</h2>
          <p>Understand which part of the shopping journey needs attention.</p>
        </div>
        <div className="storefront-report-actions">
          <label>
            Reporting period
            <Dropdown
              label="Reporting period"
              value={String(days)}
              onValueChange={(value) => setDays(Number(value))}
              options={[
                { value: "1", label: "Last 24 hours" },
                { value: "7", label: "Last 7 days" },
                { value: "30", label: "Last 30 days" },
              ]}
            />
          </label>
          {!demo && (
            <button
              type="button"
              className="icon-button"
              aria-label="Refresh storefront analytics"
              onClick={() => setRetry((value) => value + 1)}
            >
              <RefreshCw size={16} />
            </button>
          )}
        </div>
      </div>
      {demo ? (
        <div className="storefront-report-empty">
          <Activity size={24} />
          <strong>Connect your store to see activity</strong>
          <p>
            Storefront analytics use opted-in visitor sessions. Sample data is
            not shown here.
          </p>
        </div>
      ) : loading ? (
        <div className="storefront-report-empty" role="status">
          Loading storefront analytics…
        </div>
      ) : error ? (
        <div className="storefront-report-empty" role="alert">
          <strong>Couldn’t load storefront analytics</strong>
          <p>{error}</p>
          <button
            className="button"
            onClick={() => setRetry((value) => value + 1)}
          >
            Try again
          </button>
        </div>
      ) : !report?.observed ? (
        <div className="storefront-report-empty">
          <Activity size={24} />
          <strong>No completed sessions yet</strong>
          <p>
            Analytics begin when visitors opt in. A session appears after 30
            minutes without activity.
          </p>
        </div>
      ) : (
        <>
          <div className="storefront-report-summary">
            <strong>{report.observed.toLocaleString("en-IN")}</strong>
            <span>
              inactive, opted-in sessions
              <br />
              <small>
                Last {days === 1 ? "24 hours" : `${days} days`} ·{" "}
                {report.inactivity_minutes}-minute inactivity window
              </small>
            </span>
          </div>
          <div className="storefront-bars">
            {labels.map((stage) => {
              const count = report.counts[stage.key] || 0;
              const percent = (count / report.observed) * 100;
              return (
                <div className="storefront-bar-row" key={stage.key}>
                  <div className="storefront-bar-label">
                    <strong>{stage.name}</strong>
                    <small>{stage.description}</small>
                  </div>
                  <div className="storefront-bar-track">
                    <span style={{ width: `${percent}%` }} />
                  </div>
                  <div className="storefront-bar-value">
                    <strong>{count.toLocaleString("en-IN")}</strong>
                    <small>{percent.toFixed(1)}%</small>
                  </div>
                </div>
              );
            })}
          </div>
          {report.truncated && (
            <p className="storefront-sample">
              Showing up to 5,000 recent inactive sessions;{" "}
              {report.total.toLocaleString("en-IN")} match this period.
            </p>
          )}
          <p className="storefront-report-note">
            This shows each session’s last recorded page category, not confirmed
            abandonment. Visitors may return, browse without consent, use
            blockers, or skip stages. Confirmation-page visits are not verified
            payments.
          </p>
        </>
      )}
    </section>
  );
}
