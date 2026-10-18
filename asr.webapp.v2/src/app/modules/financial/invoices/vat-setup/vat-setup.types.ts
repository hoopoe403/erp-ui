import { Paging } from 'app/core/type/paging/paging.type';

/**
 * A VAT rate as returned by `financial/vatRate` (list, get, create, edit): the rate of one VAT group x VAT
 * product group pair from its effective date on, and the GL accounts its VAT is posted to - input VAT
 * (purchase) and output VAT (sales). A 0% rate has no accounts.
 */
export interface VatRate {
    vatRateId: number;
    vatGroupId: number;
    vatGroupName: string;
    vatProductGroupId: number;
    vatProductGroupName: string;
    ratePercent: number;
    effectiveDateTime: string;
    purchaseVatAccountId: number | null;
    purchaseVatAccountCode: string | null;
    purchaseVatAccountName: string | null;
    salesVatAccountId: number | null;
    salesVatAccountCode: string | null;
    salesVatAccountName: string | null;
    status: number;
    statusDescription: string;
    statusColor: string;
    registerUserName: string;
    changeDate: string;
}

/** Body of `financial/vatRate/create` and `/edit`. No `vatRateId` = create. An empty account is sent as null. */
export interface VatRateRequest {
    vatRateId?: number;
    vatGroupId: number;
    vatProductGroupId: number;
    ratePercent: number;
    effectiveDateTime: Date;
    purchaseVatAccountId: number | null;
    salesVatAccountId: number | null;
    status?: number;
}

/** Filter for `financial/vatRate/findByObj`. Blank or absent fields are not filtered on. */
export interface VatRateFilter {
    vatGroupName?: string;
    vatProductGroupName?: string;
    statusIdList?: number[];
    page?: Paging;
}

export interface VatRateListResponse {
    vatRates: VatRate[];
    page: Paging;
}
