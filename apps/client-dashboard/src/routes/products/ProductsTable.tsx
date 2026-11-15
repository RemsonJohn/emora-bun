import { ShoppingBag } from "lucide-react";
import type { Product } from "../../lib/medusa";
import { Badge } from "../../lib/ui/Badge";
import { Empty } from "../../lib/ui/Empty";
import { SelectableTable } from "../../lib/ui/SelectableTable";

export function ProductsTable({
  products,
  onSelect,
}: {
  products: Product[];
  onSelect: (p: Product) => void;
}) {
  if (!products.length)
    return (
      <Empty title="No products found">
        Try another search or add your first product.
      </Empty>
    );
  return (
    <div className="table-scroll">
      <SelectableTable name="Products">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Status</th>
              <th>Variants</th>
              <th>Collection</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr key={p.id}>
                <td>
                  <button className="product-cell" onClick={() => onSelect(p)}>
                    <span className={`product-thumbnail tint-${i % 4}`}>
                      {p.thumbnail ? (
                        <img src={p.thumbnail} alt="" />
                      ) : (
                        <ShoppingBag size={22} strokeWidth={1.2} />
                      )}
                    </span>
                    <span>
                      <strong>{p.title}</strong>
                      <small>{p.handle}</small>
                    </span>
                  </button>
                </td>
                <td>
                  <Badge value={p.status} />
                </td>
                <td>{p.variants?.length || 0} variants</td>
                <td>{p.collection?.title || "—"}</td>
                <td>
                  <button
                    className="table-action"
                    aria-label={`Edit ${p.title}`}
                    onClick={() => onSelect(p)}
                  >
                    Edit
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
