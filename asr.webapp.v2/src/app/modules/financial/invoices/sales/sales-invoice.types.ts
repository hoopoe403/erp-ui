import { Paging } from "app/core/type/paging/paging.type";
import { BaseModel } from "app/core/type/base/BaseModel";

/** Accounts Receivable mirror of PurchaseInvoice (purchase-invoice.types.ts) -
 *  same shape, customer instead of vendor. */
export class SalesInvoice extends BaseModel {
    salesInvoiceId: number;
    invoiceNumber: string;
    subTotal: number;
    discount: number;
    total: number;
    currencyId: number;
    currencyName: string;
    currencyAbbreviation: string;
    customerId: number;
    customerName: string;
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
    salesInvoiceDetailList: Array<SalesInvoiceDetail>;
    page: Paging;

    customerCode: string; // display only, mirrors creditorCode
    customerReferenceNumber: string; // the customer's own PO/reference number
    postingDate: string;
    dueDate: string;
    reviewedByUserId: number | null;
    reviewedByUserName: string | null;
    // Defaults from the selected customer's payment type, same pattern as Purchase
    // Invoice's vendor default, but stays editable per invoice.
    paymentTypeId: number | null;
    paymentTypeName: string | null;
    // "net"/"gross" follow standard invoicing/VAT convention (net = excluding
    // VAT, gross = including VAT) — sum of each line's netAmount/VAT/grossAmount.
    totalNetAmount: number;
    totalVatAmount: number;
    totalGrossAmount: number;
}

/**
 * Three prices, in order of calculation, same convention as
 * PurchaseInvoiceDetail:
 * - unitPrice: the price of one unitId of this line.
 * - unitPrice x quantity = netAmount: the line amount before VAT.
 * - grossAmount = netAmount + VAT, looked up from vatPostingGroupId x
 *   vatProductPostingGroupId — the final amount owed for this line.
 */
export class SalesInvoiceDetail extends BaseModel {
    salesInvoiceDetailId: number;
    salesInvoiceId: number;
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

    // 'GL' (General Ledger, e.g. a service or misc-revenue line) or 'IT'
    // (an inventory Item) - deliberately not 'FA' (Fixed Asset) like Purchase
    // Invoice: a sales invoice sells goods/services, it doesn't dispose of a
    // fixed asset (a distinct transaction with its own gain/loss accounting).
    lineType: 'GL' | 'IT';
    accountId: number | null;
    accountCode: string;
    accountName: string;
    itemId: number | null;
    itemCode: string;
    itemName: string;
    costCenterId: number | null;
    costCenterCode: string;
    costCenterName: string;
    vatPostingGroupId: number | null;
    vatProductPostingGroupId: number | null;
    grossAmount: number;
}

/** One page of the list, as erp-be returns it from findByObj / findByObjInOnInit. */
export interface SalesInvoiceList {
    salesInvoices: SalesInvoice[];
    page: Paging;
}
