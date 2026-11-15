import { date } from "../../lib/medusa";
import type { Customer } from "../../lib/medusa";
import { Empty } from "../../lib/ui/Empty";
import { SelectableTable } from "../../lib/ui/SelectableTable";

export function CustomersTable({
  customers,
  onSelect,
}: {
  customers: Customer[];
  onSelect: (c: Customer) => void;
}) {
  if (!customers.length)
    return <Empty title="Your customer list starts here" />;
  return (
    <div className="table-scroll">
      <SelectableTable name="Customers">
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td>
                  <button className="entity-link" onClick={() => onSelect(c)}>
                    {[c.first_name, c.last_name].filter(Boolean).join(" ") ||
                      "Guest customer"}
                  </button>
                </td>
                <td>{c.email}</td>
                <td>{c.phone || "—"}</td>
                <td>{date(c.created_at)}</td>
                <td>
                  <button
                    className="table-action"
                    aria-label={`View customer ${c.email}`}
                    onClick={() => onSelect(c)}
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
