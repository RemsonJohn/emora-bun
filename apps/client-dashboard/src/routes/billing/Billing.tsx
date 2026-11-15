import { SelectableTable } from "../../lib/ui/SelectableTable";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FileText,
  Printer,
  Search,
} from "lucide-react";
import { api, date, demoOrders, errorMessage, money } from "../../lib/medusa";
import type { Order } from "../../lib/medusa";
import "./billing.css";

type OrderList = { orders: Order[]; count: number };
const orderFields =
  "+email,+currency_code,+total,+payment_status,+fulfillment_status";
const label = (value?: string) => (value || "unknown").replaceAll("_", " ");

export function Billing({
  demo,
  storeName,
  orderId,
  onOrderChange,
}: {
  demo: boolean;
  storeName: string;
  orderId: string | null;
  onOrderChange: (id: string | null) => void;
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [count, setCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search);
      setOffset(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) {
        setLoading(true);
        setError("");
        setDetail(null);
      }
    });
    const request = orderId
      ? demo
        ? Promise.resolve({
            order: demoOrders.find((order) => order.id === orderId) || null,
          })
        : api<{ order: Order }>(
            `/admin/orders/${encodeURIComponent(orderId)}`,
            {
              fields:
                "+email,+currency_code,+payment_status,+fulfillment_status",
            },
          )
      : demo
        ? Promise.resolve({
            orders: demoOrders
              .filter((order) =>
                `${order.display_id} ${order.email}`
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              )
              .slice(offset, offset + 25),
            count: demoOrders.filter((order) =>
              `${order.display_id} ${order.email}`
                .toLowerCase()
                .includes(query.toLowerCase()),
            ).length,
          })
        : api<OrderList>("/admin/orders", {
            limit: 25,
            offset,
            order: "-created_at",
            fields: orderFields,
            ...(query ? { q: query } : {}),
          });
    request
      .then((result) => {
        if (!active) return;
        if ("order" in result) {
          if (!result.order) throw new Error("This order could not be found.");
          setDetail(result.order);
        } else {
          setOrders(result.orders);
          setCount(result.count);
        }
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
  }, [demo, orderId, query, offset, retry]);

  return (
    <div className="billing-page">
      <div className="page-heading billing-heading">
        <div>
          {orderId && (
            <button
              type="button"
              className="back-link"
              onClick={() => onOrderChange(null)}
            >
              <ArrowLeft size={15} />
              Back to billing
            </button>
          )}
          <h1>
            {orderId
              ? `Order #${detail?.display_id || "…"}`
              : "Billing & invoices"}
          </h1>
          <p>
            {orderId
              ? "Review the order’s payment and totals."
              : "Review customer payments and find order billing details."}
          </p>
        </div>
        {detail && !loading && !error && (
          <button className="button" onClick={() => window.print()}>
            <Printer size={15} />
            Print order summary
          </button>
        )}
      </div>
      {error && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
          <button onClick={() => setRetry((value) => value + 1)}>Retry</button>
        </div>
      )}
      {loading ? (
        <div className="billing-loading" role="status">
          Loading billing details…
        </div>
      ) : error ? null : !orderId ? (
        <>
          <div className="billing-intro">
            <span className="billing-intro-icon">
              <FileText size={21} />
            </span>
            <div>
              <strong>Every order, accounted for</strong>
              <p>
                Search by order number or customer email to review its payment
                and order summary.
              </p>
            </div>
          </div>
          <section className="panel billing-list">
            <div className="panel-heading">
              <div>
                <h2>Customer orders</h2>
                <p>Payment status and amounts from your store</p>
              </div>
              <span className="billing-count">{count} orders</span>
            </div>
            <div className="table-tools">
              <label className="table-search">
                <Search size={16} />
                <input
                  aria-label="Search billing orders"
                  placeholder="Search order number or email…"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
            </div>
            {orders.length ? (
              <div className="table-scroll">
                <SelectableTable name="Billing orders">
                  <table>
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Payment</th>
                        <th className="align-right">Total</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id}>
                          <td>
                            <button
                              className="entity-link"
                              onClick={() => onOrderChange(order.id)}
                            >
                              #{order.display_id}
                            </button>
                          </td>
                          <td>{order.email || "Guest customer"}</td>
                          <td>{date(order.created_at)}</td>
                          <td>
                            <span
                              className={`billing-status ${order.payment_status === "captured" ? "paid" : ""}`}
                            >
                              {label(order.payment_status)}
                            </span>
                          </td>
                          <td className="align-right amount">
                            {money(order.total, order.currency_code)}
                          </td>
                          <td>
                            <button
                              className="table-action"
                              aria-label={`View order ${order.display_id} billing`}
                              onClick={() => onOrderChange(order.id)}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </SelectableTable>
              </div>
            ) : (
              <div className="empty">
                <FileText size={30} />
                <h3>No orders found</h3>
                <p>
                  {query
                    ? "Try a different order number or email."
                    : "Customer orders will appear here when they are placed."}
                </p>
              </div>
            )}
            <div className="pagination">
              <span>{count} results</span>
              <div>
                <button
                  className="icon-button"
                  aria-label="Previous billing page"
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - 25))}
                >
                  <ChevronLeft size={17} />
                </button>
                <span>Page {Math.floor(offset / 25) + 1}</span>
                <button
                  className="icon-button"
                  aria-label="Next billing page"
                  disabled={offset + 25 >= count}
                  onClick={() => setOffset(offset + 25)}
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </section>
          <p className="billing-footnote">
            GST invoices are not configured yet. Payment and refund actions are
            available from the order in Medusa Admin.
          </p>
        </>
      ) : (
        detail && (
          <>
            <div className="invoice-layout">
              <section
                className="panel invoice-sheet"
                aria-label="Order summary"
              >
                <div className="invoice-top">
                  <div>
                    <div className="invoice-logo">
                      <span>e</span> {storeName}
                    </div>
                    <p>Customer order summary</p>
                  </div>
                  <div className="invoice-reference">
                    <strong>ORDER SUMMARY</strong>
                    <span>#{detail.display_id}</span>
                    <small>{date(detail.created_at)}</small>
                  </div>
                </div>
                <div className="invoice-notice">
                  {demo ? "SAMPLE DATA · " : ""}Order summary only · This is not
                  a GST tax invoice
                </div>
                <div className="invoice-parties">
                  <div>
                    <span>Customer</span>
                    <strong>
                      {[
                        detail.billing_address?.first_name,
                        detail.billing_address?.last_name,
                      ]
                        .filter(Boolean)
                        .join(" ") || "Customer"}
                    </strong>
                    <p>{detail.email || "Email not provided"}</p>
                    {detail.billing_address && (
                      <p>
                        {[
                          detail.billing_address.address_1,
                          detail.billing_address.address_2,
                          detail.billing_address.city,
                          detail.billing_address.province,
                          detail.billing_address.postal_code,
                          detail.billing_address.country_code?.toUpperCase(),
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                  </div>
                  <div>
                    <span>Payment status</span>
                    <strong className="invoice-payment">
                      {label(detail.payment_status)}
                    </strong>
                    <p>Order placed {date(detail.created_at)}</p>
                  </div>
                </div>
                <div className="table-scroll">
                  <SelectableTable name="Order summary items">
                    <table>
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Qty</th>
                          <th className="align-right">Unit price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.items?.map((item) => (
                          <tr key={item.id}>
                            <td>{item.title}</td>
                            <td>{item.quantity}</td>
                            <td className="align-right">
                              {money(item.unit_price, detail.currency_code)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </SelectableTable>
                  {!detail.items?.length && (
                    <p className="invoice-no-items">
                      No order items available.
                    </p>
                  )}
                </div>
                <div className="invoice-totals">
                  {detail.subtotal != null && (
                    <div>
                      <span>Subtotal</span>
                      <span>
                        {money(detail.subtotal, detail.currency_code)}
                      </span>
                    </div>
                  )}
                  {detail.discount_total != null && (
                    <div>
                      <span>Discount</span>
                      <span>
                        −{money(detail.discount_total, detail.currency_code)}
                      </span>
                    </div>
                  )}
                  {detail.shipping_total != null && (
                    <div>
                      <span>Shipping</span>
                      <span>
                        {money(detail.shipping_total, detail.currency_code)}
                      </span>
                    </div>
                  )}
                  {detail.tax_total != null && (
                    <div>
                      <span>Tax</span>
                      <span>
                        {money(detail.tax_total, detail.currency_code)}
                      </span>
                    </div>
                  )}
                  <div className="invoice-total">
                    <strong>Total</strong>
                    <strong>{money(detail.total, detail.currency_code)}</strong>
                  </div>
                </div>
                <div className="invoice-end">
                  Thank you for supporting {storeName}.
                </div>
              </section>
              <aside className="billing-aside">
                <section className="panel form-panel">
                  <span className="billing-intro-icon">
                    <FileText size={20} />
                  </span>
                  <h2>GST tax invoice</h2>
                  <p>
                    GSTIN, HSN, tax splits and invoice numbering need to be
                    configured before a tax invoice can be issued.
                  </p>
                  <p className="field-help">
                    This order summary uses the totals returned by Medusa and
                    does not create an invoice record.
                  </p>
                </section>
                <section className="panel form-panel">
                  <h2>Payment</h2>
                  <span
                    className={`billing-status ${detail.payment_status === "captured" ? "paid" : ""}`}
                  >
                    {label(detail.payment_status)}
                  </span>
                  <p className="field-help">
                    Refunds and payment actions remain in Medusa Admin.
                  </p>
                </section>
              </aside>
            </div>
          </>
        )
      )}
    </div>
  );
}
