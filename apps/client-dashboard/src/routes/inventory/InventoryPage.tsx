import { useCallback, useState } from "react";
import type { Product } from "../../lib/medusa";
import { EntityListLayout } from "../../lib/ui/EntityListLayout";
import type { EntityListControls } from "../../lib/ui/EntityListLayout";
import { InventoryTable } from "./InventoryTable";
import { ProductInventory } from "../../lib/ui/ProductInventory";
import { PanelDialog } from "../../lib/ui/Dialog";

function InventoryDialog({ product, canWrite, demo, onDirty, onClose }: { product: Product; canWrite: boolean; demo: boolean; onDirty: (dirty: boolean) => void; onClose: () => void }) {
  return <PanelDialog className="inventory-dialog" title="Manage inventory" description={product.title} onClose={onClose}>
    <ProductInventory productId={product.id} canRead canWrite={canWrite} demo={demo} onDirtyChange={onDirty} />
  </PanelDialog>;
}

export function InventoryPage({
  products,
  canWriteInventory,
  onDirty,
  ...controls
}: EntityListControls & {
  products: Product[];
  canWriteInventory: boolean;
  onDirty: (dirty: boolean) => void;
}) {
  const [selected, setSelected] = useState<Product | null>(null);
  const [dirty, setDirty] = useState(false);
  const handleDirty = useCallback((value: boolean) => { setDirty(value); onDirty(value); }, [onDirty]);
  function select(product: Product | null) {
    if (dirty && !window.confirm("Discard unsaved inventory changes?")) return;
    setDirty(false);
    onDirty(false);
    setSelected(product);
  }
  return (
    <>
    {selected && <InventoryDialog key={selected.id} product={selected} canWrite={canWriteInventory} demo={controls.demo} onDirty={handleDirty} onClose={() => select(null)} />}
    <EntityListLayout
      {...controls}
      label="Inventory"
      tabs={[{ key: "all", label: "All inventory" }]}
    >
      <InventoryTable
        filteredProducts={products}
        demo={controls.demo}
        onManage={select}
      />
    </EntityListLayout>
    </>
  );
}
