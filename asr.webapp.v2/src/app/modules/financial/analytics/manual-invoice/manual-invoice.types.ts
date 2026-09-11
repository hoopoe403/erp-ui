import { Paging } from "app/core/type/paging/paging.type";
import { BaseModel } from "app/core/type/base/BaseModel";

// ManualInvoice/ManualInvoiceDetail used to be aliased from the Purchase Invoice
// module's types (../../invoices/purchase/purchase-invoice.types) since the two
// were identical at the time. Purchase Invoice has since diverged into its own
// separately-evolving module (different backend, different fields) — these are
// now a standalone copy of that original shared shape so this report keeps
// working regardless of what Purchase Invoice's types change to.
export class ManualInvoice extends BaseModel {
    manualInvoiceId: number;
    invoiceNumber: string;
    subTotal: number;
    discount: number;
    total: number;
    currencyId: number;
    currencyName: string;
    currencyAbbreviation: string;
    financialCategoryId: number;
    financialCategoryName: string;
    financialCategoryCode: string;
    profitLossCategoryId: number;
    profitLossCategoryName: string;
    creditorId: number;
    creditorName: string;
    creditorTypeId: number;
    creditorTypeName: string;
    debtorId: number;
    debtorName: string;
    debtorTypeId: number;
    debtorTypeName: string;
    title: string;
    invoiceDescription: string;
    invoiceDate: Date;
    invoiceLocalDate: string;
    status: number;
    statusDescription: string;
    statusColor: string;
    statusIdList: Array<number>;
    creditorTypeIdList: Array<number>;
    totalFrom: number;
    totalTo: number;
    localDateFrom: string;
    localDateTo: string;
    language: string;
    clientIP: string;
    registerUserID: number;
    registerUserName: string;
    localChangeDate: string;
    localChangeTime: string;
    changeDate: string;
    financialCategoryIdList: Array<number>;
    profitLossCategoryIdList: Array<number>;
    manualInvoiceDetailList: Array<ManualInvoiceDetail>;
    page: Paging;
}

export class ManualInvoiceDetail extends BaseModel {
    manualInvoiceDetailId: number;
    manualInvoiceId: number;
    invoiceNumber: string;
    rowNumber: number;
    unitPrice: number;
    measure: number;
    itemTypeName: string;
    total: number;
    creditorName: string;
    itemDesc: string;
    status: number;
    statusDescription: string;
    statusColor: string;
    totalFrom: number;
    totalTo: number;
    financialCategoryIdList: Array<number>;
    profitLossCategoryIdList: Array<number>;
    creditorTypeIdList: Array<number>;
    localDateFrom: string;
    localDateTo: string;
    page: Paging;
}

export class ManualInvoiceAccumulative extends BaseModel {
    reportMode: number;
    financialCategoryId: number;
    financialCategoryName: string;
    profitLossCategoryId: number;
    profitLossCategoryName: string;
    invoiceLocalDate: string;
    total: number;
    totalFrom: number;
    totalTo: number;
    localDateFrom: string;
    localDateTo: string;
    financialCategoryIdList: Array<number>;
    profitLossCategoryIdList: Array<number>;
    page: Paging;

}



export class ManualInvoiceProfitLossCategory extends BaseModel {
    manualInvoiceProfitLossCategoryId: number;
    profitLossCategoryId: number;
    profitLossCategoryCode: number;
    profitLossCategoryName: number;
    status: number;
    statusDescription: string;
    statusColor: string;
}

export class advancedSearchHistory {
    reportMode: number;
    obj: any;
    isSelected: boolean;
    scrollPosition: number;
}