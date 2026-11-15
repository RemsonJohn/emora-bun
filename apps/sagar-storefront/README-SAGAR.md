# Sagar Sports storefront

An independent Next.js storefront in the Medusa Bun workspace. The homepage reads products, region-specific prices, images and collections from its configured Medusa store. Product details, cart, checkout and account use the existing starter's Medusa integrations. Product and price requests are uncached; completed purchases and inventory remain controlled by Medusa.

## Local development

1. Run PostgreSQL, Redis and the Medusa Bun backend on port 9000.
2. Set the values from `.env.example` in `.env.local`. The publishable key is a public storefront key from Medusa, not an admin API key. For the local development copy, the existing storefront's public backend URL and publishable key have been reused.
3. Run `bun run dev` in this directory, then visit http://localhost:8001.
4. Set `NEXT_PUBLIC_STORE_CONTACT_EMAIL` to a real address to enable the custom teamwear enquiry link.

The current local Medusa database may still contain starter products and non-INR regions. This app displays the backend's actual data; it does not seed or invent Sagar Sports catalogue data. Add a Medusa region including India and INR prices, assign the correct sales channel to the publishable key, and add real products and images before launch. The homepage campaign photograph is AI-generated illustrative artwork, not a catalogue product image.

## Production requirements

- Provision Sagar Sports' own backend/database and public key. Set the production backend and canonical storefront URLs, contact address and exact CORS origins. Use HTTPS.
- Replace starter placeholder privacy, terms, shipping and returns text with the merchant's approved policies.
- Configure and test a real payment provider, shipping, tax, fulfilment, emails and inventory. The local project does not establish those production integrations.
- Custom jersey artwork, names, numbers, quotations and approval workflows are not implemented. The optional email link is an enquiry only.
- Configure product media storage and its permitted image domains; ensure backups, monitoring and consent language fit the deployment.
- Run `bun run build` with the intended backend configuration. Type errors are not ignored. The build connects to Medusa for relevant pages.

The storefront inherits the consent-based analytics tracker. It collects only the allowed page category and a random session identifier after opt-in, if the backend analytics routes and Redis are available.
