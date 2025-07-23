import { Paging } from "app/core/type/paging/paging.type";
import { BaseModel } from "app/core/type/base/BaseModel";
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