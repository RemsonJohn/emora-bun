import { LoaderCircle } from "lucide-react";
import { money } from "../../lib/medusa";
import type { Order } from "../../lib/medusa";

export function SalesChart({
  orders,
  days,
  loading,
  now,
}: {
  orders: Order[];
  days: number;
  loading: boolean;
  now: number;
}) {
  const dayKey = (value: Date) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(
      value,
    );
  const bins = Array.from({ length: days }, (_, i) => {
    const start = new Date(now - (days - 1 - i) * 86400000);
    return {
      label: new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        timeZone: "Asia/Kolkata",
      }).format(start),
      value: orders
        .filter((o) => dayKey(new Date(o.created_at)) === dayKey(start))
        .reduce((sum, o) => sum + o.total, 0),
    };
  });
  const max = Math.max(...bins.map((b) => b.value), 100);
  const points = bins
    .map(
      (b, i) =>
        `${60 + (i / Math.max(days - 1, 1)) * 910},${190 - (b.value / max) * 150}`,
    )
    .join(" ");
  return (
    <div className="sales-chart">
      <div className="chart-heading">
        <span>
          <i />
          Captured sales
        </span>
        <span className="muted">
          Daily totals · {days === 1 ? "Today" : `Last ${days} days`}
        </span>
      </div>
      {loading ? (
        <div className="chart-loading">
          <LoaderCircle className="spin" size={22} />
          Loading sales
        </div>
      ) : (
        <>
          <svg
            viewBox="0 0 1000 240"
            role="img"
            aria-label={`Daily captured sales in INR: ${bins.map((b) => `${b.label}: ${b.value}`).join(", ")}`}
          >
            <defs>
              <linearGradient id="sales-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#228b73" stopOpacity=".14" />
                <stop offset="100%" stopColor="#228b73" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 1, 2, 3].map((i) => (
              <g key={i}>
                <line
                  x1="60"
                  y1={40 + i * 50}
                  x2="970"
                  y2={40 + i * 50}
                  stroke="#eceeeb"
                  strokeDasharray="3 4"
                />
                <text x="0" y={44 + i * 50} fill="#697262" fontSize="11">
                  {money(max * (1 - i / 3))}
                </text>
              </g>
            ))}
            <polygon
              points={`60,190 ${points} ${days === 1 ? 60 : 970},190`}
              fill="url(#sales-fill)"
            />
            <polyline
              points={points}
              fill="none"
              stroke="#258772"
              strokeWidth="2.6"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {bins.map((b, i) => (
              <g key={i}>
                <circle
                  cx={60 + (i / Math.max(days - 1, 1)) * 910}
                  cy={190 - (b.value / max) * 150}
                  r="3"
                  fill="#258772"
                >
                  <title>
                    {b.label}: {money(b.value)}
                  </title>
                </circle>
                {(days <= 7 || i % 5 === 0 || i === days - 1) && (
                  <text
                    x={60 + (i / Math.max(days - 1, 1)) * 910}
                    y="224"
                    textAnchor="middle"
                    fill="#697262"
                    fontSize="11"
                  >
                    {b.label}
                  </text>
                )}
              </g>
            ))}
          </svg>
          {!orders.length && (
            <p className="chart-empty">No captured INR sales in this period.</p>
          )}
        </>
      )}
    </div>
  );
}
