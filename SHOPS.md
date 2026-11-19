# Running a shop's backend

Each shop (merchant) runs this same backend code with its own database and
settings. Nothing is shared between shops: products, customers, carts and
orders live in that shop's database only.

| Shop | Env file | Database | Backend | Storefront (local) |
| --- | --- | --- | --- | --- |
| Sagar Sportz | `apps/backend/.env.sagar` | `emora_sagar` | http://localhost:9000 | `sagarsportz` repo, port 3001 |
| Anushq | `apps/backend/.env.anushq` | `emora_anushq` | http://localhost:9001 | `anushq` repo (`apps/web`), port 3002 |

Commands run from `apps/backend`:

```bash
bun run shop <shop> <medusa command>
```

`scripts/shop.mjs` loads `.env.<shop>` (its values win over the shell and over
`.env`) and runs the Medusa CLI. It also runs ts-node without SWC, because
Windows Smart App Control blocks SWC's unsigned binary.

## A new shop

1. Copy `apps/backend/.env.shop.template` to `apps/backend/.env.<shop>` and fill
   it in: database URL, port, CORS origins, random `JWT_SECRET`,
   `COOKIE_SECRET` and `STOREFRONT_SHARED_SECRET`, shop name, warehouse address,
   delivery charge and free-delivery threshold. Never commit this file.
2. `bun run shop <shop> db:create --db emora_<shop>`. Note: Medusa's `db:create`
   also writes a `DB_NAME=` line into `apps/backend/.env`; remove it afterwards.
3. `bun run shop <shop> db:migrate`. The first migration sets the store up for
   India (INR, GST-inclusive prices, India and International regions, delivery
   options, cash on delivery and pay later) and prints the publishable key.
4. Export the catalogue from the storefront repo
   (`node scripts/export-catalogue.mjs`) and import it:
   `bun run shop <shop> exec ./src/scripts/import-catalogue.ts <path>/catalogue.json`.
   Running the import again skips products that already exist.
5. Create the first staff user and run the backend:
   `bun run shop <shop> develop`.
6. In the storefront's `.env.local`, set `MEDUSA_BACKEND_URL`,
   `MEDUSA_PUBLISHABLE_KEY` and the same `STOREFRONT_SHARED_SECRET`.

## Razorpay (test mode)

1. Put the shop's Razorpay **test** keys in its env file: `RAZORPAY_KEY_ID`,
   `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` (from the webhook you
   create in the Razorpay dashboard pointing at
   `<backend URL>/hooks/payment/razorpay_razorpay`, events `payment.authorized`,
   `payment.captured`, `payment.failed`, `order.paid`).
2. Restart the backend, then offer Razorpay in India:
   `bun run shop <shop> exec ./src/scripts/enable-razorpay.ts`.

Payment signatures and webhooks are checked on the server with the key secret
and webhook secret. The storefront only ever receives the public key id.

## Shop rules kept in the backend

- **Delivery:** Medusa Admin > Settings > Locations & Shipping. The India
  option has a flat price and a free price for `item_total` at or above the
  threshold. International delivery is quoted by the store (price 0, pay later).
- **Customised products (Sagar):** product metadata `customizable: true`.
  Orders with customised lines get `metadata.emora_review_required` and are
  approved with `POST /admin/orders/:id/approve`. Set
  `requires_approval: false` on a product to skip the review.
- **Complete the Look (Anushq):** kurti metadata `complete_the_look` lists the
  matching pieces (product handles); `set_only: true` marks pieces sold only in
  a look. The discount is off by default: store metadata
  `ctl_discount_enabled` (`"true"`), `ctl_discount_type` (`percentage` or
  `fixed`), `ctl_discount_value`, plus `ctl_discount_enabled: true` on each
  kurti that may be discounted. Discounted pieces do not combine with
  promotion codes.
- **Bulk enquiries:** `GET /admin/enquiries`, `POST /admin/enquiries/:id`
  (status `new`, `quoted`, `won`, `lost`, and staff notes).
- **Rate limits:** customer sign-in and sign-up, checkout, looks and enquiries,
  per shopper IP. Set `REDIS_URL` (a different database number per shop) so
  limits are shared across processes.
