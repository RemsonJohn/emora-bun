import { Suspense } from "react"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listRegions } from "@lib/data/regions"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import Search from "@modules/layout/components/search"
import SideMenu from "@modules/layout/components/side-menu"

export default async function Nav() {
  const [regions, locales, currentLocale] = await Promise.all([listRegions(), listLocales(), getLocale()])
  return <div className="sagar-header-wrap"><div className="sagar-announcement">TEAMWEAR FOR EVERY GAME <span>✳</span> MADE TO MOVE TOGETHER</div><header className="sagar-header"><div className="sagar-header-inner"><div className="sagar-mobile-menu"><SideMenu regions={regions} locales={locales} currentLocale={currentLocale} /></div><LocalizedClientLink href="/" className="sagar-logo" data-testid="nav-store-link"><span className="sagar-logo-symbol">S<span>.</span></span><span>SAGAR<small>SPORTS</small></span></LocalizedClientLink><nav className="sagar-nav" aria-label="Main navigation"><LocalizedClientLink href="/store">Shop all</LocalizedClientLink><LocalizedClientLink href="/store">Teamwear</LocalizedClientLink><LocalizedClientLink href="/contact">Contact</LocalizedClientLink></nav><div className="sagar-header-actions"><Search /><LocalizedClientLink href="/account" className="sagar-account" data-testid="nav-account-link">Account</LocalizedClientLink><Suspense fallback={<LocalizedClientLink href="/cart" data-testid="nav-cart-link">Cart (0)</LocalizedClientLink>}><CartButton /></Suspense></div></div></header></div>
}
