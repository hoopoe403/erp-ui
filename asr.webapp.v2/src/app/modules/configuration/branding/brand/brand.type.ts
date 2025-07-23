import { BaseModel } from "app/core/type/base/BaseModel";
import { Paging } from "app/core/type/paging/paging.type";

export class Brand extends BaseModel{
    brandId: number;
    brandCode: string;
    brandName: string;
    organizationId: number;
    organizationName: string;
    serialPrefix: string;
    serialStartPoint: string;
    priceIncrement: number;
    priceExpireDay: string;
    productCount: number;
    isSelected: number
    status: number;
    // propertyValueList?: number[] = [];
    parentID: number;
    edit: boolean;
    registerUserName: string;
    clientIP: string;
    localChangeDate: string;
    localChangeTime: string;
    page: Paging
}