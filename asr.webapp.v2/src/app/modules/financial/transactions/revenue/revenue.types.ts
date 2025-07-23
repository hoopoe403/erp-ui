import { Paging } from "app/core/type/paging/paging.type";

export class Revenue {
    revenueId: number;
    paymentTypeId: number;
    paymentTypeName: string;
    payerId: number;
    payerName: string;
    payerTypeId: number;
    payerTypeName: string;
    payerFinancialResourceId: number;
    payerFinancialResourceName: string;
    recipientId: number;
    recipientName: string;
    recipientTypeId: number;
    recipientTypeName: string;
    recipientFinancialResourceId: number;
    recipientFinancialResourceName: string;
    amount: number;
    financialCategoryId: number;
    financialCategoryName: string;
    chequeNumber: string;
    chequeTypeId: number;
    chequeTypeName: string;
    revenueLocalDate: string;
    revenueLocalDateClean: string;
    bankId: number;
    bankName: string;
    bankUrl: string;
    currencyId: number;
    currencyAbbreviation: string;
    billId: string;
    paymentId: string;
    trackingId: string;
    description: string;
    status: number;
    statusDescription: string;
    statusColor: string;
    language: string;
    clientIP: string;
    registerUserID: number;
    registerUserName: string;
    localChangeDate: string;
    localChangeTime: string;
    updateLocalDate: string;
    updateLocalTime: string;
    changeDate: string;
    statusIdList: Array<number>;
    payerIdList: Array<number>;
    paymentTypeIdList: Array<number>;
    page: Paging;
    amountFrom: number;
    amountTo: number;
    revenueLocalDateFrom: string;
    revenueLocalDateTo: string;

}

export class FinancialResourceTypePaymentType {
    financialResourceTypePaymentTypeId: number;
    financialResourceTypeId: number;
    financialResourceTypeName: string;
    paymentTypeId: number;
    paymentTypeName: string;
    status: number;
}

export class Bank {
    bankId: number;
    bankCode: string;
    bankName: string;
    status: number;
    url: string;
}
export interface RevenuePagination {
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}