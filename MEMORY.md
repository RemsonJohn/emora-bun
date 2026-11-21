# Project memory

Updated: 2026-11-19

- The active assistant model at this update is `gpt-6-astra`. This records the session state; it does not configure or pin future chats to a model.
- Keep React + Vite for the custom admin dashboard (`apps/client-dashboard`, port 5174), Next.js for the storefronts (ports 8000 and 8001), and Medusa for the shared backend (port 9000).
- The custom dashboard and built-in Medusa Admin (`http://localhost:9000/app`) use the same backend and database. The custom dashboard serves tailored team workflows; Medusa Admin provides broader commerce management. Backend permissions apply to both.
- Start the custom dashboard with its own Vite 8 installation: from `apps/client-dashboard`, run `node node_modules/vite/bin/vite.js`. The root Vite 7 causes transform failures and a blank page.
- Local setup and startup instructions are in `SETUP.md`. Bun 1.4.4 is the authoritative package manager. The isolated local PostgreSQL database uses port 5433.
- Staff invitations require explicit `emora_role` metadata. The standard Medusa CLI invitation alone omits this and is rejected by the custom acceptance route.
- The user requests planning before implementation. Consolidated requirements and pending decisions are in `PLATFORM-PLAN.md`.
- Planning package: `SUPER-ADMIN-SCREEN-01.md` through `SUPER-ADMIN-SCREEN-03.md`, `SCREEN-SPECIFICATIONS.md` (remaining screens), and `IMPLEMENTATION-ROADMAP.md`. These are written specifications, not implemented features or approved rendered designs.
- Interactive visual review now exists at `design/super-admin/` (local port 5180): directory, overview and onboarding. It uses sample session-only data, restrained glass navigation, sliding menu/filter pills and dropdown highlights. It is not the production super admin. Correct Sagar domain: `sagarsportz.com`.
- Multi-merchant is the priority: Sagar and Anushq are independent businesses; Sagar is the pilot. Actual storefront sources are `C:/Projects/claude/sagarsportz` and `C:/Projects/claude/anushq`. Keep their existing interfaces and hosting initially.
- Proposed Hostinger KVM 2 has not been purchased. Payment policy awaits client discussion. No live deployment or storefront migration is authorized yet.

Confirmed ownership boundary (2026-11-19): merchants exclusively manage products, catalog, and media in their merchant panel. Super admin manages merchant onboarding, feature availability, deployment connections, previews, analytics and platform administration. No product/media editor or shortcut belongs in the super-admin navigation. Onboarding feature availability does not replace merchant-level feature configuration or content management.

Merchant owner access: collect owner email during onboarding; after the merchant backend/dashboard are ready, send a store-scoped password-setting invitation. Owner chooses their own password and signs into the merchant panel. Do not email temporary passwords. Existing dashboard supports manual invitation links and registration; automated email delivery remains to be implemented. See MERCHANT-OWNER-ACCESS.md.

Owner & access: user explicitly chose interactive prototype first (not production authentication). Implemented under merchant overview, plus Team security in the sidebar. Review-only invitations, recovery, activation/deactivation, sessions, per-merchant event histories and 2FA enrollment previews. No backend/auth/email changes were made.
