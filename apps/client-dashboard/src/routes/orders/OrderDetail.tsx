import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { api, date, errorMessage, money, sdk } from "../../lib/medusa";
import type { Order } from "../../lib/medusa";
import { Badge } from "../../lib/ui/Badge";
import { PageHeading } from "../../lib/ui/PageHeading";
import { TableLoading } from "../../lib/ui/TableLoading";
import { SelectableTable } from "../../lib/ui/SelectableTable";

export function OrderDetail({
  order,
  demo,
  canReview,
  canComplete,
  canManage,
  canBilling,
  nativeAdmin,
  onBack,
  onBilling,
}: {
  order: Order;
  demo: boolean;
  canReview: boolean;
  canComplete: boolean;
  canManage: boolean;
  canBilling: boolean;
  nativeAdmin: (path: string) => string;
  onBack: () => void;
  onBilling: () => void;
}) {
  const [detail, setDetail] = useState(order);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!demo);
  const [working, setWorking] = useState(false);
  useEffect(() => {
    if (demo) return;
    let active = true;
    api<{ order: Order }>(`/admin/orders/${order.id}`, { fields: "+metadata" })
      .then((r) => {
        if (active) setDetail(r.order);
      })
      .catch((e) => {
        if (active) setError(errorMessage(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [order.id, demo]);
  const reviewed = Boolean(detail.metadata?.emora_review);
  const review = async () => {
    if (demo || working) return;
    setWorking(true);
    setError("");
    try {
      const result = await sdk.client.fetch<{ review: unknown }>(
        `/admin/orders/${detail.id}/approve`,
        { method: "POST" },
      );
      setDetail((current) => ({
        ...current,
        metadata: { ...current.metadata, emora_review: result.review },
      }));
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setWorking(false);
    }
  };
  const complete = async () => {
    if (demo || working || !confirm("Mark this order complete?")) return;
    setWorking(true);
    setError("");
    try {
      const result = await sdk.client.fetch<{ order: Order }>(
        `/admin/orders/${detail.id}/complete`,
        { method: "POST", body: {} },
      );
      setDetail(result.order);
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setWorking(false);
    }
  };
  return (
    <>
      <PageHeading
        title={`Order #${detail.display_id}`}
        description={date(detail.created_at)}
        back={onBack}
        actions={
          <>
            {canBilling && (
              <button className="button" onClick={onBilling}>
                Billing details
              </button>
            )}
            {canReview && (
              <button
                className="button"
                onClick={review}
                disabled={working || loading || reviewed || demo}
              >
                {reviewed ? "Reviewed" : "Approve review"}
              </button>
            )}
            {canComplete && (
              <button
                className="button"
                onClick={complete}
                disabled={
                  working || loading || detail.status === "completed" || demo
                }
              >
                Complete order
              </button>
            )}
            {!demo && canManage && (
              <a
                className="button primary"
                href={nativeAdmin(`/orders/${detail.id}`)}
                target="_blank"
                rel="noreferrer"
              >
                Manage order in Medusa <ExternalLink size={14} />
              </a>
            )}
          </>
        }
      />
      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}
      <div className="editor-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>Order items</h2>
            <Badge value={detail.fulfillment_status} />
          </div>
          {loading ? (
            <TableLoading />
          ) : (
            <div className="table-scroll">
              <SelectableTable name="Order items">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
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
            </div>
          )}
          <div className="order-total">
            <strong>Total</strong>
            <strong>{money(detail.total, detail.currency_code)}</strong>
          </div>
        </section>
        <section className="panel form-panel">
          <h2>Customer</h2>
          <p>{detail.email}</p>
          <h2>Payment</h2>
          <Badge value={detail.payment_status} />
          <p className="field-help">
            Payments, fulfilments and refunds use Medusa’s existing workflows.
            This dashboard does not change payment states.
          </p>
        </section>
      </div>
    </>
  );
}
