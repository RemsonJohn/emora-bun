# Emora — work so far

Updated: 19 November 2026 (Asia/Calcutta)

## Current status

We are reviewing an interactive super-admin prototype, not a production platform. The user explicitly chose **prototype first** for merchant account access and security. The prototype runs locally, uses in-memory sample records, and resets on reload. It does not send emails, provision infrastructure, save real merchant accounts, or enforce production authentication.

Local commerce setup and an existing custom merchant dashboard are separate from this prototype. No live storefront deployment, hosting purchase, or production migration has been completed as part of the prototype work.

## Business and architecture decisions

| Area | Direction |
| --- | --- |
| Initial merchants | Sagar Sportz and Anushq are separate businesses |
| Pilot | Sagar Sportz first |
| Priority | Multiple independent merchants; multiple stores per owner can follow later |
| Store isolation | Plan a separate Medusa instance and database per store, with separate platform data |
| Initial hosting | Keep Sagar on Vercel and Anushq on Netlify; connect existing deployments first |
| Backend hosting | Hostinger KVM 2 is the proposed budget ceiling; not purchased |
| Hosting budget | Fit the existing hosting spend; capacity and backup plans still need validation |
| Infrastructure management | Emora team initially; merchant-managed infrastructure may be supported later |
| Templates | No templates initially; required in a future phase |
| UI direction | Medusa-inspired super admin; preserve existing merchant/storefront interfaces initially |

Correct Sagar domain: `sagarsportz.com`.

Storefront sources supplied by the user:

- `C:/Projects/claude/sagarsportz` — private repository `beingmaneesh/sagarsportz`.
- `C:/Projects/claude/anushq` — private repository `beingmaneesh/anushq`; storefront under `apps/web`.

Source inspection found static catalog/cart behavior that still requires commerce integration. Keep the source repositories separate initially. Earlier Git checks reported a work-tree issue in those source folders; resolve repository metadata before making Git changes there. Do not assume the workspace's `apps/sagar-storefront` is the deployed Sagar source.

## Important ownership boundary

**Super admin belongs to Emora.** It manages merchants, onboarding, feature availability, infrastructure connections, previews, analytics, and account access.

**Merchant panels belong to the businesses.** Merchants manage their products, catalog, media, inventory, orders, and store content.

A product/media editor was initially included in the super-admin review. The user corrected that scope. Its menu entry, route and editor were removed. Historical screenshots/assets may remain, but they do not represent the current super-admin scope.

Enabling a feature during onboarding makes that capability available to the merchant. It does not move the merchant's content or operational work into the super admin.

## Local development foundation

The workspace is `C:/Projects/claude/emora-bun`.

- Root package manager: **Bun 1.4.4**.
- Required runtime: **Node.js >=22.23.4**.
- Database: **PostgreSQL >=15**; isolated local cluster uses port **5433**.
- Local Bun runtime: `.local-tools/bun-windows-x64`.
- Local database/runtime data: `.local-data`; both local directories are ignored by Git.
- Environment files contain local configuration and secrets; do not commit or print them.

Earlier setup verification completed dependency installation with the frozen lockfile, migrations and starter seed. Backend health returned 200; the store API returned one region and four products. The primary storefront and custom dashboard reached ready states. These are historical setup checks, not a claim that every service is currently running or production-ready.

| Application | Stack / purpose | Local URL |
| --- | --- | --- |
| Medusa backend | Commerce API | `http://localhost:9000` |
| Medusa Admin | Built-in commerce administration | `http://localhost:9000/app` |
| Primary storefront | Next.js | `http://localhost:8000` |
| Sagar workspace storefront | Next.js | `http://localhost:8001` |
| Custom merchant dashboard | React + Vite | `http://localhost:5174` |
| Super-admin design review | Standalone HTML/CSS/JavaScript | `http://127.0.0.1:5180` |

The existing custom dashboard and Medusa Admin connect to the same local backend/database. That local arrangement is distinct from the planned per-merchant production isolation.

Windows startup workarounds are documented in [SETUP.md](SETUP.md). In particular, the custom dashboard needs its own Vite installation; the root Vite version previously caused a blank page. Existing invitation acceptance also requires explicit `emora_role` metadata.

## Super-admin prototype delivered

Location: `design/super-admin/`.

### Screens

1. **Merchant directory:** sample merchants, search, sliding filters, row actions and empty states.
2. **Merchant overview:** business context, connection readiness, launch checklist, desktop/mobile storefront capture, fullscreen preview, analytics and activity placeholders.
3. **Merchant onboarding:** eight steps — Business, Backend, Storefront, Payments, Shipping, Policies, Features, Review.
4. **Owner & access:** tab within merchant overview for invitations, recovery and account controls.
5. **Team security:** Emora admin two-factor setup preview.

The Sagar preview is a saved public-site capture, not a live monitoring service. Anushq capture and real analytics remain unavailable; the UI does not present invented live figures.

### Interaction and visual work

- Fixed desktop sidebar with independent scrolling when needed.
- Responsive mobile navigation.
- Sliding selection indicators for menus, tabs and dropdown options.
- Restrained glass effects on navigation and overlays; solid forms and work surfaces.
- Popups expand from the clicked button/image and shrink back to that trigger on close.
- Escape closes dialogs; focus is restored where possible.
- Skeleton loading previews, validation, empty states and reduced-motion behavior.
- Native system font stack, improved text contrast, minimum 12px labels and roomier controls.

### Onboarding feature choices

- Product reviews.
- Wishlist.
- Product customization.
- Bulk team orders.
- Complete the Look.
- Video spotlight.

Selections are retained separately for the sample merchants during the page session and summarized for review. Switches do not install or activate backend/storefront integrations.

## Merchant owner access

### Intended production flow

1. Record the business and owner email during onboarding.
2. Connect the merchant's backend and public merchant-dashboard URL.
3. When account prerequisites and email delivery are ready, send a store-scoped invitation.
4. Owner sets their password and signs into their merchant dashboard.
5. Emora can assist recovery and control login access without seeing the owner's password.

The user proposed temporary passwords followed by a mandatory change. The current preview uses the recommended password-setting invitation link instead. No temporary-password authentication has been implemented; revisit that choice before production if required.

### Interactive access previews completed

- Send/resend invitation simulation and sample email.
- Expired, failed-delivery and cancelled invitation states.
- Password setup with confirmation and mismatch validation.
- Sample owner sign-in and self-service forgot-password request.
- Admin-assisted password reset.
- Owner login deactivation/reactivation.
- All-device sign-out and session revocation simulation.
- Recovery after loss of email access, requiring a sample ownership review.
- Per-merchant access history with reasons for changes.
- Two-factor enrollment and recovery-code acknowledgement for Emora admins.

Deactivation affects the owner's login, not the storefront or customer orders. Disabling all merchant staff and suspending a storefront are separate future controls. Reactivation does not restore previously revoked sessions.

Existing application code already supports manual invitation links and registration:

- `apps/client-dashboard/src/routes/settings/SellerInvites.tsx`
- `apps/client-dashboard/src/routes/auth/SellerRegistration.tsx`
- `apps/backend/src/api/auth/seller/invites/validate/route.ts`
- `apps/backend/src/access-control/invite-accept.ts`

The existing backend has store-level role permissions. Platform identity, automatic invitation emails, real login suspension, real session revocation and two-factor enforcement were **not** implemented in the prototype phase. Sample password fields are cleared; no real password or OTP secret is generated or stored by this review.

## Commerce requirements captured for later implementation

### Sagar Sportz

- Ready-made and customized products.
- Names/numbers, logo uploads, jersey design selection and customer artwork.
- Bulk team orders requiring quotation and approval.
- Durable artwork and cart integration with the real backend.

### Anushq

- Complete the Look is kurti-led: the main kurti is required and matching pieces are optional.
- Merchant controls feature availability per eligible product and a separate discount toggle.
- Discount amount, calculation basis and stacking remain undecided.
- Short product videos, including the existing approximately three-second spotlight concept.

### Shared requirements

- Capable merchant media management: upload, crop, ratios, fit, compression, ordering, thumbnails, fullscreen view, zoom/pan and original preservation.
- Video trimming, playback, poster selection and export require a technical spike.
- Public product images, private customer artwork and private claim evidence need separate storage/access rules.
- Razorpay and Shiprocket integrations are planned; accounts are not ready.
- COD is the requested launch direction; advance/prepaid options and exact eligibility need client confirmation.
- Dynamic shipping for ready-made, custom and mixed carts.
- Proposed Sagar free-shipping threshold: INR 1500, configurable rather than hardcoded globally.
- Returns, refunds, exchanges and requested unboxing-video evidence need approved policies, retention rules and exception handling.

These are requirements and plans, not completed commerce integrations.

## Verification completed

The local Playwright/Edge review scripts passed:

```powershell
node design/super-admin/verify.cjs
node design/super-admin/verify-access.cjs
```

Checks covered:

- Core screens at desktop and mobile widths, with no horizontal page overflow.
- Search/filter, wizard validation, dropdowns and feature selection.
- Removal of the merchant product editor from super-admin navigation/routing.
- Popup origin animation, Escape dismissal and focus restoration.
- Invitation expiry/resend, password mismatch and acceptance.
- Self-service recovery, owner sign-in and direct session revocation.
- Deactivation/reactivation, password reset and verified email recovery.
- Separation of sample merchant records and histories.
- Two-factor setup preview, skeleton loading and reduced motion.
- No JavaScript errors in those exercised flows.

Screenshots are in `design/super-admin/screenshots/`. Design scans reported no findings after corrections; no suppressions were added. `git diff --check` passed. These checks are not a production security audit or full application build/lint verification.

## Run the design review

From the repository root:

```powershell
node design/super-admin/serve.cjs
```

Open:

- `http://127.0.0.1:5180/#directory`
- `http://127.0.0.1:5180/#overview` → Owner & access
- `http://127.0.0.1:5180/#onboarding`
- `http://127.0.0.1:5180/#security`

The static server binds to loopback. It does not require the commerce backend. Browser verification requires the server running, installed project dependencies and Edge.

## Remaining work and next steps

1. Review and refine the access/onboarding prototypes before production implementation.
2. Define platform identity, merchant-to-backend mapping and server-enforced access boundaries.
3. Implement durable onboarding, owner invitations and a configured email sender with delivery/retry states.
4. Implement real password recovery, login blocking, session invalidation, audit records, rate limiting and mandatory Emora admin 2FA.
5. Add staff management and ownership transfer in a later phase, with explicit recovery verification.
6. Integrate Sagar's real catalog, cart, customization, artwork and bulk quotation flow.
7. Finalize client payment/shipping/returns decisions and integrate providers.
8. Integrate Anushq's catalog, kurti-led matching pieces and media/video features.
9. Connect actual previews, commerce/visitor analytics and infrastructure monitoring.
10. Validate hosting capacity, storage limits, backups and restore procedures before purchasing/provisioning or going live.

No production authentication implementation, real email delivery or live deployment should be inferred from the prototype controls.

## Related documents

- [SETUP.md](SETUP.md) — local environment and startup commands.
- [PLATFORM-PLAN.md](PLATFORM-PLAN.md) — consolidated platform requirements.
- [IMPLEMENTATION-ROADMAP.md](IMPLEMENTATION-ROADMAP.md) — proposed milestones and gates.
- [SUPER-ADMIN-SCREEN-01.md](SUPER-ADMIN-SCREEN-01.md) — merchant directory specification.
- [SUPER-ADMIN-SCREEN-02.md](SUPER-ADMIN-SCREEN-02.md) — merchant overview specification.
- [SUPER-ADMIN-SCREEN-03.md](SUPER-ADMIN-SCREEN-03.md) — original onboarding specification.
- [SCREEN-SPECIFICATIONS.md](SCREEN-SPECIFICATIONS.md) — broader merchant/storefront screen requirements.
- [MERCHANT-OWNER-ACCESS.md](MERCHANT-OWNER-ACCESS.md) — owner access flow and implementation boundary.
- [design/super-admin/README.md](design/super-admin/README.md) — prototype operation and review notes.
- [MEMORY.md](MEMORY.md) — concise session decisions.

Some earlier planning files describe the original scope. For current progress, the clarified merchant-only product/media boundary, eight-step onboarding, and prototype-only security scope in this handoff take precedence over historical descriptions.

## Workspace handoff note

At this handoff, planning documents and `design/` are untracked, and `.gitignore` has changes. Other setup files and an existing backend image are also present in the working tree. No commit or deployment was made for this handoff. Review the complete diff before committing; preserve unrelated user files and never commit local secrets or invitation tokens.
