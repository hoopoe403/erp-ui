// No VAT Posting Group / VAT Product Posting Group / VAT Posting Setup exists in the
// backend's real DB yet — mirrors Microsoft 365 Business Central's VAT calculation
// model (Bus. Posting Group x Product Posting Group -> rate). The data itself now
// lives on the erp-be side (PurchaseInvoiceMasterDataService,
// local-mock-data/vat-posting-groups.json etc.) — see VatLookupService. This is
// really TWO separate future DB tables plus a rate matrix, not one:
//   1. Supplier/vendor VAT type (VAT_POSTING_GROUPS) — is the vendor domestic, EU,
//      or export? Set once per vendor (Contractor.vatGroupId), defaults onto every
//      line from that invoice's vendor.
//   2. Product VAT type (VAT_PRODUCT_POSTING_GROUPS) — the tax category of the thing
//      being bought (standard/reduced/zero/exempt rate). Belongs on the Product/GL
//      account master eventually; for now it's chosen per invoice line.
// Both group sets AND the rate matrix are country-specific — the erp-be seed data is
// EU/Germany-shaped (19%/9%) as a starting default, not a hardcoded assumption. A
// real implementation needs these configurable per country (e.g. Turkey's own VAT
// groups and rates), so the eventual DB tables should key rates by country.
export interface MockVatGroup {
    id: number;
    code: string;
    name: string;
}

export interface VatPostingSetupEntry {
    vatPostingGroupId: number;
    vatProductPostingGroupId: number;
    ratePercent: number;
}
