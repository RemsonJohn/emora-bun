# Merchant owner access

## Intended flow

1. Super admin records the merchant's business details and owner email. An incomplete record is a draft and does not send an invitation.
2. Connect the merchant's isolated Medusa backend and merchant dashboard. Verify the dashboard URL, merchant mapping and email delivery configuration before inviting the owner. The storefront may still be in setup; it need not be live.
3. Completing merchant creation with owner access enabled creates a store-scoped invitation and queues a welcome email. Store the owner role on the server; never trust a role or merchant identifier supplied by the registration browser.
4. Email identifies the business and includes a time-limited, single-use Set password link to the merchant dashboard. Do not email a password. Display the actual invitation expiry.
5. Owner follows the link, confirms their name, chooses and confirms a password, and accepts the invitation. The invited email is fixed. After successful acceptance, direct them to merchant sign-in.
6. Subsequent access uses their merchant dashboard URL, email and password. The owner manages that merchant's products, media and orders, with no platform super-admin privileges.

## Operational states

Show Not invited, Queued, Sent, Delivery failed, Expired and Accepted accurately. Provider acceptance is not proof of delivery. Resending or correcting an email must invalidate prior outstanding access as appropriate. Retrying delivery must not create duplicate accounts. Keep an audit record without logging tokens or passwords. Provide password recovery separately from invitations.

## Current implementation boundary

The client dashboard already has invitation link creation in `src/routes/settings/SellerInvites.tsx` and registration in `src/routes/auth/SellerRegistration.tsx`. Registration is routed at `/register`. Existing links are shared manually. Automatic welcome email delivery and super-admin orchestration are not implemented by the visual prototype. No invitation or password was created as part of documenting this flow.

Use password-setting invitations for initial access. A local test invitation requires the intended merchant/backend and owner email; the existing local platform operator email must not be assumed to be a merchant owner. Production delivery also requires a public dashboard URL and configured sender/provider.

## Interactive review implementation

The user chose prototype-first delivery. Owner & access now appears in the merchant overview of design/super-admin, and Team security previews Emora admin 2FA. Owner invitations, sample password setup, self-service forgot password, administrator-assisted reset, activation/deactivation, device sign-out, verified email recovery and per-merchant histories are interactive in memory. Production enforcement and automatic delivery remain unimplemented. No real account access is modified.
