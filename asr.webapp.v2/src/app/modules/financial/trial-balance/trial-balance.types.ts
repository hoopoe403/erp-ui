import { Paging } from "app/core/type/paging/paging.type";
import { BaseModel } from "app/core/type/base/BaseModel";
export class TrialBalance extends BaseModel {
    trialBalanceId: number;
    ownerId: number;
    ownerName: string;
    ownerTypeId: number;
    ownerTypeName: string;
    debit: number;
    credit: number;
    debitBalance: number;
    creditBalance: number;
    debitFrom: number;
    debitTo: number;
    creditFrom: number;
    creditTo: number;
    debitBalanceFrom: number;
    debitBalanceTo: number;
    creditBalanceFrom: number;
    creditBalanceTo: number;
    currencyId: number;
    currencyName: string;
    currencyAbbreviation: string;
    status: number;
    statusDescription: string;
    statusColor: string;
    statusIdList: Array<number>;
    ownerIdList: Array<number>;
    partitionKeyList: Array<number>;
    partitionKey: number;
    page: Paging;

}

export class TrialBalanceDetail extends BaseModel {
    trialBalanceDetailId: number;
    trialBalanceId: number;
    ownerId: number;
    ownerName: string;
    ownerTypeId: number;
    ownerTypeName: string;
    debit: number;
    credit: number;
    remained: number;
    remainedDesc: string;
    debitTo: number;
    debitFrom: number;
    creditFrom: number;
    creditTo: number;
    requestId: number;
    requestDetailId: number;
    requestTypeId: number;
    requestTypeName: string;
    requestStatus: number;
    requestStatusDescription: string;
    requestStatusColor: string;
    paymentTypeId: number;
    paymentTypeName: string;
    documentNumber: string;
    financialCategoryId: number;
    financialCategoryName: string;
    financialCategoryFullName: string;
    financialCategoryCode: string;
    financialCategoryFullCode: string;
    documentDescription: string;
    status: number;
    statusDescription: string;
    statusColor: string;
    updateLocalDate: string;
    updateLocalTime: string;
    updOrder: number;
    statusIdList: Array<number>;
    ownerIdList: Array<number>;
    paymentTypeIdList: Array<number>;
    partitionKeyList: Array<number>;
    partitionKey: number;
    page: Paging;

}