# Dashboard components

## Management philosophy

Emora owns its dashboard components and visual styling. Use a shared component when the same interaction appears in multiple places or when a single implementation protects an important behavior such as keyboard access. Keep business rules, permission checks and API calls in feature code and on the backend, rather than hiding them inside visual primitives.

Start with accessible, established primitives for complex interactions. The dashboard uses Radix Select for its dropdown behavior, Lucide for icons, and the Medusa JavaScript SDK for backend communication. Radix is not a complete dashboard design system here: Emora owns the dropdown's API and appearance. Add other libraries only when their behavior or maintenance value justifies their cost, and avoid introducing a second control for the same interaction without a clear need.

Components should support keyboard and screen-reader use, visible focus, disabled and error states, responsive layouts and reduced motion where relevant. Test behavior at the shared component's integration points, including forms and dialogs. Permission-sensitive controls must still be enforced by the backend. Avoid changing global styles to fix one component when a scoped style will do.

## Current structure

```text
src/
  app/layout/             Dashboard header and sidebar
  lib/
    medusa.ts             Medusa SDK, API helper, shared data types and demo data
    ui/                   Reusable dropdown, table, layout, pagination and display controls
  routes/
    analytics/            Analytics page, sales chart and storefront report
    auth/                 Login and merchant registration
    billing/              Billing and invoice view
    collections/          Collections page
    content/              Content page
    customers/            Customer list and detail
    discounts/            Promotions page
    home/                 Home page
    inventory/            Inventory list
    orders/               Orders list and detail
    products/             Product list and editor
    search/               Global search dialog
    settings/             Settings, staff and invitations
    shared/               Route compositions shared by several pages
    routes.ts             Page names, navigation entries and URL initialisation
  App.tsx                 Session, navigation, data loading and route composition
  App.css                 Dashboard shell and shared feature styles
  index.css               Global typography, base controls and focus styles
  main.tsx                Application entry and registration entry point
```

`lib/ui` contains controls shared across features; route folders own their domain-specific pages and components. `routes/shared` composes pages that share dashboard data and list behaviour. The current app still keeps session and data orchestration in `App.tsx`, uses `?page=` for dashboard navigation, and shares many styles through `App.css`. These folders do not introduce a new routing framework or new URLs. Extract more only when there is a concrete reuse or maintenance benefit.

## Dropdown

Use `Dropdown` for a single value selected from a known list. Supply `label`, controlled `value`, `options` and `onValueChange`; use `placeholder`, `required`, `name` and `disabled` when needed. Its Radix primitive handles keyboard navigation, typeahead, selection and focus. Its menu is mounted inside a native dialog when the trigger is in one, so it remains interactive within the dialog's top layer.

Use native inputs for text and checkboxes. A search field, multi-select or actions menu has different semantics and should not be forced into this component. Add a separate primitive when that behavior is needed and tested.
