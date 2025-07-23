import { Paging } from "app/core/type/paging/paging.type";
import { BaseModel } from "app/core/type/base/BaseModel";

export class CustomerType {
    customerTypeId: number;
    customerTypeName: number;
    customerTypeCode: number;
    discountPercent: number;
    status: number;
    clientIP: string;
    registerUserID: number;
    registerUserName: string;
    localChangeDate: string;
    localChangeTime: string;
    chaneDate: string;
}