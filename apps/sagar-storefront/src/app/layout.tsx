import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { Suspense } from "react"
import StorefrontAnalytics from "@modules/common/components/storefront-analytics"
import "styles/globals.css"
import "styles/sagar.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light">
      <head>
        <link rel="ucp" href="/.well-known/ucp" />
      </head>
      <body>
        <main className="relative">{props.children}</main>
        <Suspense fallback={null}><StorefrontAnalytics /></Suspense>
      </body>
    </html>
  )
}
