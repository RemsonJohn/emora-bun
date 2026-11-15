import { useEffect, useState } from "react";
import {
  ArrowRight,
  LoaderCircle,
  Search,
  ShoppingBag,
  Tag,
  Users,
  X,
} from "lucide-react";
import {
  api,
  demoCustomers,
  demoOrders,
  demoProducts,
  errorMessage,
} from "../../lib/medusa";
import type { Customer, Order, Product } from "../../lib/medusa";
import { Dialog } from "../../lib/ui/Dialog";

export function SearchDialog({
  demo,
  onClose,
  onProduct,
  onOrder,
  onCustomer,
}: {
  demo: boolean;
  onClose: () => void;
  onProduct: (p: Product) => void;
  onOrder: (o: Order) => void;
  onCustomer: (c: Customer) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    products: Product[];
    orders: Order[];
    customers: Customer[];
  }>({ products: [], orders: [], customers: [] });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) {
        setResults({ products: [], orders: [], customers: [] });
        setError("");
      }
    });
    if (query.trim().length < 2) {
      queueMicrotask(() => {
        if (active) setBusy(false);
      });
      return () => {
        active = false;
      };
    }
    queueMicrotask(() => {
      if (active) setBusy(true);
    });
    const timer = setTimeout(async () => {
      try {
        const [p, o, c] = demo
          ? [
              {
                products: demoProducts.filter((p) =>
                  p.title.toLowerCase().includes(query.toLowerCase()),
                ),
              },
              {
                orders: demoOrders.filter((o) =>
                  `${o.display_id} ${o.email}`.includes(query),
                ),
              },
              {
                customers: demoCustomers.filter((c) => c.email.includes(query)),
              },
            ]
          : await Promise.all([
              api<{ products: Product[] }>("/admin/products", {
                q: query,
                limit: 5,
              }),
              api<{ orders: Order[] }>("/admin/orders", {
                q: query,
                limit: 5,
                fields:
                  "+email,+currency_code,+total,+payment_status,+fulfillment_status",
              }),
              api<{ customers: Customer[] }>("/admin/customers", {
                q: query,
                limit: 5,
              }),
            ]);
        if (active)
          setResults({
            products: p.products,
            orders: o.orders,
            customers: c.customers,
          });
      } catch (e) {
        if (active) setError(errorMessage(e));
      } finally {
        if (active) setBusy(false);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, demo]);
  return (
    <Dialog
      className="search-dialog"
      label="Search your store"
      onClose={onClose}
      closeOnBackdrop
    >
      <div className="search-dialog-input">
        <Search size={20} />
        <input
          autoFocus
          aria-label="Search products, orders and customers"
          placeholder="Search products, orders, customers…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close search"
        >
          <X size={18} />
        </button>
      </div>
      <div className="search-results">
        {busy ? (
          <p>
            <LoaderCircle size={16} className="spin" />
            Searching your store…
          </p>
        ) : error ? (
          <p role="alert">{error}</p>
        ) : query.length < 2 ? (
          <p>Type at least two characters to search your store.</p>
        ) : (
          <>
            {results.products.length > 0 && <h3>Products</h3>}
            {results.products.map((p) => (
              <button key={p.id} onClick={() => onProduct(p)}>
                <Tag size={16} />
                {p.title}
                <ArrowRight size={14} />
              </button>
            ))}
            {results.orders.length > 0 && <h3>Orders</h3>}
            {results.orders.map((o) => (
              <button key={o.id} onClick={() => onOrder(o)}>
                <ShoppingBag size={16} />#{o.display_id} · {o.email}
                <ArrowRight size={14} />
              </button>
            ))}
            {results.customers.length > 0 && <h3>Customers</h3>}
            {results.customers.map((c) => (
              <button key={c.id} onClick={() => onCustomer(c)}>
                <Users size={16} />
                {c.email}
                <ArrowRight size={14} />
              </button>
            ))}
            {!results.products.length &&
              !results.orders.length &&
              !results.customers.length && (
                <p>No matches. Try a product name, order number or email.</p>
              )}
          </>
        )}
      </div>
      <div className="search-hint">
        Search your store
        <span>
          <kbd>Esc</kbd> to close
        </span>
      </div>
    </Dialog>
  );
}
