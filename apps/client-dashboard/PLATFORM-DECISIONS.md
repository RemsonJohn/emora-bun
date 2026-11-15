# Platform decisions

- React/TypeScript client dashboard in the existing Bun workspace. Bun runs the Vite development server (`bun run dev`). Static production output requires no JavaScript server runtime.
- Medusa 2.22.6 REST Admin APIs through the matching official SDK. Existing Medusa backend and storefront are retained.
- One backend/database per business. No tenant switcher, shared-DB tenant scheme, or platform-owner UI in this release.
- Use existing merchant admin credentials. JWT is stored in sessionStorage, cleared on logout, and sent as a bearer token. No administrator API key, payment secret or database credential in the browser. MFA accounts use native Admin until an additional-factor flow is implemented.
- Local dashboard port 5174. Vite proxies `/admin`, `/auth`, `/static` and `/uploads` to localhost:9000. Only development adds the dashboard origin to backend CORS.
- Production: serve `dist/` via a static web server. Configure SPA fallback and reverse proxy `/admin`, `/auth`, `/static` and `/uploads` to that merchant's backend, or set VITE_MEDUSA_BACKEND_URL at build time and explicitly allow the dashboard origin in Medusa ADMIN_CORS and AUTH_CORS. Vite proxy settings do not ship in production. Forward Authorization unchanged; never cache authenticated Admin API responses.
- Chart values are real loaded order amounts; Medusa v2 amounts are major currency units (no division by 100). Count only captured INR orders. Metrics explicitly disclose the latest-100-order scope; complete reports remain a backend task. Refund-adjusted revenue is not claimed.
- Product writes use Medusa's authenticated REST endpoints and their workflows. No direct database mutations or payment-state manipulation from this frontend.
- Native Medusa screens remain the functional fallback for media, variants, pricing, inventory adjustments, fulfilment, refunds, promotions and settings. Links may require a separate native-admin login because the dashboard uses a separate JWT session.
- R2, Razorpay and Brevo are target integrations; no credentials are invented, and no integration is represented as configured before it is tested.
