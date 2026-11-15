import type { Customer } from "../../lib/medusa";
import { EntityListLayout } from "../../lib/ui/EntityListLayout";
import type { EntityListControls } from "../../lib/ui/EntityListLayout";
import { CustomersTable } from "./CustomersTable";

export function CustomersPage({
  customers,
  onSelect,
  ...controls
}: EntityListControls & {
  customers: Customer[];
  onSelect: (customer: Customer) => void;
}) {
  return (
    <EntityListLayout
      {...controls}
      label="Customers"
      tabs={[{ key: "all", label: "All customers" }]}
    >
      <CustomersTable customers={customers} onSelect={onSelect} />
    </EntityListLayout>
  );
}
