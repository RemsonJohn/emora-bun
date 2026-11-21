# Screen 02: Merchant overview

Status: proposed specification for review; not implemented.

## Purpose and references

Give the internal team a clear answer to: what is connected, what needs attention, and what to do next for this merchant.

Dominant reference: installed Medusa Dashboard product-detail screen, which uses a two-column layout, contextual sections, permission guards, and a matching two-column skeleton. Supplement with the previously read Refero motion/craft guidance and the user's sliding-pill, low-clutter brief. This specification is not a rendered visual approval.

## Page structure

- Breadcrumb: Merchants / Sagar Sportz. Merchant name, domain, and environment badge remain visible in the header.
- Only show an environment selector when more than one environment exists. Switching changes every dependent panel and never briefly shows the previous merchant/environment data under the new heading.
- Main action while incomplete: Continue setup. After setup: Open merchant dashboard. Secondary action: Open storefront. Opening merchant applications does not silently grant platform users merchant privileges.
- Sliding segmented navigation: Overview, Connections, Analytics, Activity. Each has a URL and accessible keyboard semantics; indicator motion is short and disabled for reduced motion.
- Overview desktop: wide main column for storefront preview and performance summary, narrow side column for setup checklist and connection summary. Recent activity below. Mobile becomes one column with setup/action needs ahead of the preview.

## Setup and truthful status

- Main status: Setting up, Ready for review, Live, or Needs attention. Define readiness separately from backend reachability and website availability.
- Checklist: business details, backend, catalog/storefront, payment policy/provider, shipping/fulfillment, returns/exchanges, launch validation.
- Entries: Not started, In progress, Waiting on client, Verified, Failed. Show a count of verified applicable items, not an invented completion percentage.
- Pending payment decisions appear as Waiting on client with a descriptive next action; do not turn an undecided policy into a technical outage.
- Static storefront can be publicly available while commerce integration remains incomplete.
- Each entry opens its associated setup section; errors link to diagnostics and the relevant retry.
- Launch checks never create live charges or paid shipments without a separate explicit operation.

## Storefront preview

- Display a real cached capture in a restrained browser frame, with Desktop / Mobile sliding control, actual URL, environment, and capture time.
- Open storefront, Refresh preview, and fullscreen preview actions. Fullscreen is a labelled preview, not an operational storefront session.
- Initial missing capture: Not captured yet with Capture preview; never substitute invented storefront imagery.
- Pending refresh: retain prior image with Refreshing label. Failed capture: preserve previous capture, show error/retry. Expired/unavailable images use a stable placeholder.
- Capture asynchronously with bounded concurrency; deduplicate repeated refresh requests and retain only a small configured number of derivatives.
- Embedded live mode is deferred until framing/authentication behavior is validated. Do not proxy sites merely to bypass their framing restrictions.
- Screenshot jobs must restrict destinations and redirects to authorized storefront hosts, exclude private infrastructure/metadata addresses, and avoid capturing account/checkout data. These are server-side constraints, not extra onboarding steps.

## Analytics summary

- Compact summary below preview, not a wall of cards. One reporting period, timezone, currency, freshness, and collection-start date.
- Commerce: orders and clearly labelled captured online payments; COD due/collected and refunds distinct. Do not label collected or captured money as bank settlement.
- Audience: tracked visits and purchase conversion with explicit event definitions and coverage; no fabricated historical traffic before instrumentation.
- Health: backend availability/latency with check timestamp; VPS memory/CPU/disk only after monitoring connection is established.
- Missing connection displays Connect analytics or Connect monitoring. A measured zero displays 0; unavailable metrics display unavailable, with explanation.
- Detailed charts and dimensions load on the Analytics tab. Aggregate data is cached server-side and scoped to merchant/environment; no live cross-database fan-out for every render.
- Unrelated panels can load or fail independently. Background refresh retains data with a stale indicator when necessary.

## Connection summary

Compact rows: Storefront, Medusa backend, Razorpay, Shiprocket, Visitor tracking, Host monitoring.

- Each row includes meaningful state and last verification when available; Test and Live provider modes are explicit.
- Host records distinguish storefront provider and backend provider. Sagar's Vercel / Anushq's Netlify are user-reported until inspected.
- Pending VPS purchase and absent Razorpay/Shiprocket accounts are represented honestly, without claims of connected infrastructure.
- View connections opens scoped configuration/diagnostics. Credentials remain server-side, masked in configuration, and absent from general overview payloads.

## Activity

- Recent platform operations: connection changed, verification failed, setup resumed, preview captured, policy changed.
- Actor, timestamp, action, and outcome; sensitive values redacted. No fabricated activity during empty state.
- Full history on Activity tab, with filtering and pagination.

## States and performance

- Layout-matched skeleton only for initial data load; no artificial minimum wait.
- Context loads first; previews/charts load independently and lazily. Stable image aspect ratios prevent layout shifts.
- Tab indicator about 160 ms; small section reveal up to 180 ms; no prolonged stagger for frequently used panels. Reduced motion removes travel/shimmer.
- Keyboard-accessible actions/tabs, text status alongside color, sensible focus after navigation, no hover-only information.
- Friendly empty, unavailable, forbidden, retry, and stale states. Permission checks are enforced in the API, not only hidden buttons.
- Safe refresh/poll intervals with backoff and hidden-tab pause; no repeated expensive capture or aggregation on tab switching.

## Acceptance and next step

- User can distinguish live static storefront, connected backend, payment readiness, shipping readiness, and complete commerce launch.
- Merchant/environment switching cannot leak previous data; platform access does not silently sign into merchant tools.
- Preview failure does not block setup; analytics failure does not blank the screen.
- Client-dependent payment rules can remain pending without blocking unrelated setup.
- Desktop, mobile, keyboard, reduced-motion, empty/loading/error states receive visual and functional review.

Next screen: onboarding wizard, beginning with merchant identity and connection setup. No automatic provisioning in this phase.
