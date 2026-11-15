import { AppHeader } from "./app/layout/AppHeader";
import { Sidebar } from "./app/layout/Sidebar";
import { initialPage } from "./routes/routes";
import type { Page } from "./routes/routes";
import { CustomerDetail } from "./routes/customers/CustomerDetail";
import { ListPage } from "./routes/shared/ListPage";
import { HomePage } from "./routes/home/HomePage";
import { AnalyticsPage } from "./routes/analytics/AnalyticsPage";
import { SettingsPage } from "./routes/settings/SettingsPage";
import { ContentPage } from "./routes/content/ContentPage";
import { DiscountsPage } from "./routes/discounts/DiscountsPage";
import { CollectionsPage } from "./routes/collections/CollectionsPage";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  ExternalLink,
  LoaderCircle,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";
import { Empty } from "./lib/ui/Empty";
import { PageHeading } from "./lib/ui/PageHeading";
import { ProductEditor } from "./routes/products/ProductEditor";
import { PanelDialog } from "./lib/ui/Dialog";
import { ProductTransferDialog } from "./routes/products/ProductTransferDialog";
import { OrderDetail } from "./routes/orders/OrderDetail";
import { Login } from "./routes/auth/Login";
import { SearchDialog } from "./routes/search/SearchDialog";
import {
  api,
  demoCustomers,
  demoOrders,
  demoProducts,
  errorMessage,
  sdk,
} from "./lib/medusa";
import type { Customer, Order, Product } from "./lib/medusa";
import { Billing } from "./routes/billing/Billing";
import { StaffDialog } from "./routes/settings/StaffDialog";
import "./App.css";

export default function App() {
  const [session, setSession] = useState<
    "checking" | "signed-out" | "live" | "demo"
  >("checking");
  const [page, setPage] = useState<Page>(initialPage);
  const [storeName, setStoreName] = useState("Your store");
  const [userName, setUserName] = useState("Merchant");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);
  const [productTransferOpen, setProductTransferOpen] = useState(false);
  const [accessPermissions, setAccessPermissions] = useState<string[] | null>(
    null,
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [counts, setCounts] = useState({
    Products: 0,
    Orders: 0,
    Customers: 0,
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [billingOrder, setBillingOrder] = useState<string | null>(() =>
    new URLSearchParams(location.search).get("order"),
  );
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [dirty, setDirty] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [offset, setOffset] = useState(0);
  const [period, setPeriod] = useState(7);
  const [now, setNow] = useState(() => Date.now());
  const [version, setVersion] = useState(0);
  const [listSearch, setListSearch] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const demo = session === "demo";
  const hasAccess = (permission: string) =>
    demo || (accessPermissions?.includes(permission) ?? false);
  const canOpen = (name: Page) => {
    if (demo) return true;
    if (accessPermissions === null) return false;
    const has = (permission: string) => accessPermissions.includes(permission);
    switch (name) {
      case "Home":
        return has("products.read") && has("orders.read");
      case "Orders":
        return has("orders.read");
      case "Billing":
        return has("billing.read");
      case "Products":
      case "Collections":
        return has("products.read");
      case "Inventory":
        return has("inventory.read");
      case "Customers":
        return has("customers.read");
      case "Discounts":
        return has("discounts.read");
      case "Content":
        return has("content.read");
      case "Analytics":
        return has("analytics.read");
      case "Settings":
        return has("settings.read") || has("staff.manage");
    }
  };
  const notify = (message: string) => {
    setToast(message);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 4500);
  };
  const navigate = (next: Page) => {
    if (!canOpen(next)) return false;
    if (dirty && !window.confirm("Discard your unsaved product changes?"))
      return false;
    setPage(next);
    setOffset(0);
    setQuery("");
    setListSearch("");
    setStatus("all");
    setSelectedProduct(null);
    setSelectedOrder(null);
    setBillingOrder(null);
    setSelectedCustomer(null);
    setDirty(false);
    setMobileNav(false);
    const url = new URL(location.href);
    url.searchParams.set("page", next);
    url.searchParams.delete("order");
    history.replaceState(null, "", url);
    return true;
  };
  useEffect(() => {
    let active = true;
    api<{ user: { first_name?: string; email: string } }>("/admin/users/me")
      .then(({ user }) => {
        if (active) {
          setUserName(user.first_name || user.email.split("@")[0]);
          setSession("live");
        }
      })
      .catch(() => {
        if (active) setSession("signed-out");
      });
    return () => {
      active = false;
      clearTimeout(timer.current);
    };
  }, []);
  useEffect(() => {
    if (session !== "live") return;
    let active = true;
    api<{ permissions: string[] }>("/admin/staff-access/me")
      .then((result) => {
        if (!active) return;
        if (!Array.isArray(result.permissions)) {
          setAccessPermissions([]);
          return;
        }
        setAccessPermissions(result.permissions);
        setPage((current) => {
          const has = (permission: string) =>
            result.permissions.includes(permission);
          if (
            current === "Home" &&
            !(has("products.read") && has("orders.read"))
          ) {
            if (has("orders.read")) return "Orders";
            if (has("products.read")) return "Products";
            if (has("customers.read")) return "Customers";
          }
          return current;
        });
      })
      .catch(() => {
        if (active) setAccessPermissions([]);
      });
    return () => {
      active = false;
    };
  }, [session]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setNotificationOpen(false);
      }
    };
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("keydown", handler);
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [dirty]);
  useEffect(() => {
    const timeout = setTimeout(() => {
      setQuery(listSearch);
      setOffset(0);
    }, 300);
    return () => clearTimeout(timeout);
  }, [listSearch]);
  useEffect(() => {
    if (session !== "live") return;
    api<{ stores: { name: string }[] }>("/admin/stores")
      .then((r) => setStoreName(r.stores[0]?.name || "Your store"))
      .catch(() => {});
  }, [session]);
  useEffect(() => {
    if (session !== "live" && !demo) return;
    let active = true;
    queueMicrotask(() => {
      if (active) {
        setBusy(true);
        setError("");
        setNow(Date.now());
      }
    });
    if (demo) {
      queueMicrotask(() => {
        if (!active) return;
        setProducts(demoProducts);
        setOrders(demoOrders);
        setCustomers(demoCustomers);
        setCounts({
          Products: demoProducts.length,
          Orders: demoOrders.length,
          Customers: demoCustomers.length,
        });
        setStoreName("Emora Studio");
        setUserName("Remy");
        setBusy(false);
      });
      return () => {
        active = false;
      };
    }
    const params = {
      limit: ["Home", "Analytics"].includes(page) ? 100 : 25,
      offset,
      ...(query ? { q: query } : {}),
    };
    const tasks: Promise<unknown>[] = [];
    if (["Home", "Analytics", "Products", "Inventory"].includes(page))
      tasks.push(
        api<{ products: Product[]; count: number }>("/admin/products", {
          ...params,
          ...(status !== "all" && page === "Products"
            ? { status: [status] }
            : {}),
        }).then((r) => {
          if (active) {
            setProducts(r.products);
            setCounts((c) => ({ ...c, Products: r.count }));
          }
        }),
      );
    if (["Home", "Analytics", "Orders"].includes(page))
      tasks.push(
        api<{ orders: Order[]; count: number }>("/admin/orders", {
          ...params,
          order: "-created_at",
          fields:
            "+email,+currency_code,+total,+payment_status,+fulfillment_status",
        }).then((r) => {
          if (active) {
            setOrders(r.orders);
            setCounts((c) => ({ ...c, Orders: r.count }));
          }
        }),
      );
    if (page === "Customers")
      tasks.push(
        api<{ customers: Customer[]; count: number }>(
          "/admin/customers",
          params,
        ).then((r) => {
          if (active) {
            setCustomers(r.customers);
            setCounts((c) => ({ ...c, Customers: r.count }));
          }
        }),
      );
    Promise.allSettled(tasks).then((results) => {
      if (!active) return;
      const failure = results.find((r) => r.status === "rejected");
      if (failure?.status === "rejected") {
        setError(errorMessage(failure.reason));
        if (failure.reason?.status === 401) {
          void sdk.auth.logout().catch(() => {});
          setSession("signed-out");
          setProducts([]);
          setOrders([]);
          setCustomers([]);
          setCounts({ Products: 0, Orders: 0, Customers: 0 });
          setSelectedProduct(null);
          setSelectedOrder(null);
          setSelectedCustomer(null);
          setDirty(false);
        }
      }
      setBusy(false);
    });
    return () => {
      active = false;
    };
  }, [session, demo, page, query, offset, status, version]);
  const logout = async () => {
    if (dirty && !confirm("Discard unsaved changes and sign out?")) return;
    await sdk.auth.logout().catch(() => {});
    setSession("signed-out");
    setAccessPermissions(null);
    setDirty(false);
    setProducts([]);
    setOrders([]);
    setCustomers([]);
    setCounts({ Products: 0, Orders: 0, Customers: 0 });
    setStoreName("Your store");
    setSearchOpen(false);
    setNotificationOpen(false);
    setError("");
    setListSearch("");
    setQuery("");
    setStatus("all");
    setOffset(0);
    setPage("Home");
    setSelectedProduct(null);
    setSelectedOrder(null);
    setSelectedCustomer(null);
  };
  const backendUrl =
    import.meta.env.VITE_MEDUSA_BACKEND_URL || "http://localhost:9000";
  const nativeAdmin = (path = "") => `${backendUrl}/app${path}`;
  const storefrontUrl =
    import.meta.env.VITE_STOREFRONT_URL || "http://localhost:8000";
  if (session === "checking")
    return (
      <div className="session-loading">
        <LoaderCircle className="spin" />
        <span>Opening your workspace…</span>
      </div>
    );
  if (session === "signed-out")
    return (
      <Login
        onLogin={(name) => {
          setUserName(name);
          setSession("live");
        }}
        onDemo={() => setSession("demo")}
      />
    );
  const filteredOrders = orders.filter(
    (o) =>
      (!demo ||
        !query ||
        `${o.display_id} ${o.email}`
          .toLowerCase()
          .includes(query.toLowerCase())) &&
      (status === "all" ||
        o.payment_status === status ||
        o.fulfillment_status === status),
  );
  const filteredProducts = demo
    ? products.filter(
        (p) =>
          (!query || p.title.toLowerCase().includes(query.toLowerCase())) &&
          (status === "all" || p.status === status),
      )
    : products;
  const filteredCustomers = demo
    ? customers.filter((c) =>
        `${c.first_name} ${c.last_name} ${c.email}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
    : customers;
  const istToday = new Date(now + 330 * 60000).toISOString().slice(0, 10);
  const periodStart =
    new Date(`${istToday}T00:00:00+05:30`).getTime() - (period - 1) * 86400000;
  const activeOrders = orders.filter(
    (o) => new Date(o.created_at).getTime() >= periodStart,
  );
  const paidOrders = activeOrders.filter(
    (o) => o.payment_status === "captured" && o.currency_code === "inr",
  );
  const sales = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const pending = orders.filter(
    (o) => o.fulfillment_status === "not_fulfilled" && o.status !== "canceled",
  ).length;
  const awaiting = orders.filter((o) =>
    ["awaiting", "not_paid"].includes(o.payment_status),
  ).length;
  const totalCount =
    (counts as Record<string, number>)[page] ?? counts.Products;
  const overviewProps = {
    period,
    setPeriod,
    orders,
    counts,
    sales,
    activeOrders,
    paidOrders,
    products,
    busy,
    now,
    navigate,
    setStatus,
    pending,
    awaiting,
    setSelectedOrder,
    storefrontUrl,
    demo,
  };
  return (
    <div className="app-shell">
      <AppHeader
        mobileNav={mobileNav}
        setMobileNav={setMobileNav}
        setSearchOpen={setSearchOpen}
        notificationOpen={notificationOpen}
        setNotificationOpen={setNotificationOpen}
        pending={pending}
        awaiting={awaiting}
        navigate={navigate}
        userName={userName}
        logout={logout}
      />
      <Sidebar
        mobileNav={mobileNav}
        setMobileNav={setMobileNav}
        storeName={storeName}
        demo={demo}
        canOpen={canOpen}
        page={page}
        navigate={navigate}
        pending={pending}
        storefrontUrl={storefrontUrl}
      />
      <main className="main-content">
        {demo && (
          <div className="demo-banner">
            <span>Preview mode · Sample data, changes are not saved.</span>
            <button onClick={logout}>
              Connect your store <ArrowRight size={14} />
            </button>
          </div>
        )}
        {error && (
          <div className="error-banner" role="alert">
            <span>{error}</span>
            <button onClick={() => setVersion((v) => v + 1)}>
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        )}
        {session === "live" && accessPermissions === null ? (
          <section className="panel">
            <Empty title="Checking your access">
              Loading your staff permissions.
            </Empty>
          </section>
        ) : !canOpen(page) ? (
          <section className="panel">
            <Empty title="You don’t have access to this page">
              Ask a store administrator to update your permissions.
            </Empty>
          </section>
        ) : selectedProduct && selectedProduct.id !== "new" ? (
          <ProductEditor
            key={selectedProduct.id}
            product={selectedProduct}
            demo={demo}
            canWrite={hasAccess("products.write")}
            canReadInventory={hasAccess("inventory.read")}
            canWriteInventory={hasAccess("inventory.write")}
            onDirty={setDirty}
            onBack={() => {
              if (!dirty || confirm("Discard unsaved changes?")) {
                setSelectedProduct(null);
                setDirty(false);
              }
            }}
            onSaved={() => {
              setVersion((v) => v + 1);
              notify(
                demo ? "Preview only — product was not saved" : "Product saved",
              );
            }}
          />
        ) : selectedOrder ? (
          <OrderDetail
            key={selectedOrder.id}
            order={selectedOrder}
            demo={demo}
            nativeAdmin={nativeAdmin}
            onBack={() => setSelectedOrder(null)}
            canReview={hasAccess("orders.approve")}
            canComplete={hasAccess("orders.complete")}
            canManage={
              hasAccess("orders.fulfill") || hasAccess("orders.refund")
            }
            canBilling={hasAccess("billing.read")}
            onBilling={() => {
              const id = selectedOrder.id;
              setSelectedOrder(null);
              setPage("Billing");
              setBillingOrder(id);
              const url = new URL(location.href);
              url.searchParams.set("page", "Billing");
              url.searchParams.set("order", id);
              history.replaceState(null, "", url);
            }}
          />
        ) : selectedCustomer ? (
          <CustomerDetail
            customer={selectedCustomer}
            demo={demo}
            nativeAdmin={nativeAdmin}
            onBack={() => setSelectedCustomer(null)}
          />
        ) : (
          <>
            {page !== "Billing" && (
              <PageHeading
                title={
                  page === "Home"
                    ? `Good ${new Date(now).getHours() < 12 ? "morning" : new Date(now).getHours() < 17 ? "afternoon" : "evening"}, ${userName}`
                    : page
                }
                description={
                  page === "Home"
                    ? "Here’s how your store is doing. Let’s make today a good one."
                    : (
                        {
                          Products: "Everything you sell, all in one place.",
                          Orders:
                            "A little organisation. A lot of happy customers.",
                          Billing:
                            "Customer payments and order billing, in one place.",
                          Customers:
                            "Get to know the people behind every order.",
                          Collections: "Bring your products together.",
                          Inventory: "Keep an eye on every variant.",
                          Discounts:
                            "Give customers another reason to come back.",
                          Content: "Make your storefront feel like you.",
                          Analytics:
                            "A closer look at your store’s performance.",
                          Settings: "The details that keep your store running.",
                        } as Record<string, string>
                      )[page]
                }
                actions={
                  <>
                    {["Home", "Analytics"].includes(page) ? (
                      <>
                        <button
                          className="button"
                          onClick={() => setVersion((v) => v + 1)}
                          aria-label="Refresh data"
                        >
                          <RefreshCw size={15} className={busy ? "spin" : ""} />
                        </button>
                        <a
                          className="button"
                          href={storefrontUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View store <ExternalLink size={14} />
                        </a>
                      </>
                    ) : page === "Products" ? (
                      <>
                        <button className="button" disabled={demo} onClick={() => setProductTransferOpen(true)}>
                          Import / export
                        </button>
                        {hasAccess("products.write") && (
                          <button
                            className="button primary"
                            onClick={() => {
                              setSelectedProduct({
                                id: "new",
                                title: "",
                                handle: "",
                                status: "draft",
                              });
                              setDirty(false);
                            }}
                          >
                            <Plus size={16} />
                            Add product
                          </button>
                        )}
                      </>
                    ) : null}
                  </>
                }
              />
            )}
            {page === "Billing" && (
              <Billing
                demo={demo}
                storeName={storeName}
                orderId={billingOrder}
                onOrderChange={(id) => {
                  setBillingOrder(id);
                  const url = new URL(location.href);
                  if (id) url.searchParams.set("order", id);
                  else url.searchParams.delete("order");
                  history.replaceState(null, "", url);
                }}
              />
            )}
            {page === "Home" && <HomePage {...overviewProps} />}
            {page === "Analytics" && <AnalyticsPage {...overviewProps} />}
            {["Products", "Orders", "Customers", "Inventory"].includes(
              page,
            ) && (
              <ListPage
                page={page}
                status={status}
                setStatus={setStatus}
                setOffset={setOffset}
                listSearch={listSearch}
                setListSearch={setListSearch}
                busy={busy}
                filteredProducts={filteredProducts}
                setSelectedProduct={setSelectedProduct}
                filteredOrders={filteredOrders}
                setSelectedOrder={setSelectedOrder}
                filteredCustomers={filteredCustomers}
                setSelectedCustomer={setSelectedCustomer}
                demo={demo}
                canWriteInventory={hasAccess("inventory.write")}
                onDirty={setDirty}
                totalCount={totalCount}
                offset={offset}
              />
            )}
            {page === "Collections" && (
              <CollectionsPage
                demo={demo}
                canWrite={hasAccess("products.write")}
              />
            )}
            {page === "Discounts" && (
              <DiscountsPage
                demo={demo}
                canWrite={hasAccess("discounts.write")}
              />
            )}
            {page === "Content" && <ContentPage />}
            {page === "Settings" && (
              <SettingsPage
                storeName={storeName}
                demo={demo}
                nativeAdmin={nativeAdmin}
                setStaffOpen={setStaffOpen}
              />
            )}
          </>
        )}
        <footer className="workspace-footer">
          <span className="footer-mark">e</span>A little less admin. A little
          more business.
        </footer>
      </main>
      {selectedProduct?.id === "new" && <PanelDialog className="product-create-dialog" title="Add product" description="Create a draft and add its details." onClose={() => { if (!dirty || confirm("Discard unsaved changes?")) { setSelectedProduct(null); setDirty(false); } }}>
        <ProductEditor product={selectedProduct} inDialog demo={demo} canWrite={hasAccess("products.write")} canReadInventory={hasAccess("inventory.read")} canWriteInventory={hasAccess("inventory.write")} onDirty={setDirty} onBack={() => {}} onSaved={() => { setVersion(v => v + 1); notify(demo ? "Preview only — product was not saved" : "Product saved"); }} />
      </PanelDialog>}
      {productTransferOpen && <ProductTransferDialog canImport={hasAccess("products.write") && hasAccess("inventory.write")} onClose={() => setProductTransferOpen(false)} onImported={() => setVersion(v => v + 1)} />}
      {staffOpen && (
        <StaffDialog demo={demo} onClose={() => setStaffOpen(false)} />
      )}
      {searchOpen && (
        <SearchDialog
          demo={demo}
          onClose={() => setSearchOpen(false)}
          onProduct={(p) => {
            if (!navigate("Products")) return;
            setSelectedProduct(p);
            setSearchOpen(false);
          }}
          onOrder={(o) => {
            if (!navigate("Orders")) return;
            setSelectedOrder(o);
            setSearchOpen(false);
          }}
          onCustomer={(c) => {
            if (!navigate("Customers")) return;
            setSelectedCustomer(c);
            setSearchOpen(false);
          }}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
