// Owner type ids used across the financial modules (see e.g. list.component.html's
// Issuer Type filter in the purchase invoice module). Vendor = Creditor restricted
// to the Contractor owner type — this system's Contractor entity is the mislabeled
// Supplier (see repo CLAUDE.md).
export const VENDOR_OWNER_TYPE_ID = 1000613; // Contractor
export const PERSONNEL_OWNER_TYPE_ID = 1000614; // Personnel

// Fallback currency when a selected vendor has none set yet (existing contractors
// predate the Currency field — see CLAUDE.md / plan).
export const DEFAULT_CURRENCY_ABBREVIATION = 'EUR';
export const DEFAULT_CURRENCY_NAME = 'Euro';

// Purchase Invoice workflow statuses — must match erp-be's
// LocalMockPurchaseInvoiceRepository.STATUS_* constants exactly.
export const PURCHASE_INVOICE_STATUS_DRAFT = 1000001;
export const PURCHASE_INVOICE_STATUS_PENDING_REVIEW = 1000002;
export const PURCHASE_INVOICE_STATUS_POSTED = 1000003;
