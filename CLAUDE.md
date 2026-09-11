# ERP Frontend (erp-ui)

Angular frontend for the ERP system, built on the **Fuse Angular Admin Template**
(`@fuse/starter` v13.3.1, ThemeForest, Angular 13.3, Angular Material 12.1.2).
App source lives under `asr.webapp.v2/`.

## Related repos

- **Backend**: `/Users/yab/ML/ERP/erp-be` — Spring Boot (Maven).
- **Database**: Oracle. Schema reference/export at `/Users/yab/ML/ERP/TableScript.txt`.
- **Expense management app** (separate product, Rydoo-inspired, being built standalone
  for now): `/Users/yab/ML/ERP/n8nflows/invoice-ocr-app` — React/TS frontend,
  Node/Express + Prisma/Postgres backend, deployed on Vercel/Render/Neon/Cloudflare R2.
  Plan is to eventually integrate it with this ERP: approved expenses/mileage/invoices
  get pushed into the ERP via an API once one exists. Keep this in mind when designing
  ERP-side invoice/financial features — avoid decisions that would make that later
  integration harder.

## Conventions for adding new features

Follow the module pattern already established in the codebase — do not introduce a
different structure. A typical feature module (see `configuration/contractor/` or
`financial/invoices/manual/` for reference) has:

- `<feature>.module.ts` + routing
- `<feature>.service.ts` — calls REST APIs, returns typed `OpResult`/`Paging` wrappers
- `<feature>.types.ts` — model interfaces
- `list/` — list/table view
- `details/` — create/edit form (reactive forms via `FormBuilder`/`FormGroup`)

Other established patterns to reuse rather than reinvent:
- RxJS `forkJoin` for parallel loads, `valueChanges` for autocomplete/filter fields.
- Shared components used across entities — e.g. `<app-bank-account>` is used by both
  Contractor and Customer detail forms. Before building a new UI piece, check whether
  an existing shared component already does it, and reuse it instead of duplicating.
- Angular Material components for UI, matching the Fuse theme.

General bar: clean code, Angular 13+ best practices, DRY. Don't repeat logic that
already exists in a service/component elsewhere — extend or reuse it. Keep components
focused (list vs. details split, not monolithic components). Match existing naming and
folder conventions in a given module rather than introducing new ones, unless asked to.

## Known naming debt

`configuration/contractor/` is actually used for **suppliers** (parties you owe money
to / receive purchase invoices from) — "Contractor" is the wrong name historically used
in this system. There's already an empty `configuration/supplier/` folder reserved for
the eventual rename. Don't rename unprompted — it touches a lot of surface area — but
be aware of this when working on supplier/purchase-invoice features so naming decisions
in new code aren't built on the wrong term without discussion.
