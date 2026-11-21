# Emora platform plan

Status: planning only. Updated 2026-11-19. Implementation and live deployment are not approved yet.

## Planning package

- `SUPER-ADMIN-SCREEN-01.md`: merchant directory.
- `SUPER-ADMIN-SCREEN-02.md`: merchant overview, previews and summaries.
- `SUPER-ADMIN-SCREEN-03.md`: resumable onboarding wizard.
- `SCREEN-SPECIFICATIONS.md`: remaining merchant, storefront and platform screens (04–15).
- `IMPLEMENTATION-ROADMAP.md`: architecture proposals, milestone gates, technical spikes and outstanding decisions.

Written specifications are complete for the currently discussed scope. Rendered mockups, source audit completion, technical validation and implementation are still pending.

## Confirmed direction

- Internal team manages multiple independent merchants. Initial merchants: Sagar Sportz and Anushq. Multiple stores per merchant is deferred.
- Sagar is the pilot. Keep the existing merchant interfaces initially; design the super admin first using Medusa Admin as the dominant visual reference.
- Connect existing deployments first. Storefront templates and automated hosting provisioning are future phases.
- Plan separate Medusa instances and databases per independent store, plus a separate platform database. Validate shared-host capacity before production.
- Hostinger KVM 2 is the proposed budget ceiling and has not been purchased. Avoid additional paid platform services. Payment/shipping transaction costs are separate from hosting.
- Existing storefront hosting: Sagar on Vercel, Anushq on Netlify. Moving storefronts to a VPS is optional later.
- Infrastructure ownership starts with Emora; allow recording merchant-owned infrastructure later.

## Source inspection

- Sagar source: `C:/Projects/claude/sagarsportz`; private GitHub repo `beingmaneesh/sagarsportz`. Next.js app, npm lockfile. Includes jersey customization, local cart/wishlist, bulk enquiry forms, and WhatsApp checkout. Source inspection found logo previews and filenames; production artwork persistence must be audited and implemented.
- Anushq source: `C:/Projects/claude/anushq`; private GitHub repo `beingmaneesh/anushq`. npm Turborepo, Next.js storefront in `apps/web`. Includes static catalog, local cart, Complete the look groups, and spotlight/Instagram video components.
- Preserve separate repositories initially. Do not substitute `emora-bun/apps/sagar-storefront` for the supplied Sagar source without comparing them.
- Private GitHub package.json fetches returned 404; local source is readable. Git status failed with a work-tree error in both supplied directories; verify repository metadata before Git operations.
- Both repositories instruct agents to read installed Next.js documentation before coding. No storefront files have been changed during this audit.

## Platform and onboarding

- Internal team accounts and permissions, merchant directory, merchant/environment detail, connection records, audit history.
- Wizard: business, backend, storefront, payments, shipping, validation, activation. Save/resume, step-specific retries, clear draft/connected/live distinctions.
- Storefront connection checks: URL, publishable key/sales channel, CORS, regions, catalog, customer auth, cart, checkout, media, and deployment environment.
- Desktop/mobile previews with capture timestamps; live embeds only when supported.
- Commerce, visitor/conversion, and infrastructure analytics. Define attribution, currency handling, consent, retention, and freshness. Missing data must not display as zero.

## Commerce requirements

- Ready-made and customized products in both businesses. Shipping rules configurable per merchant and product type; define mixed-cart handling.
- Proposed Sagar free-shipping threshold: INR 1500, editable. Below-threshold charges, COD fees, eligible subtotal, exclusions, and Anushq rules await client decisions.
- Sagar customization: names/numbers, logos, customer artwork, jersey selections, bulk team orders. Bulk orders require quotation and approval.
- Payment policy deferred pending client discussion. Plan advance/prepaid and COD capabilities; amounts, balance timing, eligible products, and refund treatment remain unresolved.
- Razorpay and Shiprocket accounts are not ready. Plan merchant-specific accounts/credentials and test/live separation. Do not mark online payments paid from browser callbacks alone.
- Payment and shipment processing must tolerate duplicate, delayed, and failed notifications. Distinguish COD collected, shipment delivered, and funds settled.
- Returns, refunds, exchanges: configurable eligibility, reason, deadlines, approval, shipping responsibility, and policy version recorded at order time.
- Unboxing video requested as claim evidence. Private original storage, progress/retries, retention limits, and manual review exceptions; final policy wording awaits client approval.

## Anushq Complete the look

- Main kurti is mandatory; matching pieces are optional. This eligibility must hold in backend/cart processing, not just the storefront UI.
- Merchant toggles feature per kurti and selects linked pieces/display order.
- Separate discount toggle. Any matching add-on with the kurti qualifies when enabled. Discount amount, type, application base, and stacking need specification.
- Keep variant selection, inventory, and individual line items for each piece; retain the group association for claims and pricing.
- Replace misleading copy that offers any piece independently.
- Sliding-pill toggles for binary settings; preserve independent selection for multiple add-ons. Conditional configuration reduces clutter.

## Media and interaction quality

- Product editor: drafts, variants, prices, stock, categories, shipping dimensions/weight, bulk media upload, reorder, variant mapping, alt text, retry/progress.
- Image editing: crop, rotate, ratios, fit/padding, fill/crop, resize/compress, derivative generation, preserve originals, quality feedback.
- Private production artwork is separate from public product images and must preserve original quality.
- Storefront gallery: thumbnails, fullscreen, click/tap zoom, drag pan, pinch/swipe, keyboard access, responsive delivery, stable layout.
- Anushq short clips: trim timeline, start/end handles, scrub/playback, poster selection, mute, progress, actual exported trim. Prototype encoding before choosing browser versus bounded server processing.
- Product-video editing must not alter claim evidence originals. Limits and retention must fit the storage budget.
- Medusa-inspired super admin; preserve merchant storefront brands. Review real screen references and mockups before implementation.
- Responsive, keyboard-accessible screens, matching skeletons, loading/error/empty states, short reveals, reduced-motion support, and background refresh without blanking existing content.

## Delivery sequence

1. Audit actual storefront repositories and hosting; finalize unresolved rules and data contracts.
2. Review super-admin merchant list/detail/wizard designs; review product/media designs separately in the merchant panel.
3. Build platform foundation and merchant isolation.
4. Integrate Sagar catalog, variants, inventory, durable cart, artwork, and quotation workflow.
5. Integrate agreed payment, COD, shipping, tracking, and after-sales workflows.
6. Integrate Anushq catalog, required-kurti look grouping/discounts, media, and videos.
7. Add verified analytics/previews and operational controls; check cross-merchant isolation.
8. Load-test the combined hosting proposal, configure backups and restore verification, then plan production cutover.

## Outstanding decisions

- Client payment, shipping, COD, return/refund/exchange policy rules.
- Discount value/base/stacking for Complete the look.
- Whether three-second clips have a strict duration limit; upload/storage/retention limits.
- Off-server backup destination within budget, existing storefront hosting allowances, VPS configuration, and deployment ownership/access.
- Verify local repository metadata and correspondence with deployed branches before changing code.

Confirmed ownership boundary (2026-11-19): merchants exclusively manage products, catalog, and media in their merchant panel. Super admin manages merchant onboarding, feature availability, deployment connections, previews, analytics and platform administration. No product/media editor or shortcut belongs in the super-admin navigation. Onboarding feature availability does not replace merchant-level feature configuration or content management.
