import { Paging } from "app/core/type/paging/paging.type";
import { BaseModel } from "app/core/type/base/BaseModel";
export class Expense extends BaseModel {
    expenseId: number;
    amount: number;
    fee: number;
    recipientId: number;
    recipientName: string;
    recipientTypeId: number;
    recipientTypeName: string;
    recipientFinancialResourceId: number;
    recipientFinancialResourceName: string;
    payerId: number;
    payerName: string;
    payerTypeId: number;
    payerTypeName: string;
    payerFinancialResourceId: number;
    payerFinancialResourceName: string;
    payerFinancialResourceTypeId: number;
    payerBankAccountTypeId: number;
    payerFinancialResourceDetailId: number;
    payerIdList: Array<number>;
    currencyId: number;
    currencyAbbreviation: string;
    paymentTypeId: number;
    paymentTypeName: string;
    paymentTypeIdList: Array<number>;
    chequeId: number;
    chequeTransactionId: number;
    chequeNumber: string;
    chequeTypeId: number;
    financialTransactionId: number;
    bankId: number;
    bankName: string;
    bankUrl: string;
    expenseLocalDate: string;
    expenseDate: string;
    expenseLocalDateClean: string;
    financialCategoryId: number;
    financialCategoryName: string;
    financialCategoryCode: string;
    billId: string;
    paymentId: string;
    trackingId: string;
    description: string;
    payerBudgetId: number;
    recipientBudgetId: number;
    status: number;
    statusDescription: string;
    statusColor: string;
    amountFrom: number;
    amountTo: number;
    expenseLocalDateFrom: string;
    expenseLocalDateTo: string;
    statusIdList: Array<number>;
    page: Paging;

}



export class FinancialResourceTypePaymentType {
    financialResourceTypePaymentTypeId: number;
    financialResourceTypeId: number;
    financialResourceTypeName: string;
    paymentTypeId: number;
    paymentTypeName: string;
    status: number;
}


export interface ExpensePagination {
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}