import { BaseModel } from "app/core/type/base/BaseModel";
import { Paging } from "app/core/type/paging/paging.type";

export class FinancialResource extends BaseModel {
    financialResourceId: number;
    financialResourceCode: string;
    financialResourceName: string;
    financialResourceTypeId: number;
    financialResourceTypeName: string;
    ownerId: number;
    ownerName: string;
    ownerTypeId: number;
    ownerTypeName: string;
    beneficiaryId: number;
    beneficiaryName: string;
    beneficiaryTypeId: number;
    beneficiaryTypeName: string;
    accountHolder: string;
    accountNumber: string;
    bankId: number;
    bankName: string;
    bankUrl: string;
    drpName: string;
    bankAccountTypeId: number;
    bankAccountTypeName: string;
    status: number;
    statusDescription: string;
    statusColor: string;
    statusIdList: Array<number>;
    page: Paging;
}

export class FinancialResourceDetail extends BaseModel {
    financialResourceDetailId: number;
    financialResourceId: number;
    financialResourceName: string;
    currencyId: number;
    currencyName: string;
    currencyAbbreviation: string;
    chequeId: number;
    chequeNumber: string;
    chequeStatus: number;
    chequeStatusDescription: string;
    bankId: number;
    bankName: string;
    bankIdList: Array<number>;
    url: string;
    chequeDate: string;
    chequeLocalDate: string;
    chequeLocalDateClean: string;
    balance: number;
    paymentTypeId: number;
    paymentTypeName: string;
    paymentTypeIdList: Array<number>;
    chequeStatusIdList: Array<number>;
    status: number;
    statusDescription: string;
    statusColor: string;
}