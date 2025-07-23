
import { GoodsMeasure } from "app/core/type/key-value/key-value.type";
import { Paging } from "app/core/type/paging/paging.type";
export class Product {
    productId: number = 0;
    productCode: string;
    fullCode: string;
    brandProductCode: string;
    productName: string;
    fullName: string;
    parentID: number;
    brandId: number;
    brandName: string;
    organizationId: number;
    organizationName: string;
    parentCode: string;
    propertyValueList: [];
    productTypeId: number;
    depotCount: number;
    approximateDelivery: number;
    isSelected: number;
    status: number;
    languageID: number;
    clientIP: string;
    registerUserID: number;
    registerUserName: string;
    localChangeDate: string;
    localChangeTime: string;
    chaneDate: string;
    edit?: boolean = false;
    goodsList: Array<GoodsMeasure>;
    productIdList: Array<number>;
    specificationList: Array<string>;
    levelId: number;
    statusIdList: Array<number>;
    brandIds: Array<number>;
    page: Paging;
}

