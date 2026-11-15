import {
  ArrowUpRight,
  CircleHelp,
  ExternalLink,
  Settings,
  ShoppingBag,
} from "lucide-react";
import { nav } from "../../routes/routes";
import type { Page } from "../../routes/routes";

export function Sidebar({
  mobileNav,
  setMobileNav,
  storeName,
  demo,
  canOpen,
  page,
  navigate,
  pending,
  storefrontUrl,
}: {
  mobileNav: boolean;
  setMobileNav: (value: boolean) => void;
  storeName: string;
  demo: boolean;
  canOpen: (page: Page) => boolean;
  page: Page;
  navigate: (page: Page) => boolean;
  pending: number;
  storefrontUrl: string;
}) {
  return (
    <>
      {mobileNav && (
        <button
          className="nav-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileNav(false)}
        />
      )}
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <div className="store-identity">
          <span className="store-icon">
            <ShoppingBag size={20} />
          </span>
          <div>
            <strong>{storeName}</strong>
            <span>
              <i />
              {demo ? "Demo workspace" : "Store workspace"}
            </span>
          </div>
        </div>
        <nav aria-label="Main navigation">
          {nav
            .filter(({ name }) => canOpen(name))
            .map(({ name, icon: Icon }) => (
              <div key={name}>
                <button
                  aria-label={name}
                  className={`nav-link ${page === name || (name === "Products" && ["Inventory", "Collections"].includes(page)) ? "active" : ""}`}
                  onClick={() => navigate(name)}
                >
                  <Icon size={18} />
                  <span>{name}</span>
                  {name === "Orders" && pending > 0 && (
                    <span className="nav-count">{pending}</span>
                  )}
                </button>
                {name === "Products" &&
                  ["Products", "Inventory", "Collections"].includes(page) && (
                    <div className="subnav">
                      {["Collections", "Inventory"]
                        .filter((item) => canOpen(item as Page))
                        .map((item) => (
                          <button
                            key={item}
                            className={page === item ? "selected" : ""}
                            onClick={() => navigate(item as Page)}
                          >
                            {item}
                          </button>
                        ))}
                    </div>
                  )}
              </div>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <a
            className="storefront-link"
            href={storefrontUrl}
            target="_blank"
            rel="noreferrer"
          >
            <span className="storefront-symbol">
              <ExternalLink size={17} />
            </span>
            <span>
              View your store<small>Opens in a new tab</small>
            </span>
            <ArrowUpRight size={16} />
          </a>
          {canOpen("Settings") && (
            <button
              className={`nav-link ${page === "Settings" ? "active" : ""}`}
              onClick={() => navigate("Settings")}
            >
              <Settings size={18} />
              Settings
            </button>
          )}
          <a
            className="nav-link"
            href="https://docs.medusajs.com/user-guide"
            target="_blank"
            rel="noreferrer"
          >
            <CircleHelp size={18} />
            Help & resources
            <ArrowUpRight size={14} />
          </a>
          <div className="powered">Made for your everyday.</div>
        </div>
      </aside>
    </>
  );
}
