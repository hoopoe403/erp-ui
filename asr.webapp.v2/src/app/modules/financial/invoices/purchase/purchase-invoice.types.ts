import { Paging } from "app/core/type/paging/paging.type";
import { BaseModel } from "app/core/type/base/BaseModel";
export class PurchaseInvoice extends BaseModel {
    purchaseInvoiceId: number;
    invoiceNumber: string;
    subTotal: number;
    discount: number;
    total: number;
    currencyId: number;
    currencyName: string;
    currencyAbbreviation: string;
    creditorId: number;
    creditorName: string;
    invoiceDate: Date;
    status: number;
    statusDescription: string;
    statusColor: string;
    statusIdList: Array<number>;
    totalFrom: number;
    totalTo: number;
    language: string;
    clientIP: string;
    registerUserID: number;
    registerUserName: string;
    localChangeDate: string;
    localChangeTime: string;
    changeDate: string;
    purchaseInvoiceDetailList: Array<PurchaseInvoiceDetail>;
    page: Paging;

    // --- New fields (UI-only for now, no backend column yet — see CLAUDE.md / plan) ---
    creditorCode: string; // vendor/supplier code — display only until backend returns it
    vendorInvoiceNumber: string;
    postingDate: string;
    dueDate: string;
    reviewedByUserId: number | null;
    reviewedByUserName: string | null;
    // Defaults from the selected vendor's Contractor.paymentTypeId (see
    // onVendorSelected()) but stays editable per invoice.
    paymentTypeId: number | null;
    paymentTypeName: string | null;
    // "net"/"gross" follow standard invoicing/VAT convention (net = excluding
    // VAT, gross = including VAT) — sum of each line's netAmount/VAT/grossAmount.
    totalNetAmount: number;
    totalVatAmount: number;
    totalGrossAmount: number;
}

/**
 * Three prices, in order of calculation — "net"/"gross" follow standard
 * invoicing/VAT convention (net = excluding VAT, gross = including VAT), not
 * the salary sense:
 * - unitPrice: the price of one unitId of this line.
 * - unitPrice x quantity = netAmount: the line amount before VAT (and before
 *   discount, once a per-line discount field exists).
 * - grossAmount = netAmount + VAT, looked up from vatPostingGroupId x
 *   vatProductPostingGroupId — the final amount owed for this line.
 */
export class PurchaseInvoiceDetail extends BaseModel {
    purchaseInvoiceDetailId: number;
    purchaseInvoiceId: number;
    invoiceNumber: string;
    rowNumber: number;
    unitPrice: number;
    quantity: number;
    unitId: number | null;
    unitCode: string;
    unitName: string;
    netAmount: number;
    itemDesc: string;
    status: number;
    statusDescription: string;
    statusColor: string;
    totalFrom: number;
    totalTo: number;
    financialCategoryIdList: Array<number>;
    profitLossCategoryIdList: Array<number>;
    creditorTypeIdList: Array<number>;
    page: Paging;

    // --- New fields (UI-only for now, no backend column yet — see CLAUDE.md / plan) ---
    lineType: 'GL' | 'FA';
    accountId: number | null;
    accountCode: string;
    accountName: string;
    fixedAssetId: number | null;
    fixedAssetCode: string;
    fixedAssetName: string;
    costCenterId: number | null;
    costCenterCode: string;
    costCenterName: string;
    vatPostingGroupId: number | null;
    vatProductPostingGroupId: number | null;
    grossAmount: number;
}

/** One page of the list, as erp-be returns it from findByObj / findByObjInOnInit. */
export interface PurchaseInvoiceList {
    purchaseInvoices: PurchaseInvoice[];
    page: Paging;
}
