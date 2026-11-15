import { date, money } from "../../lib/medusa";
import type { Order } from "../../lib/medusa";
import { Badge } from "../../lib/ui/Badge";
import { Empty } from "../../lib/ui/Empty";
import { TableLoading } from "../../lib/ui/TableLoading";
import { SelectableTable } from "../../lib/ui/SelectableTable";

export function OrdersTable({
  orders,
  onSelect,
  loading = false,
}: {
  orders: Order[];
  onSelect: (o: Order) => void;
  loading?: boolean;
}) {
  if (loading) return <TableLoading />;
  if (!orders.length)
    return (
      <Empty title="Your first order is a beginning">
        When a customer places an order, you’ll find it here.
      </Empty>
    );
  return (
    <div className="table-scroll">
      <SelectableTable name="Orders">
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Payment</th>
              <th>Fulfilment</th>
              <th className="align-right">Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>
                  <button className="entity-link" onClick={() => onSelect(o)}>
                    #{o.display_id}
                  </button>
                  <small>{date(o.created_at)}</small>
                </td>
                <td>{o.email || "Guest customer"}</td>
                <td>
                  <Badge value={o.payment_status} />
                </td>
                <td>
                  <Badge value={o.fulfillment_status} />
                </td>
                <td className="align-right amount">
                  {money(o.total, o.currency_code)}
                </td>
                <td>
                  <button
                    className="table-action"
                    aria-label={`View order ${o.display_id}`}
                    onClick={() => onSelect(o)}
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
  );
}
