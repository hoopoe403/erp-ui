import { Paging } from "app/core/type/paging/paging.type";
import { BaseModel } from "app/core/type/base/BaseModel";

export class FinancialDocumentDetail extends BaseModel {
    financialDocumentDetailId: number;
    financialDocumentId: number;
    ownerId: number;
    ownerName: string;
    ownerTypeId: number;
    ownerTypeName: string;
    debit: number;
    credit: number;
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
    statusIdList: Array<number>;
    ownerIdList: Array<number>;
    financialDocumentDetailIdList: Array<number>;
    partitionKey: number;
    page: Paging;

}