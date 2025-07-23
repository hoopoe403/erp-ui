import { Paging } from "app/core/type/paging/paging.type";
import { BaseModel } from "app/core/type/base/BaseModel";
export class Invoice extends BaseModel {
    invoiceId: number;
    invoiceNumber: string;
    total: number;
    currencyId: number;
    currencyName: string;
    currencyAbbreviation: string;
    financialCategoryId: number;
    financialCategoryName: string;
    financialCategoryCode: string;
    ownerId: number;
    ownerName: string;
    ownerTypeId: number;
    ownerTypeName: string;
    requestId: number;
    requestCode: string;
    referenceNo: string;
    requestTypeId: number;
    requestTypeName: string;
    subsystemId: number;
    subsystemName: string;
    status: number;
    statusDescription: string;
    statusColor: string;
    statusIdList: Array<number>;
    ownerTypeIdList: Array<number>;
    totalFrom: number;
    totalTo: number;
    language: string;
    clientIP: string;
    registerUserID: number;
    registerUserName: string;
    localChangeDate: string;
    localChangeTime: string;
    changeDate: string;
    invoiceDetailList: Array<InvoiceDetail>;
    page: Paging;

}

export class InvoiceDetail extends BaseModel {
    invoiceDetailId: number;
    invoiceId: number;
    rowNumber: number;
    unitPrice: number;
    measure: number;
    unitId: number;
    unitName: string;
    itemId: number;
    itemCode: string;
    itemName: string;
    itemTypeId: number;
    itemTypeName: string;
    total: number;
    requestId: number;
    requestDetailId: number;
    sourceCoverId: number;
    sourceCoverName: string;
    destinationCoverId: number;
    destinationCoverName: string;
    serial: string;
    status: number;
    statusDescription: string;
    statusColor: string;
    page: Paging;
}