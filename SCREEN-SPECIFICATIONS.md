# Remaining screen specifications

Planning package, 2026-11-19. No implementation or live changes. Read with PLATFORM-PLAN.md and SUPER-ADMIN-SCREEN-01/02/03.md.

## Design contract

Super admin uses Medusa Admin as its dominant reference. Existing merchant interfaces and storefront branding are preserved; merchant enhancements use their established component systems. Installed Medusa product-detail, product-create and product-media implementations were inspected for layout, drafts, progress, permissions and selection behavior. Refero craft/motion guidance supplements these references. These specifications are not completed visual mockups: rendered screen review remains a prerequisite for implementation sign-off.

Use sliding pills for mutually exclusive views and accessible switches for binary options. Multi-select products remain independent controls. Every screen needs initial skeleton, empty, permission-denied, validation, failed request, retry, stale-data and success states where applicable. Background refresh preserves data. Reduced motion removes travel/shimmer. Visible keyboard focus, accessible labels, proper focus restoration, stable layouts, responsive content and explicit destructive actions are required.

## Screen 04: Product directory and editor — merchant dashboard

Purpose: create and maintain actual sellable products without burying complex settings in a single form.

Directory: searchable table, Draft/Published status, product type, thumbnail, inventory summary and updated date. New product is the primary action. Bulk actions only appear after selection and require appropriate permissions. Product images are lazy-loaded thumbnails.

Editor: title/status header, Save draft, Preview and Publish actions; sections General, Variants, Media, Customization, Shipping and Policies. Main column for editing; side column for organization/readiness. Published edits have an explicit save/publish boundary, not hidden autosave into production.

- General: title, description, category/collection, handle, ready-made/custom type, sales channel and tax-related configuration consistent with the backend.
- Variants: options, SKU, price/currency, inventory control and variant images. Bulk edit with validation; prevent duplicate option combinations. No invented stock.
- Shipping: weight/dimensions, shipping profile, lead time, product-type rules and applicable exceptions. Units explicit.
- Policies: references to approved policy versions and product-specific eligibility; no duplicated free-text policies across every product.
- Customization: enable required/optional fields, placement and allowed choices, limits, price modifiers, quote requirement and production lead time.
- Readiness checklist distinguishes missing requirements from recommendations. Drafts may be incomplete; publishing cannot silently invent prices, variants or inventory.
- Product changes use Medusa workflows and appropriate links/events. Server validates monetary values and permissions.

## Screen 05: Media library and image editor — merchant dashboard

Upload workspace: drop zone, file picker, grid/list view, upload queue, per-file progress/retry, reorder, cover selection, variant association and alt text. Uploading does not publish media automatically. Duplicate detection offers reuse rather than silently deleting uploads.

Editor: large canvas, compact contextual tools and thumbnail strip. Crop presets and custom ratio; rotate, reposition, zoom, fit with padding or fill with crop; responsive derivative sizes; quality/size feedback; Reset and Save version. No destructive change to original. Avoid upscaling without warning. Editing transformations remain separate from derived files.

Uploads use restricted file types, content validation, quotas and bounded concurrency. Resume support requires resumable transport; do not advertise it if only whole-file retries exist. Handle interrupted uploads and clean abandoned temporary files safely. Limit decompression dimensions and strip public derivative metadata. Originals and private artwork have separate access and retention rules.

Data: media asset, ownership, visibility, original reference, dimensions/type, processing state, edit recipe, derivatives, alt text and product/variant associations. Replacing an asset must not break historical order/approval references.

Acceptance: cover reorder persists; failed files can retry independently; original remains recoverable; fit and crop behave differently; low-resolution images are flagged; private artwork never appears in public product responses.

## Screen 06: Short-video editor — merchant dashboard

Anushq's spotlight clips: upload, timeline thumbnails, draggable in/out handles, keyboard-adjustable time inputs, scrubber, loop preview, mute, aspect ratio, poster selection and resulting duration. Three seconds is a design reference, not a hard limit until confirmed.

States: Uploading, Ready to edit, Export queued, Processing, Ready, Failed. Previewing a selected interval is not equivalent to exporting it. Save creates an actual trimmed derivative; retain original according to storage policy. Preserve prior published clip until its replacement is ready.

Technical spike first: assess source codecs, browser support, encoding memory/CPU, result size and mobile behavior. Choose browser export or a bounded worker based on evidence. KVM 2 must not run unbounded encoders; throttle concurrent jobs, cap duration/resolution, and avoid heavy rendering during backups or deployments.

Storefront: posters, muted inline playback where appropriate, lazy loading, pause offscreen/hidden-tab videos, reduced-motion/static fallback and a limited number of simultaneous players. Public marketing clips are separate from unedited claim-evidence files.

## Screen 07: Sagar customization — storefront

Preserve existing customizer styling. Flow: jersey/design, variant/size, personalization, logos/artwork, review. Front/back and supported placement selectors are mutually exclusive pills. Customers see clear price-versus-quote behavior.

- Names/numbers: character limits, allowed inputs, exact spelling review and price rules.
- Artwork: private durable uploads with progress/retry, preview and instructions; never persist only a filename or temporary browser data URL.
- Design preview: label illustrative placement; production proof approval is separate.
- Store immutable customization snapshot and asset references with quote/order lines. No changes to approved artwork through later product edits.
- Customer-uploaded pricing is never trusted. Server determines eligibility, pricing and quote requirements.

For ready-priced customizations, enable purchase only when the approved payment/shipping rules permit. Otherwise Request quote. No live Razorpay dependency while quote-only capability is being reviewed.

## Screen 08: Bulk quote and proof approval — storefront + merchant dashboard

Customer intake: product/design, quantity, required date, roster of sizes/names/numbers, artwork and notes. Spreadsheet import is optional structured intake with template, row-level validation and correction before submission. Bulk always requires quotation.

Merchant quote inbox: search/status filters, assigned teammate, requested date and last activity. Quote detail: customer brief, roster, private artwork, line pricing, customization charges, shipping, tax treatment, payment milestones, validity and revision history.

Quote lifecycle: Draft -> Sent -> Revision requested / Accepted / Declined / Expired. Proof lifecycle: Not prepared -> Awaiting approval -> Changes requested / Approved. Preserve version, approver and timestamp. Price/quantity/artwork changes after approval invalidate the applicable approval and require a new revision.

Acceptance records a versioned quote; conversion to cart/order is idempotent. Inventory/availability is revalidated; accepting a quote does not silently guarantee stock indefinitely. Production starts only after required approvals and payment milestone. Staff can track production separately from fulfillment.

Sending emails/messages and creating paid transactions are explicit operations, not consequences of saving a draft.

## Screen 09: Anushq Complete the look editor — merchant dashboard

Located on eligible kurti products. Feature switch reveals product picker, optional-piece labels, display order and preview. Main kurti required and visibly locked. Matching bottom/dupatta have independent variant choices.

Separate discount switch reveals amount/percentage, discount base, validity and stacking rules. Any eligible matching add-on with the kurti can qualify. Value/base/stacking remain undecided; do not infer that the entire cart receives a discount. Avoid double-counting promotion applications.

Server validates group membership and required kurti during add/update/remove and checkout, including quantity changes. Removing the kurti removes its dependent group items with an explicit explanation; ordinary standalone catalog purchases are a separately configurable policy, not accidentally prohibited globally.

Individual order lines retain variants, allocated discount and group references for stock, refunds and exchanges. Refund allocation follows recorded order amounts; do not retroactively invent a penalty for losing a discount after a return.

Storefront copy: Add matching pieces to your kurti. Live total, unavailable state, per-item sizes/colors, grouped add action and clear failure recovery without silently adding a partial selection.

## Screen 10: Product gallery and purchase flow — both storefronts

Thumbnail gallery, selected image, fullscreen dialog, click/tap zoom, drag pan, touch pinch/swipe, keyboard controls, close/focus restoration. Responsive derivatives loaded on demand; no fake extra angles or generated product imagery. Variant change updates media consistently.

Cart uses backend product/variant IDs and server-authoritative totals, inventory, promotions and shipping. Preserve customizations/look groups. Audit static-ID migration and existing local carts before cutover; explain unavailable legacy items instead of silently dropping them.

Checkout: contact/address, serviceable shipping, eligible payment methods and review. Mixed ready-made/custom carts follow an explicit policy for combined shipping versus split fulfillment; unresolved rules block the affected checkout path.

Free-shipping progress comes from backend rules. Do not hardcode INR 1500 across merchants. COD fees and eligibility are shown before placement. Repeated submissions cannot create duplicate orders. Confirmation displays real order/payment state, including pending verification.

## Screen 11: Orders and payment detail — merchant dashboard

Order table: number, customer, date, order total, payment, fulfillment and production status. These are distinct states. Filters persist; amounts include currency.

Detail: products/customization snapshots, customer/shipping, payment events, production/proof state, fulfillment and audit timeline. Payment section separates amount due, advance received, captured/refunded online amounts, COD expected/collected and settlement where supported.

Razorpay implementation is a Medusa payment-provider/workflow integration, not a standalone checkout widget. Verify signatures, trust backend amounts, use durable webhook receipt/deduplication, tolerate out-of-order events and reconcile missed updates. Do not claim universal provider idempotency headers; verify endpoint contracts.

Advance and balance semantics require a design spike against installed Medusa workflows before implementation; no promise that arbitrary partial payments are native. Client decisions determine production/dispatch gates and balance collection methods.

Refund dialog: eligible recorded amount, reason, item allocation, payment channel, confirmation and pending/error state. COD refunds need an explicit approved payout/manual reconciliation path; they cannot be assumed to use Razorpay original-payment refunds.

## Screen 12: Dispatch and shipping settings — merchant dashboard

Settings: per-merchant Shiprocket connection, pickup locations, packaging, weight units, supported destinations, rule groups and COD policy. Fee/threshold edits show representative cart examples and a separate publish action.

Order dispatch: checklist for stock, proof/production completion, required payment, address/serviceability and packaging. Merchant chooses eligible courier/rate, reviews cost then explicitly creates shipment, AWB/label and pickup where supported.

Shipment creation has operation tracking; provider timeouts require reconciliation before retry to avoid duplicate purchases. Track multiple parcels/partial fulfillment where supported. Shipment status, delivery, COD collection and remittance are distinct. Failed delivery/RTO does not automatically trigger refunds.

Shiprocket capabilities, webhook authentication, rate limits and test options must be verified before contract implementation; no invented sandbox or signature mechanism. Reconcile from authoritative API when delivery notifications are insufficient.

## Screen 13: Returns, refunds and exchanges — customer + merchant dashboard

Customer: identify order through authenticated or secure verified access, select item/quantity/reason, describe issue, attach evidence, review policy and submit. Display instructions before delivery and provide accessible upload/retry state.

Merchant claim queue: requested/review/approved/rejected/return-in-transit/received/inspection/resolution states as applicable. Detail has private evidence player, order policy snapshot, communication history, reasoned decisions and controlled manual exceptions.

Unboxing original remains unchanged, private and access-controlled. Retention/deletion rules must preserve active disputes appropriately. Missing video routes to defined review handling rather than a hardcoded universal denial. Client approves policy wording before publication.

Return authorization, physical receipt, refund execution and exchange shipment are separate operations. Exchange validates stock and price difference; replacement does not automatically refund the original. Quote/custom-product rules are explicit. Concurrency controls prevent refunds exceeding the remaining refundable amount.

## Screen 14: Analytics — super admin, scoped merchant view

Tabs Commerce / Audience / Infrastructure with a shared merchant/environment context, period/timezone, definitions and freshness. Platform aggregate totals must not add different currencies without an explicit conversion policy.

- Commerce: orders, approved revenue definition, refunds, online captured, COD due/collected and AOV. Cancellations/refunds reflected consistently.
- Audience: consent-aware visits, product views, add-to-cart, checkout starts and verified purchases. Define event schema, sessions and attribution window; prevent client-generated purchase spoofing and duplicate purchase counts. Show collection coverage and start date.
- Infrastructure: observed uptime/check coverage, latency, failures and host CPU/RAM/disk when connected. Shared-host metrics labelled host-wide, not attributed to one merchant arbitrarily.

Use bounded retention, lightweight scheduled aggregates and pagination. No dedicated heavy analytics cluster. Async panels retain previous results. CSV exports are permission-checked, scoped and safe against formula injection if added.

## Screen 15: Connections, team, activity and platform settings — super admin

Connections: merchant/environment binding, provider mode, verified capabilities, masked credentials, last check, recheck, rotate/revoke and operational errors. Distinguish intended configuration from deployed configuration. Changes invalidate dependent verification.

Team: proposed platform owner, operator and read-only roles, with explicit action permissions and merchant scope if required. Platform roles are separate from existing merchant roles. Owner invites, role changes and credential operations are audited; protect against removal of the last platform owner.

Support access: no shared merchant password or silent impersonation. Initially open merchant admin with its normal login. Any future support session requires explicit authorization, expiry and audit.

Activity: actor, merchant/environment, action, result and time; search/filter/pagination. Never log passwords, raw tokens, payment details or private media contents.

Settings: team profile, security, reporting defaults, notification preferences, hosting ownership and backup status. No billing/subscription UI unless separately scoped. No automatic infrastructure purchase or unimplemented template selector.

## Review artifacts still required

This completes written screen coverage. Before coding, produce rendered mockups with actual references for directory, overview, wizard and media editor; review narrow/desktop layouts and representative error/loading states. Prototype image editing and video export rather than promising capability from mockups alone.
