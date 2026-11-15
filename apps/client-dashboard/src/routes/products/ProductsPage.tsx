import type { Product } from "../../lib/medusa";
import { EntityListLayout } from "../../lib/ui/EntityListLayout";
import type { EntityListControls } from "../../lib/ui/EntityListLayout";
import { ProductsTable } from "./ProductsTable";

export function ProductsPage({
  products,
  onSelect,
  ...controls
}: EntityListControls & {
  products: Product[];
  onSelect: (product: Product) => void;
}) {
  return (
    <EntityListLayout
      {...controls}
      label="Products"
      tabs={[
        { key: "all", label: "All products" },
        { key: "published", label: "Active" },
        { key: "draft", label: "Draft" },
      ]}
    >
      <ProductsTable products={products} onSelect={onSelect} />
    </EntityListLayout>
  );
}
