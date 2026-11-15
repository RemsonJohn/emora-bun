import type { Order } from "../../lib/medusa";
import { EntityListLayout } from "../../lib/ui/EntityListLayout";
import type { EntityListControls } from "../../lib/ui/EntityListLayout";
import { OrdersTable } from "./OrdersTable";

export function OrdersPage({
  orders,
  onSelect,
  ...controls
}: EntityListControls & { orders: Order[]; onSelect: (order: Order) => void }) {
  return (
    <EntityListLayout
      {...controls}
      label="Orders"
      tabs={[
        { key: "all", label: "All orders" },
        { key: "not_fulfilled", label: "Unfulfilled (this page)" },
        { key: "captured", label: "Paid (this page)" },
      ]}
      note={
        controls.status !== "all"
          ? "status filter applies to this page"
          : undefined
      }
    >
      <OrdersTable orders={orders} onSelect={onSelect} />
    </EntityListLayout>
  );
}
