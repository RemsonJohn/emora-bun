import type { Metadata } from "next"
import Image from "next/image"
import { getRegion } from "@lib/data/regions"
import { listProducts } from "@lib/data/products"
import { listCollections } from "@lib/data/collections"
import { getProductPrice } from "@lib/util/get-product-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const dynamic = "force-dynamic"
export const metadata: Metadata = {
  title: "Sagar Sports | Teamwear for the game",
  description: "Explore Sagar Sports teamwear and jerseys for your next game.",
}

export default async function Home({ params }: { params: Promise<{ countryCode: string }> }) {
  const { countryCode } = await params
  let unavailable = false
  let products: Awaited<ReturnType<typeof listProducts>>["response"]["products"] = []
  let collections: Awaited<ReturnType<typeof listCollections>>["collections"] = []
  try {
    const region = await getRegion(countryCode)
    if (region) {
      const [catalogue, groups] = await Promise.all([
        listProducts({ regionId: region.id, queryParams: { limit: 4 } }),
        listCollections({ fields: "id,handle,title" }),
      ])
      products = catalogue.response.products
      collections = groups.collections || []
    } else unavailable = true
  } catch { unavailable = true }
  const contact = process.env.NEXT_PUBLIC_STORE_CONTACT_EMAIL
  const validContact = contact && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)

  return <div className="sagar-home">
    <section className="sagar-hero" aria-labelledby="hero-title">
      <Image className="sagar-hero-image" src="/sagar-team-campaign.webp" alt="Players in team jerseys on a football pitch at dusk" fill priority sizes="100vw" />
      <div className="sagar-hero-shade" />
      <div className="sagar-hero-copy"><span className="sagar-pill"><span /> MADE FOR THE TEAM</span><h1 id="hero-title">YOUR TEAM.<br /><em>YOUR GAME.</em></h1><p>From the first whistle to the final play. Find the kit that brings your team together.</p><div className="sagar-hero-buttons"><LocalizedClientLink className="sagar-button sagar-button-lime" href="/store">Explore the collection <span aria-hidden="true">↗</span></LocalizedClientLink>{validContact && <a className="sagar-button sagar-button-outline" href={`mailto:${contact}?subject=${encodeURIComponent("Custom teamwear enquiry")}`}>Custom team enquiry <span aria-hidden="true">↗</span></a>}</div></div>
      <div className="sagar-hero-bottom"><span>BUILT FOR THE MOMENTS THAT MATTER</span><span>SCROLL TO EXPLORE ↓</span></div>
    </section>
    <div className="sagar-ticker" aria-hidden="true"><span>THE GAME IS BETTER TOGETHER</span><b>✳</b><span>SHOW UP AS ONE</span><b>✳</b><span>MADE FOR YOUR MOMENT</span><b>✳</b><span>THE GAME IS BETTER TOGETHER</span></div>
    <section className="sagar-section sagar-collection" id="shop"><div className="sagar-section-top"><div><p className="sagar-overline">THE COLLECTION</p><h2>READY FOR<br /><em>ANYTHING.</em></h2></div><div><p>Find your next favourite piece of kit. Explore the latest from our store.</p><LocalizedClientLink href="/store" className="sagar-text-link">Shop all products <span aria-hidden="true">↗</span></LocalizedClientLink></div></div>
      {unavailable ? <div className="sagar-empty"><strong>Our collection is taking a breather.</strong><p>We couldn’t load the catalogue right now. Please try again shortly.</p><LocalizedClientLink href="/store" className="sagar-text-link">Try the store ↗</LocalizedClientLink></div> : products.length ? <div className="sagar-products">{products.map((product, index) => { const { cheapestPrice } = getProductPrice({ product }); return <LocalizedClientLink href={`/products/${product.handle}`} className="sagar-product" key={product.id}><div className="sagar-product-image">{product.thumbnail ? <Image src={product.thumbnail} alt={product.title} fill sizes="(max-width: 640px) 50vw, 25vw" /> : <span className="sagar-image-placeholder">SAGAR<br />SPORTS</span>}<span className="sagar-product-number">{String(index + 1).padStart(2,"0")}</span><span className="sagar-product-arrow" aria-hidden="true">↗</span></div><div className="sagar-product-info"><div><h3>{product.title}</h3><p>{product.collection?.title || "Store collection"}</p></div><span>{cheapestPrice?.calculated_price || "View details"}</span></div></LocalizedClientLink> })}</div> : <div className="sagar-empty"><strong>New kit is on its way.</strong><p>There are no products available in this region yet.</p></div>}
    </section>
    {collections.length > 0 && <section className="sagar-section sagar-categories"><div className="sagar-category-heading"><div><p className="sagar-overline">FIND YOUR FIT</p><h2>SHOP BY<br /><em>COLLECTION.</em></h2></div><LocalizedClientLink className="sagar-text-link" href="/store">Explore everything ↗</LocalizedClientLink></div><div className="sagar-category-grid">{collections.slice(0, 3).map((collection,index) => <LocalizedClientLink href={`/collections/${collection.handle}`} className="sagar-category" key={collection.id}><span className="sagar-category-index">{String(index + 1).padStart(2,"0")} / COLLECTION</span><strong>{collection.title}</strong><span className="sagar-category-link">EXPLORE COLLECTION <span>↗</span></span></LocalizedClientLink>)}</div></section>}
    <section className="sagar-team"><div className="sagar-team-content"><p className="sagar-overline">BETTER TOGETHER</p><h2>ONE TEAM.<br /><em>ONE IDENTITY.</em></h2><p>Every team has its own story. Find your colours, bring your people together, and make the next game yours.</p>{validContact ? <a href={`mailto:${contact}?subject=${encodeURIComponent("Custom teamwear enquiry")}`} className="sagar-button sagar-button-dark">Talk teamwear <span>↗</span></a> : <LocalizedClientLink href="/store" className="sagar-button sagar-button-dark">Explore teamwear <span>↗</span></LocalizedClientLink>}</div><div className="sagar-team-art" aria-hidden="true"><span>PLAY<br />AS<br />ONE<span className="sagar-team-dot">.</span></span><small>SAGAR SPORTS / TEAMWEAR</small></div></section>
  </div>
}
