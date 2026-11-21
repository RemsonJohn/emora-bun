# Screen 01: Merchant directory

Status: proposed specification for review; not implemented.

## Purpose

Help the internal Emora team find a merchant, understand connection state, resume onboarding, or open its management page. This is the initial landing screen.

## Reference direction

- Dominant reference: installed Medusa Dashboard's user-list-table implementation: restrained container, heading and primary action, searchable paginated rows, row navigation, separate empty/filtered states, previous results retained during fetches.
- User brief: Medusa Admin visual language, smooth sliding-pill controls, no visual clutter, skeleton screens, responsive interactions.
- Refero motion and craft references: short functional transitions, visible keyboard focus, reduced-motion support. A rendered visual review is still required before implementation sign-off.

## Desktop layout

- Narrow sidebar: Emora identity, Merchants (active), Analytics, Activity; Team and Settings at the bottom. Future destinations are planned navigation, not nonfunctional buttons in the initial implementation.
- Main heading: Merchants. Supporting copy: Manage your businesses and store connections.
- Single primary action: Add merchant. Opens the onboarding flow in a later screen.
- Toolbar: search by merchant name/domain; sliding segmented filter All / Needs attention / Setting up. Filter counts come from actual platform records.
- One table, without oversized KPI cards: Merchant, Storefront, Connection, Hosting, Last checked, Actions.
- Merchant cell: small logo/initials, business name. Storefront cell: domain with accessible external-link action.
- Connection states: Not connected, Checking, Connected, Needs attention, Unknown. Connected does not imply checkout/payment launch readiness.
- Hosting displays frontend and backend separately. Example frontend labels: Vercel for Sagar and Netlify for Anushq. Backend stays Not connected until verified.
- Last checked includes a timestamp or Not checked. A stale check must not masquerade as current health.
- Row menu: View merchant, Open storefront, Continue setup where applicable, Recheck connection where configured. No inline destructive operations.
- Pagination once needed; search/filter state in URL; preserve state when returning from merchant detail.

## Initial examples

Sagar Sportz: sagarsportz.com, Vercel storefront, backend Not connected.
Anushq: anushq.in, Netlify storefront, backend Not connected.

These are planning examples based on user-provided information, not live verification. Do not invent health, orders, revenue, logos, or screenshots.

## Interaction

- Merchant name/row navigation opens merchant overview. Nested external links and menus do not trigger row navigation. Use accessible links, not mouse-only clickable containers.
- Filter indicator slides approximately 160 ms; no deliberate delay to display available data. Search is debounced, stale requests cancelled or ignored.
- Background refresh keeps existing rows visible and marks updating state subtly.
- Initial load skeleton mirrors the actual toolbar/table dimensions; never waits artificially once results arrive.
- Empty directory: Add your first merchant. Empty filter: No merchants match, with Clear filters.
- Failed request: inline explanation and Retry. Preserve prior results if available and label them stale.
- Reduced motion: remove sliding/reveal travel and shimmer; maintain immediate state feedback.
- Mobile: sidebar becomes an accessible navigation drawer; table becomes compact merchant rows/cards showing name, domain, connection, and primary action. Hosting/check detail can be expanded.

## Preview and analytics placement

Storefront previews and detailed analytics belong in merchant overview, the next screen. Avoid loading videos, full screenshots, or per-store analytics requests on directory entry.

## Data and access boundary

- Directory reads the platform merchant registry; background jobs populate connection checks. It does not connect to every merchant database on page render.
- API enforces platform membership and action permissions. Credentials are never included in list responses.
- Every merchant/environment lookup is scoped and authorized on the server.

## Acceptance criteria

- Sagar and Anushq records have explicit, truthful connection states.
- Search, filters, keyboard navigation, external links, row menus, and pagination work without conflicting actions.
- Loading, empty, filtered-empty, stale, retry, and permission states are designed and verified.
- No layout shift from skeleton-to-data; usable narrow-screen layout and reduced-motion behavior.
- Visual comparison with Medusa-inspired reference and user review before advancing to implementation.

Next review: merchant overview, including storefront preview, setup checklist, integrations, and analytics summary.
