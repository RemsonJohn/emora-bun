# Screen 03: Merchant onboarding wizard

Status: proposed design specification; no implementation or live writes.

## Reference and purpose

Medusa Dashboard's product-create form provides the main reference: focused modal/page, progress tabs, explicit draft saving, inline validation, and a stable footer. Adapt it into a resumable full-page merchant onboarding flow; use the brief's sliding indicators and Refero's short functional motion guidance.

Audience: Emora internal team. Initial setup connects existing infrastructure; it does not buy hosting, create deployments, send invitations, or activate commerce implicitly.

## Shell

- Breadcrumb back to merchant directory, heading Add merchant or Resume setup, draft-save status, Save and exit.
- Desktop: compact step rail, readable form width, optional contextual checklist. Mobile: current step/title with accessible step picker; no seven tiny tabs across the screen.
- Steps: Business, Backend, Storefront, Payments, Shipping, Policies, Review.
- Active-step indicator slides about 160 ms. Content transition about 160–180 ms; respect reduced motion. Do not delay available content or rerun full-page reveals on field changes.
- Stable footer: Back, Save for later (where relevant), Continue. Labels on final actions describe their actual effect.
- Step states: Not started, In progress, Waiting on client, Verified, Needs attention. Saving a form does not make a connection verified.

## 1. Business

- Required to create draft: merchant display name. Internal identifier generated once, with duplicate detection.
- Collect public storefront domain if known, owner contact email, country, currency, timezone, assigned internal teammate, and optional logo. Require complete operational contact details before launch, not before a draft can exist.
- India/INR/Asia-Kolkata can be suggested for these merchants, but remain explicit editable values. Do not automatically alter an existing backend's region/currency.
- Product types: ready-made and custom; bulk quotations enabled where needed. These describe desired capabilities, not proof of implementation.
- Hosting ownership: Emora or Merchant. Provider inventory is separate from payment-account business ownership.
- Sagar and Anushq create separate merchant records. No multiple-store workflow in this release.

## 2. Backend

- Sliding choice: Connect existing / Set up later. The latter records Not provisioned and permits independent tasks.
- Connect: backend HTTPS URL, environment, provider/host reference, merchant admin URL where known, and a secure server-side credential pairing flow.
- Connection contract must be specified before coding: least-privilege service authentication, merchant binding, capability/version response, rotation/revocation. A health response alone proves reachability, not tenant identity or authorization.
- Show independently: URL reachable, supported Medusa version/capabilities, authorized connection, expected merchant/environment binding. Return actionable errors without secret values.
- Credentials are stored encrypted server-side using a separately managed encryption key. Do not save them to localStorage, URLs, analytics, draft history, or logs. UI stores credential references/status only.
- Platform remote requests constrain destination and redirects, block metadata/private network destinations by default, and require controlled explicit configuration for internal development endpoints.
- Editing URL or credential invalidates its previous verification. Repeated verification is read-only, bounded, and deduplicated.
- KVM 2 not purchased is a valid pending state. No fabricated database/backend URL.

## 3. Storefront

- Existing storefront URL, hosting provider, optional repository URL and deployed branch/reference, environment.
- Sagar: Vercel; Anushq: Netlify, based on owner-provided facts. No repository imports or deployment changes on submission.
- Show generated public configuration guidance for backend URL/publishable key as appropriate to the audited app. Never put admin credentials in storefront configuration.
- Read-only checks: site reachable, backend/catalog compatibility, expected region and sales channel, allowed origins, integration version/capabilities where implemented. Use a browser-based test for browser/CORS claims, not server reachability alone.
- Preview capture is optional and asynchronous. A public static storefront may be reachable but still require cart/auth/checkout integration work.
- Migration from static product IDs and local carts requires explicit mapping and rollout strategy; this wizard cannot infer completion from a domain.

## 4. Payments

- Razorpay account status: Not ready / Test connected / Live connected / Needs attention. No account is currently ready.
- Desired methods: online/prepaid, advance, COD. Each has Pending decision / Disabled / Configured state. Save pending decisions without silently enabling checkout options.
- Advance amount/percentage, balance timing, custom-product eligibility, and COD eligibility require client decisions. They stay unset until approved.
- Configure provider credentials securely per merchant/environment and verify without charging. Live verification requiring a transaction is a separate explicitly initiated task.
- Distinguish gateway mode, webhook health, implemented capability, policy approval, and actual launch readiness. All COD-only paths still require approved COD/shipping rules.

## 5. Shipping

- Shiprocket account status and server-side connection, pickup location, dispatch contact, package weight/dimensions, serviceability, eligible couriers/methods.
- Rule groups: ready-made, custom, and bulk quotation. Fixed-price shipping, live rates, and free-shipping thresholds are selectable policies to be specified, not enabled defaults.
- Sagar INR 1500 free-shipping threshold is a draft proposal requiring approval. Do not copy it to Anushq automatically.
- Configure subtotal basis, below-threshold charge, COD charge, exclusions, destinations, and mixed-cart behavior. Bulk quotes can specify their shipping amount separately.
- Product lead time and ready-to-dispatch status stay separate from courier transit estimates.
- Rate/serviceability checks are read-only. AWB allocation, pickup, and paid shipment creation are explicit merchant operations outside setup verification.

## 6. Policies

- Separate ready-made/custom policies: returns, refunds, exchanges, cancellation, quotation validity, and production approval.
- Unboxing-video instructions and evidence requirement, manual exception review, file limits, access controls, and retention. Final policy wording remains client-approved rather than auto-generated as authoritative terms.
- Record Draft / Awaiting approval / Approved plus policy version, approving actor, and date. Orders later retain applicable policy references/content snapshots.
- Do not silently publish policy changes onto storefronts. Preview and explicit publish are separate from saving drafts.

## 7. Review

- Group facts, verified connections, remaining client decisions, and implementation tasks. Edit links return to precise sections.
- Two independent results: merchant registered in the platform; commerce readiness. Creating/finishing a platform record does not deploy or launch a storefront.
- Primary action with unresolved work: Save merchant and view overview. Once all configured checkout-path requirements pass: Mark ready for launch review.
- Actual live cutover is a separate release operation after browser checkout, payment/COD, shipping, isolation, backups, and capacity validation. Do not use a misleading Activate button in connection-only onboarding.
- Owner invitation is separate, requires an explicit action and correct staff role metadata, and is unavailable until its backend connection is ready. Saving setup sends no emails.

## Draft and team behavior

- Autosave non-secret drafts after meaningful changes and persist before step navigation. Display Saving / Saved / Couldn't save with Retry.
- Save and exit waits for successful persistence; if unavailable, retain form contents and explain the issue. Warn only when leaving would lose unsaved changes.
- Pending steps may be skipped with a recorded reason; required dependencies remain unverified. Returning to completed steps does not erase later input.
- Server-side version checks detect concurrent edits from teammates. Offer reload/review rather than silent overwrite. Audit material changes with redaction.
- Refresh restores step and saved values. URL contains identifiers and step only, never credentials or invitation tokens.
- Errors focus the first invalid field and retain input; success/failure statuses are announced accessibly.

## Acceptance

- Team can register both merchants before purchasing the VPS and resume later.
- No payment, deployment, shipment, invitation, or policy publication is triggered by saving or connection checks.
- A stale verification is invalidated when its relevant configuration changes.
- Different merchant drafts, secrets, and connections cannot cross boundaries.
- Keyboard, mobile, reduced-motion, skeleton/error/empty states and interrupted saves are reviewed.
- Client policy uncertainty never appears as a falsely completed setup step.

Next screen: merchant product editor and media workspace, with separate public product media and private customer artwork.
