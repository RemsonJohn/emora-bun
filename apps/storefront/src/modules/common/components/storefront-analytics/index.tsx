"use client"

import { useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"

const preferenceKey = "emora-analytics-consent"
const sessionKey = "emora-analytics-session"
const lastSeenKey = "emora-analytics-last-seen"

function pageStage(path: string, step: string | null) {
  if (/\/order\/[^/]+\/confirmed\/?$/.test(path)) return "confirmation"
  if (/\/checkout(?:\/|$)/.test(path)) return step && ["address", "delivery", "payment", "review"].includes(step) ? `checkout_${step}` : "checkout"
  if (/\/cart(?:\/|$)/.test(path)) return "cart"
  if (/\/products\/[^/]+(?:\/|$)/.test(path)) return "product"
  return "storefront"
}

export default function StorefrontAnalytics() {
  const pathname = usePathname()
  const step = useSearchParams().get("step")
  const [consent, setConsent] = useState<string | null>(null)
  const [showChoices, setShowChoices] = useState(false)

  useEffect(() => {
    let active = true
    queueMicrotask(() => {
      if (!active) return
      try {
        const saved = localStorage.getItem(preferenceKey)
        setConsent(saved || "unset")
        setShowChoices(!saved)
      } catch { setConsent("unavailable") }
    })
    return () => { active = false }
  }, [])
  useEffect(() => {
    if (consent !== "yes" || !pathname) return
    try {
      let session = sessionStorage.getItem(sessionKey)
      const lastSeen = Number(sessionStorage.getItem(lastSeenKey) || 0)
      if (!session || Date.now() - lastSeen > 30 * 60000) { session = crypto.randomUUID(); sessionStorage.setItem(sessionKey, session) }
      sessionStorage.setItem(lastSeenKey, String(Date.now()))
      const base = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
      const key = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
      if (!key) return
      void fetch(`${base}/store/storefront-analytics`, {
        method: "POST", headers: { "content-type": "application/json", "x-publishable-api-key": key },
        body: JSON.stringify({ session_id: session, stage: pageStage(pathname, step) }), keepalive: true,
      }).catch(() => {})
    } catch { /* Storage or secure randomness may be unavailable. */ }
  }, [pathname, step, consent])
  const choose = (value: "yes" | "no") => {
    try {
      localStorage.setItem(preferenceKey, value)
      if (value === "no") { sessionStorage.removeItem(sessionKey); sessionStorage.removeItem(lastSeenKey) }
      setConsent(value); setShowChoices(false)
    } catch { setConsent("unavailable"); setShowChoices(false) }
  }
  if (consent === null || consent === "unavailable") return null
  return <>
    {showChoices ? <section role="dialog" aria-label="Analytics preferences" style={{ position: "fixed", zIndex: 100, bottom: 16, left: 16, right: 16, maxWidth: 520, padding: 20, background: "#fff", border: "1px solid #d8dfd4", borderRadius: 10, boxShadow: "0 8px 24px #1d2b1d24", color: "#26352a", fontSize: 14 }}>
      <strong>Help improve your shopping experience</strong><p style={{ margin: "8px 0 14px", lineHeight: 1.5 }}>With your permission, we count anonymous browsing sessions to understand which shopping steps need improvement. We don’t record names, search terms, or page addresses.</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button type="button" onClick={() => choose("yes")} style={{ background: "#263e2b", color: "white", borderRadius: 6, padding: "9px 14px" }}>Allow analytics</button><button type="button" onClick={() => choose("no")} style={{ background: "#f0f2ed", borderRadius: 6, padding: "9px 14px" }}>Decline</button></div>
    </section> : <button type="button" onClick={() => setShowChoices(true)} style={{ position: "fixed", zIndex: 40, bottom: 8, left: 8, background: "#fff", color: "#344b36", border: "1px solid #d8dfd4", borderRadius: 5, padding: "5px 8px", fontSize: 11 }}>Analytics choices</button>}
  </>
}
