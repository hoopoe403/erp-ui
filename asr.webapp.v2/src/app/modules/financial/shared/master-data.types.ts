/**
 * Master data as the shared lookups hand it to the invoice forms - real erp-be data,
 * reduced to what a dropdown or a default needs. The lookup services (shared/lookup)
 * map erp-be's responses onto these, so a form never depends on an endpoint's exact shape.
 */

/** A postable (leaf) account of the chart of accounts - erp-be `accountChart`. */
export interface AccountOption {
    accountId: number;
    accountCode: string;
    accountName: string;
}

export interface FixedAssetOption {
    fixedAssetId: number;
    fixedAssetCode: string;
    fixedAssetName: string;
}

export interface CostCenterOption {
    costCenterId: number;
    costCenterCode: string;
    costCenterName: string;
}

/** A VAT (business) group or VAT product group - one shape so both share a dropdown. */
export interface VatGroupOption {
    id: number;
    code: string;
    name: string;
}

/** One cell of the VAT setup: the rate for a VAT group x VAT product group pair. */
export interface VatRateEntry {
    vatGroupId: number;
    vatProductGroupId: number;
    ratePercent: number;
}

export interface CurrencyOption {
    currencyId: number;
    currencyCode: string;
    currencyName: string;
}

/**
 * A vendor with the defaults a purchase invoice takes from it. `dueDays` is erp-be's
 * vendor `dueDate`: a number of days, so the invoice's due date is posting date + dueDays.
 */
export interface VendorOption {
    vendorId: number;
    vendorCode: string;
    vendorName: string;
    currencyId: number | null;
    currencyCode: string | null;
    currencyName: string | null;
    vatGroupId: number | null;
    paymentTypeId: number | null;
    paymentTypeName: string | null;
    dueDays: number | null;
}
