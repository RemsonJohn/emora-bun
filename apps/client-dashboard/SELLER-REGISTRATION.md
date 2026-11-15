# Merchant registration

An existing store administrator signs in to Emora, opens Settings → Staff & permissions, and creates an invitation link for the merchant's email and selected role. Share the link privately. The recipient opens it, sets their name and password, and then signs in. Invitation links are single-use and expire according to the Medusa backend's invitation settings. The link is removed from the address bar on opening; reopen the original link after a refresh. Invitations created before role selection was introduced must be replaced.

The three roles are Admin, Inventory manager and Customer support. Full administrators can change individual permissions from the staff window; changing the base role resets overrides. Staff management requires a full Admin, and administrators cannot change their own access. The API denies restricted users unreviewed routes and checks grants on every request. Staff deletion and secret admin API keys are currently blocked by the guard.

An invited merchant is a user of the current backend. Staff roles are not tenant isolation and do not create a separate store or database. Use a separate store/backend for each independent merchant.

Inventory managers can record an order review and request order completion when permitted. Payment capture is disabled for all users until the Razorpay integration and verified webhook are implemented. A review records an actor and time; it does not pay, fulfil or automatically complete the order.

The form creates a link for manual sharing; it does not itself send email. Any Medusa notification subscribers configured on the backend may have their own behavior. Invitation secrets are bearer credentials; do not put them in public logs or share them with unintended recipients. Configure HTTPS, rate limiting, and an appropriate access policy before production use.

For a separately hosted dashboard, its deployment must serve `/register` as the SPA and proxy or allow CORS to the backend's `/auth/seller/invites/validate`, `/auth`, and `/admin` routes. The generated link uses the dashboard's current origin. New deployments must run the module migrations and perform the one-time existing-user bootstrap before starting the guarded API. Test the full flow against the deployed backend before inviting a merchant.
