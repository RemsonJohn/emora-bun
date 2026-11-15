import {
  ArrowRight,
  ArrowUpRight,
  Box,
  Check,
  ChevronRight,
  ShoppingBag,
  ShoppingCart,
  Tag,
} from "lucide-react";
import { money } from "../../lib/medusa";
import type { Order, Product } from "../../lib/medusa";
import { Metric } from "../../lib/ui/Metric";
import { SalesChart } from "../analytics/SalesChart";
import { OrdersTable } from "../orders/OrdersTable";
import { StorefrontAnalytics } from "../analytics/StorefrontAnalytics";

export function OverviewPage({
  page,
  period,
  setPeriod,
  orders,
  counts,
  sales,
  activeOrders,
  paidOrders,
  products,
  busy,
  now,
  navigate,
  setStatus,
  pending,
  awaiting,
  setSelectedOrder,
  storefrontUrl,
  demo,
}: {
  page: string;
  period: number;
  setPeriod: (value: number) => void;
  orders: Order[];
  counts: { Orders: number; Products: number };
  sales: number;
  activeOrders: Order[];
  paidOrders: Order[];
  products: Product[];
  busy: boolean;
  now: number;
  navigate: (page: "Orders" | "Products" | "Settings") => boolean;
  setStatus: (value: string) => void;
  pending: number;
  awaiting: number;
  setSelectedOrder: (order: Order) => void;
  storefrontUrl: string;
  demo: boolean;
}) {
  return (
    <>
      <div className="overview-controls">
        <div className="period-switch" aria-label="Reporting period">
          {[
            { days: 1, label: "Today" },
            { days: 7, label: "Last 7 days" },
            { days: 30, label: "Last 30 days" },
          ].map((p) => (
            <button
              key={p.days}
              aria-pressed={period === p.days}
              className={period === p.days ? "selected" : ""}
              onClick={() => setPeriod(p.days)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <span className="muted report-note">
          IST · INR · Latest {orders.length} of {counts.Orders} orders
        </span>
      </div>
      <section className="panel overview-panel">
        <div className="metrics">
          <Metric
            label="Captured sales"
            value={money(sales)}
            note="Paid orders · INR only"
          />
          <Metric
            label="Orders"
            value={activeOrders.length.toLocaleString("en-IN")}
            note="Created in selected period"
          />
          <Metric
            label="Average order value"
            value={money(paidOrders.length ? sales / paidOrders.length : 0)}
            note="Captured sales ÷ paid orders"
          />
          <Metric
            label="Products"
            value={counts.Products.toLocaleString("en-IN")}
            note={`${products.filter((p) => p.status === "published").length} active in loaded products`}
          />
        </div>
        <SalesChart
          orders={paidOrders}
          days={period}
          loading={busy}
          now={now}
        />
      </section>
      <div className="action-strip">
        <span className="action-label">On your radar</span>
        <button
          onClick={() => {
            navigate("Orders");
            setStatus("not_fulfilled");
          }}
        >
          <Box size={17} />
          <strong>{pending}</strong> to fulfil
          <ChevronRight size={15} />
        </button>
        <button
          onClick={() => {
            navigate("Orders");
            setStatus("awaiting");
          }}
        >
          <ShoppingCart size={17} />
          <strong>{awaiting}</strong> payments pending
          <ChevronRight size={15} />
        </button>
        <button
          onClick={() => {
            navigate("Products");
            setStatus("draft");
          }}
        >
          <Tag size={17} />
          <strong>
            {products.filter((p) => p.status === "draft").length}
          </strong>{" "}
          draft products
          <ChevronRight size={15} />
        </button>
      </div>
      <div className="home-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>Recent orders</h2>
            <button className="text-button" onClick={() => navigate("Orders")}>
              View all orders <ArrowRight size={14} />
            </button>
          </div>
          <OrdersTable
            orders={orders.slice(0, 6)}
            onSelect={setSelectedOrder}
            loading={busy}
          />
        </section>
        <section className="panel store-checklist">
          <span className="checklist-icon">
            <ShoppingBag size={22} />
          </span>
          <h2>Your store, your next chapter.</h2>
          <p>Keep the essentials in place for a smooth shopping experience.</p>
          <button onClick={() => navigate("Products")}>
            <span
              className={counts.Products ? "step-check done" : "step-check"}
            >
              {counts.Products ? <Check size={12} /> : "1"}
            </span>
            <span>
              Add your products
              <small>Give your collection a home</small>
            </span>
            <ChevronRight size={16} />
          </button>
          <button onClick={() => navigate("Settings")}>
            <span className="step-check">2</span>
            <span>
              Review store settings
              <small>Payments, shipping and taxes</small>
            </span>
            <ChevronRight size={16} />
          </button>
          <a href={storefrontUrl} target="_blank" rel="noreferrer">
            <span className="step-check">3</span>
            <span>
              Walk through your store
              <small>See it through your customers’ eyes</small>
            </span>
            <ArrowUpRight size={16} />
          </a>
          <div className="checklist-foot">A little care goes a long way.</div>
        </section>
      </div>
      {page === "Analytics" && <StorefrontAnalytics demo={demo} />}
    </>
  );
}
