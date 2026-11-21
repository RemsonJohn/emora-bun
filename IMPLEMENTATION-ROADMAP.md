# Implementation roadmap

Planning baseline: 2026-11-19. User requested completion of planning, not live deployment. Current files are specifications, not working features.

## Architecture decisions

- Internal Emora platform: proposed React/Vite UI, small server-side API, platform PostgreSQL database, bounded background jobs.
- Each independent merchant: separate Medusa backend and database/credentials. Shared PostgreSQL host is acceptable subject to resource and access controls; separate databases do not isolate shared-host failures.
- Existing storefront repositories stay separate initially. Sagar uses Vercel and Anushq Netlify. Integrate actual supplied sources rather than replacing them with the starter storefront.
- Merchant registry records deployment URLs, ownership, environment, capability status and secret references. Platform credentials never enter public storefront config.
- Custom business features use modules, links, workflows and appropriate core flows; production data does not use raw SQL mutations.
- Public product media, private customer artwork and private claim evidence have distinct storage policies. Storage/backup capacity is part of the KVM 2 assessment.
- No selected paid platform services beyond approved hosting. Provider transaction/shipping costs and existing domain/hosting costs remain separate. Free-tier suitability must be verified; do not assume unlimited traffic or storage.

## Milestones and gates

### A. Source and requirements audit

Verify actual Git metadata, deployed branch/revision, package managers and installed docs. Audit existing product structures, variants, static IDs, cart grouping, customizer uploads, video assets and policy text in both repos. Document an ID mapping and migration plan. Read code without modifying live sites.

Deliverable: integration map and confirmed screen/data requirements. No framework upgrades or repository relocation without a concrete need.

### B. Visual design review

Produce rendered references/mockups for the super-admin merchant directory, overview and onboarding. Design the product/media workspace separately in the merchant panel. Preserve Anushq/Sagar branding on storefront flows. Review desktop/mobile, keyboard focus, loading/error states and short reduced-motion-aware transitions.

Deliverable: user-reviewed design target. Written specifications alone do not satisfy visual approval.

### C. Technical spikes

1. Backend connection authentication/capability contract with least-privilege scope, rotation and tenant binding.
2. Medusa payment semantics for advance/balance/COD; define what requires custom workflows.
3. Image derivatives and browser/mobile video trimming/export against representative assets.
4. Two-backend capacity test with database, platform API and representative background tasks.

Deliverable: tested approach, limits and trade-offs. No paid live payment/shipment tests without explicit action.

### D. Platform foundation and connections

Create platform access control, merchant registry, draft wizard, scoped connection checks, activity log and truthful states. Add only the navigation destinations that function. Add screenshot capture later in bounded jobs; do not make expensive jobs part of page rendering.

Gate: isolation tests, role matrix, no secret exposure, rejected invalid remote destinations, resumable drafts and concurrent-edit protection. Connect only explicitly authorized environments.

### E. Sagar catalog and media

Map static products to Medusa product/variant identifiers, import approved catalog data through workflows, build merchant product/media management, connect storefront browsing/cart and durable artwork. Preserve approved prices rather than trusting static sample data blindly.

Gate: variant/stock integrity, responsive images/gallery, private uploads, interrupted upload recovery, current storefront routes/SEO continuity, draft versus publication behavior.

### F. Quotes, customization and policies

Implement roster intake, quote versions, proof approval, immutable order snapshots and pending client-configurable policies. Build returns/exchanges/evidence flows with scoped private access.

Gate: bulk always requires quote; revised terms require reapproval; accepted quote conversion is idempotent; order history survives product/media edits.

### G. Payment and fulfillment

Client-approved policy -> merchant account readiness -> test-mode integration -> failure/reconciliation testing -> explicitly approved live verification. Add Razorpay, COD/advance semantics, Shiprocket, shipping rules and dispatch.

Gate: server-authoritative totals, duplicate/out-of-order webhooks, interrupted payment, stock changes, failed shipment response/retry, partial refunds, COD reconciliation, mixed-cart shipping and quote/payment gates.

### H. Anushq integration

Reuse tested contracts while preserving Anushq storefront. Add mandatory-kurti look groups, optional matching pieces, per-product feature and discount toggles, variant mapping and short-video management.

Gate: direct cart API cannot bypass look rules; add/remove/quantity/discount behavior is consistent; allocated discounts support returns; edited video exports correctly and playback does not overload mobile devices.

### I. Analytics, previews and operations

Implement all three analytics areas with coverage/freshness labels, consent-aware audience events, trusted purchase events, cached aggregates, connection diagnostics and bounded preview jobs.

Gate: no fabricated history, no cross-merchant data exposure, correct money/currency definitions, restricted preview destinations and host-wide resource labels.

### J. Hosting and launch review

KVM 2 is not purchased. Before purchase/cutover confirm price, workload fit, existing services, backups, media growth and off-server destination. Prefer builds outside production, resource limits, bounded jobs, log rotation and minimal staging lifetime. Shared Redis, if used, needs explicit per-merchant credentials/key isolation and verified queue/cache behavior; never assume numbered databases alone provide a security boundary.

Test backups and restoration, HTTPS, domains, health checks, capacity and service restart. Retain rollback capability and define treatment of existing carts before switching live checkout. Launch Sagar first, observe actual operation, then Anushq. Purchase/deploy/policy publication is a separate explicit operation.

## Decisions awaiting clients/owner

- Payment modes per product; advance amounts, balance timing/method and production/dispatch gates.
- Shipping rates/threshold basis, exclusions, mixed-cart behavior, COD fees and allowed destinations.
- Approved cancellation/return/refund/exchange/evidence policies and retention.
- Complete-the-look discount value, base and stacking.
- Video duration/resolution/size limits and original-retention policy.
- Backup destination, domain/subdomain choices, staff roles and credential pairing approach.
- Provider accounts/KYC readiness; no credentials should be pasted into chat.

These do not block design, source auditing or isolated prototypes. They do block publishing affected policies and enabling live checkout paths.

## Project status

- Existing local development setup: previously started and tested; current runtime status must be checked when resuming.
- Screens 01–03: written proposals, not rendered mockups or implementation.
- Screens 04–15: specified in SCREEN-SPECIFICATIONS.md.
- No super admin implementation, merchant isolation deployment, payment integration, shipping integration or live storefront modification completed in this planning phase.

Confirmed ownership boundary (2026-11-19): merchants exclusively manage products, catalog, and media in their merchant panel. Super admin manages merchant onboarding, feature availability, deployment connections, previews, analytics and platform administration. No product/media editor or shortcut belongs in the super-admin navigation. Onboarding feature availability does not replace merchant-level feature configuration or content management.
