# Emora interactive design review

Run from the repository root:

```powershell
node design/super-admin/serve.cjs
```

Open http://127.0.0.1:5180. No installation or backend is required for the prototype.

## Review routes

- `/#directory`: merchant directory, search, sliding filters and row actions.
- `/#overview`: merchant overview, desktop/mobile capture, connections and unavailable analytics states.
- `/#onboarding`: eight-step wizard, session draft fields, validation, animated dropdown highlights.

Reference lock: Medusa Admin's restrained list/detail/create layouts, neutral surfaces and clear borders; Refero craft/motion references; user-requested sliding pills and glassmorphism. Glass is limited to shell/navigation/overlays. Work surfaces remain opaque. No heavy background imagery or blur over tables/forms.

Assets: three product images copied from the supplied Anushq repository. Sagar screenshots are actual public-site captures from https://www.sagarsportz.com on 2026-11-19. Corrected domain is sagarsportz.com. Example merchant/catalog records are labelled; no fabricated live metrics.

## Prototype boundaries

- Navigation, search/filter, wizard steps, validation, dropdowns, feature switches, storefront preview dialogs and loading demonstrations are interactive.
- State exists only in the page session; reload resets it. No durable saves, credentials, invitations, uploads, payments or deployments.
- Preview refresh is explanatory, not a capture service. Image adjustments do not export files. Video trim/export, variants, shipping and publishing remain specified future work and are labelled as such.
- Product creation, catalog editing, and media management belong exclusively to the merchant panel. They are not super-admin routes or shortcuts.

## Validation

`node design/super-admin/verify.cjs` runs Playwright with installed Edge and requires this local server running. It checked all three routes at 1440px and 390px with no horizontal overflow, search/filter, wizard validation, custom dropdown, feature choices, preview origin animation and focus restoration, loading and reduced motion. No JavaScript errors were reported. Screenshots are in `screenshots/`.

Reviewed desktop overview and mobile onboarding screenshots. Earlier product-editor captures are historical and outside the current super-admin scope. Corrected low-contrast secondary text and small labels to a 12px minimum. No design-hook suppressions were added. Full production accessibility/security/performance validation remains separate from this prototype review.

`capture.cjs` refreshes public Sagar reference screenshots and requires network access. Server binds only to loopback and serves only prototype HTML/CSS/JS/images.

Latest interaction update: dialogs expand from their triggering image/button and return to it on close or Escape, restoring focus. Reduced motion skips the transform. Onboarding now has eight steps including merchant-scoped feature choices (reviews, wishlist, customization, bulk orders, Complete the Look, video spotlight), retained only in the current session and summarized for review. These switches do not activate backend or storefront functionality. Product/media editing was removed from this super-admin prototype following the clarified ownership boundary.

## Owner access review

Open Merchant overview → Owner & access. Preview an invitation, open its sample email, then complete the sample password flow. The owner can then be deactivated/reactivated, signed out across sample sessions, or taken through reset and verified email recovery. “Preview owner sign-in” includes the self-service forgot-password interaction. Invitation expiry and failed delivery can be explored under Preview different outcomes. All owner records and event lists are separated by merchant and live only in memory.

Team security in the sidebar demonstrates authenticator enrollment using the explicitly non-working sample code 123456 and recovery-code acknowledgement. No real OTP secret, QR code, password, email or account is created. Public dashboard URLs, email transport, platform identity, real session revocation and 2FA enforcement remain production work.

Reference lock: preserve the existing Medusa-inspired shell, field/action rows, opaque settings surfaces and sliding tabs. Refero motion guidance supplies origin-based continuity and short transitions; its craft guidance supplies visible focus, labelled forms and recoverable validation. Confirmation dialogs protect account-impacting choices; lifecycle history is a simple chronological list. No merchant product tools are included.

Validation: node design/super-admin/verify-access.cjs checks invitation expiry/resend, password mismatch/acceptance, self-service recovery, owner sign-in, direct session revocation, deactivation/reactivation, password reset, verified email recovery, merchant isolation, 2FA preview, responsive overflow and reduced motion. Access screenshots are in screenshots/. The design detector reported no findings, with no suppressions added.
