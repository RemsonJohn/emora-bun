import type { Customer, Order, Product } from "../../lib/medusa";
import type { EntityListControls } from "../../lib/ui/EntityListLayout";
import { ProductsPage } from "../products/ProductsPage";
import { OrdersPage } from "../orders/OrdersPage";
import { CustomersPage } from "../customers/CustomersPage";
import { InventoryPage } from "../inventory/InventoryPage";

export function ListPage({
  page,
  filteredProducts,
  setSelectedProduct,
  filteredOrders,
  setSelectedOrder,
  filteredCustomers,
  setSelectedCustomer,
  canWriteInventory,
  onDirty,
  ...controls
}: EntityListControls & {
  page: string;
  filteredProducts: Product[];
  setSelectedProduct: (value: Product) => void;
  filteredOrders: Order[];
  setSelectedOrder: (value: Order) => void;
  filteredCustomers: Customer[];
  setSelectedCustomer: (value: Customer) => void;
  canWriteInventory: boolean;
  onDirty: (dirty: boolean) => void;
}) {
  if (page === "Products")
    return (
      <ProductsPage
        {...controls}
        products={filteredProducts}
        onSelect={setSelectedProduct}
      />
    );
  if (page === "Orders")
    return (
      <OrdersPage
        {...controls}
        orders={filteredOrders}
        onSelect={setSelectedOrder}
      />
    );
  if (page === "Customers")
    return (
      <CustomersPage
        {...controls}
        customers={filteredCustomers}
        onSelect={setSelectedCustomer}
      />
    );
  return (
    <InventoryPage
      {...controls}
      products={filteredProducts}
      canWriteInventory={canWriteInventory}
      onDirty={onDirty}
    />
  );
}
