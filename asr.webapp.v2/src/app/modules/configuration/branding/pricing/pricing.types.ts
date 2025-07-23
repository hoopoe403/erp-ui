import { BaseModel } from "app/core/type/base/BaseModel";
import { Paging } from "app/core/type/paging/paging.type";
import { ColumnAccess } from 'app/shared/grid-size.component';
export class Pricing extends BaseModel {
    productPriceId: number;
    brandId: number;
    brandName: string;
    productId: number;
    productCode: string;
    productName: string;
    productTypeId: number;
    productTypeName: string;
    effLocalDate: string;
    effLocalTime: string;
    price: number;
    primeCost: number;
    curencyId: number;
    currencyName: string;
    currencyAbbreviation: string;
    brandIdList: Array<number>;
    fromPrice: number;
    toPrice: number;
    priceFrom: number;
    priceTo: number;
    effDteFrom: string;
    effDateTo: string;
    page: Paging;
}

export class ProductPriceList extends BaseModel {
    listId: number;
    productId: number;
    productCode: string;
    fullName: string;
    brandId: number;
    brandName: string;
    productName: string;
    oldPrice: number;
    newPrice: number;
    difference: number;
    differencePercent: number;
    priceList: Array<Price>;
    page: Paging;
}

export class Price {
    targetId: number;
    price: number;
}

export class PriceGrid {
    brandName: ColumnAccess;
    productCode: ColumnAccess;
    productName: ColumnAccess;
    productTypeName: ColumnAccess;
    price: ColumnAccess;
    primeCost: ColumnAccess;
    effDateTime: ColumnAccess;
}
