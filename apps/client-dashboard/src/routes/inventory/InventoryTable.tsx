import { Empty } from "../../lib/ui/Empty";
import { SelectableTable } from "../../lib/ui/SelectableTable";
import type { Product } from "../../lib/medusa";

export function InventoryTable({
  filteredProducts,
  demo,
  onManage,
}: {
  filteredProducts: Product[];
  demo: boolean;
  onManage: (product: Product) => void;
}) {
  return (
    <div className="table-scroll">
      <SelectableTable name="Inventory">
        <table>
          <thead>
            <tr>
              <th>Product / variant</th>
              <th>SKU</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.flatMap((p) =>
              (p.variants || []).map((v) => (
                <tr key={v.id}>
                  <td className="inventory-product-cell">
                    <strong>{p.title}</strong>{" — "}<span>{v.title}</span>
                  </td>
                  <td>{v.sku || "—"}</td>
                  <td>
                    {demo ? (
                      "Preview only"
                    ) : (
                      <button type="button" className="button" onClick={() => onManage(p)}>
                        Manage inventory
                      </button>
                    )}
                  </td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </SelectableTable>
      {!filteredProducts.length && <Empty title="No inventory to show" />}
    </div>
  );
}
