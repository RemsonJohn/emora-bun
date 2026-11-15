# Emora Admin

Shopify-inspired merchant dashboard connected to the existing Medusa + Bun backend.

## Run locally

Keep PostgreSQL, Redis, and the Bun Medusa backend running on port 9000. From this folder:

```powershell
bun install
bun run dev
```

Open http://localhost:5174. Sign in with the admin account already created in **medusa_bun**. The native admin at http://localhost:9000/app remains available. There is also an explicitly labelled demo mode requiring no backend.

Backend development CORS now permits localhost:5174; restart the backend if it has not picked up the config change. Do not run medusa-node and medusa-bun on port 9000 simultaneously.

Optional build-time environment values are documented in `.env.example`. The local proxy works without an environment file. Never put merchant secrets in VITE_ variables.

## Included

- Login, authenticated API calls, sign out, and per-tab token persistence.
- Home: captured sales, orders, AOV, products, daily chart and recent orders.
- Products: search, status filters, pagination, draft creation and basic editing with sticky Save/Discard and navigation protection.
- Orders and customers: search, pagination and details.
- Billing: search customer orders, review payment status and print an order summary. No GST tax invoice or invoice record is generated.
- Storefront analytics: consent-based page-category tracking, including checkout steps, and a report of the last category seen in inactive sessions. It requires Redis and a configured storefront publishable key; restart the backend and storefront after updating. Visitors can change their consent using Analytics choices.
- Collections, promotions, variant/SKU inventory view, and advanced-settings links.
- Global search, responsive navigation, loading/empty/error states, INR and IST formatting.

## Current limits

This is the first working dashboard, not the entire supplied MVP. Metrics cover the latest 100 orders and state that scope. Order status tabs filter the current page. Collections/promotions load up to 100 records. Media/variants/pricing, stock adjustments, fulfilment/refunds, staff settings and advanced operations currently open native Medusa Admin (a separate login may be needed). R2, Razorpay onboarding, GST invoices, custom content, feature-flag enforcement, 2FA, and detailed audit/permission workflows remain to be implemented and tested. No secrets or fabricated live statistics are bundled.

Storefront analytics are separate from the order metrics. They record only a random tab session ID, a coarse page/checkout-step category and last-seen time, with a 31-day Redis expiry. The report includes sessions inactive for 30 minutes and at most 5,000 most recent matches; it labels truncation. Counts are last observed categories, not verified abandonment, conversion or payment. Consent is opt-in and can be revoked; revocation stops future collection but does not delete previously recorded anonymous events. Redis must be persistent if data should survive restarts. Per-store keys are isolated using a hash of `ANALYTICS_NAMESPACE` or `DATABASE_URL`; set a stable, distinct `ANALYTICS_NAMESPACE` for each store before production so database credential changes don't reset the report.

## Verify

```powershell
bun run build
bun run lint
bun run test
```

The Playwright suite mocks Medusa responses and performs no real database writes. It uses installed Microsoft Edge by default; change `channel` in playwright.config.ts if needed. It covers authenticated reads, editing payloads, unsaved-change protection, API failures, login errors, labelled demo mode and mobile navigation.

## Deploy

Build with `bun run build` and serve `dist/` on the same VPS as the backend. Set an SPA fallback to index.html. Reverse proxy `/admin`, `/auth`, `/static`, `/uploads` to the backend, or set `VITE_MEDUSA_BACKEND_URL` before building and add the exact frontend domain to Medusa `ADMIN_CORS` and `AUTH_CORS`. The Vite development proxy is not included in the static build. Forward Authorization and disable caching for authenticated APIs. Production needs HTTPS.

See PRODUCT.md for target scope and remaining launch requirements, PLATFORM-DECISIONS.md for architecture, and DESIGN.md for the visual system.
