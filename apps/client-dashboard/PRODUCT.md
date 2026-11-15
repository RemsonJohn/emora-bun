# Emora Admin

## Product direction

A Shopify-inspired merchant back office for independent Indian businesses including Sagar Sports, Anushq and Raccoonflax. Daily work should require no developer. Products, orders, inventory and customers share one sidebar, searchable lists and a consistent save bar.

This is the client dashboard. The platform-owner dashboard is deferred.

## Confirmed architecture changes

The supplied brief originally specified Vendure. The user explicitly chose Medusa + Bun instead. Use Medusa REST Admin APIs, not Vendure GraphQL or its React Dashboard. Each business receives a separate Medusa deployment and PostgreSQL database. Medusa sales channels are not an isolation boundary for unrelated businesses.

## First implementation

- Real Medusa administrator login with a per-tab JWT session.
- Home and analytics overview: captured INR sales, order count, AOV, product count, daily sales chart, fulfilment/payment tasks, recent orders.
- Metrics currently cover the latest 100 loaded orders, explicitly labelled. They are not complete accounting reports or all-time totals. Conversion rate, comparisons and returning-customer rate require further data work.
- Product list with search, active/draft filters, pagination, thumbnail, collection and variants.
- Product creation as a draft; edit title, description, handle and publication status. Sticky unsaved-changes bar and discard protection.
- Searchable orders and customers with details and pagination.
- Collections and promotion lists.
- Inventory variant/SKU list and links to native inventory controls.
- Global search across products, orders and customers.
- Advanced operations link to the existing Medusa Admin. They are not reimplemented by this initial release.
- Clearly labelled, optional sample-data mode. Failed live API requests never silently substitute sample data.
- INR with Indian grouping, IST dates, keyboard focus, modal focus containment, reduced motion and mobile navigation.

## Target requirements carried forward

### Products and catalogue — P0

Under-three-minute creation with five cropped photos and three variants. Up to three options; variant prices, compare-at prices, cost, SKU, barcode, stock, weight, images. GST rates and HSN, shipping dimensions, brand/type/tags, configurable specifications, SEO, duplicate action. Image crop presets free/1:1/4:5/3:4, reorder and alt text; max 15 images. Optional MP4/WebM clip <=5 seconds and <=10 MB. Shopify-compatible CSV import. Manual collections and inline inventory adjustment with reason logs.

### Orders — P0

Fulfil selected items with courier/AWB, send shipping email, full/partial refunds with restock, cancellation with reason, internal notes and actor timeline, GST invoice PDF and packing slip. Server recomputes prices/discounts/taxes. Only verified Razorpay webhooks change paid state; browser callbacks cannot settle payment.

### Customers, discounts and settings — P0

Customer contacts, addresses, order history, tags, notes and lifetime value. Percentage/fixed/free-shipping promotions with eligibility and usage limits. Policy pages needed for payment onboarding. Store contact/address/GSTIN/invoice prefix, staff invitations and permission enforcement, encrypted merchant payment credentials, shipping zones/rates and origin-state/inclusive-tax settings.

### Follow-up — P1/P2

R2 originals and preset WebP/AVIF derivatives; browser media crop/trim. Razorpay integration and verified refund webhooks. Nodemailer/Brevo notifications. Full server-side reports and CSV, GST summary, saved views, automated collections, product-spec editor, draft orders/payment links, recovery email, banners/clips/menus, 2FA, audit UI, privacy anonymisation. Returns, customer segments, gift cards, BXGY, multiwarehouse and shipping aggregation later.

## Security and launch gates

Enforce permissions and feature flags on the backend, never solely by hiding navigation. Target a 12-hour session with server enforcement, rate-limited login, encrypted secrets, mutation audit retention of one year and encrypted off-server backups with restore verification. These are launch requirements, not claims about this initial frontend.

Before production: configure Razorpay/R2/Brevo, implement missing P0 workflows, enforce and test staff permissions, verify business isolation, verify GST invoices, test payments/refunds end-to-end, load-test 5k products/50k orders and validate Bun production server/worker behaviour.

## Open decisions

COD at launch; manual AWB vs shipping aggregator; staff seats; financial-year invoice numbering; merchant billing UI. No defaults are assumed for legal or tax treatment.
