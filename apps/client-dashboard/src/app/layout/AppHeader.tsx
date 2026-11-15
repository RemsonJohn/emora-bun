import { ArrowRight, Bell, LogOut, Menu, Search } from "lucide-react";
import type { Page } from "../../routes/routes";

export function AppHeader({
  mobileNav,
  setMobileNav,
  setSearchOpen,
  notificationOpen,
  setNotificationOpen,
  pending,
  awaiting,
  navigate,
  userName,
  logout,
}: {
  mobileNav: boolean;
  setMobileNav: (value: boolean) => void;
  setSearchOpen: (value: boolean) => void;
  notificationOpen: boolean;
  setNotificationOpen: (value: boolean) => void;
  pending: number;
  awaiting: number;
  navigate: (page: Page) => boolean;
  userName: string;
  logout: () => void;
}) {
  return (
    <header className="topbar">
      <div className="brand">
        <button
          className="icon-button mobile-only"
          aria-label="Toggle navigation"
          onClick={() => setMobileNav(!mobileNav)}
        >
          <Menu size={20} />
        </button>
        <span className="brand-mark">
          e<span />
        </span>
        <span>
          emora<span className="brand-admin">admin</span>
        </span>
      </div>
      <button className="global-search" onClick={() => setSearchOpen(true)}>
        <Search size={17} />
        <span>Search your store</span>
        <kbd>Ctrl K</kbd>
      </button>
      <div className="top-actions">
        <div className="notification-wrap">
          <button
            className="icon-button"
            aria-label="Notifications"
            aria-expanded={notificationOpen}
            onClick={() => setNotificationOpen(!notificationOpen)}
          >
            <Bell size={19} />
            {pending > 0 && <i className="notification-dot" />}
          </button>
          {notificationOpen && (
            <div className="notification-popover">
              <h3>Your store at a glance</h3>
              <p>{pending} loaded orders awaiting fulfilment</p>
              <p>{awaiting} loaded payments pending</p>
              <button
                onClick={() => {
                  navigate("Orders");
                  setNotificationOpen(false);
                }}
              >
                View orders <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
        <span className="top-divider" />
        <span className="avatar">{userName.slice(0, 2).toUpperCase()}</span>
        <span className="top-user">{userName}</span>
        <button className="icon-button" aria-label="Sign out" onClick={logout}>
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
