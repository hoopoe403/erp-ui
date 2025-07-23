import { Paging } from "app/core/type/paging/paging.type";
import { BaseModel } from "app/core/type/base/BaseModel";

export class ProductSubset extends BaseModel {
    productId: number;
    productName: string;
    productCode: string;
    brandName: string;
    goodsId: number;
    goodsCode: string;
    goodsName: string;
    goodsTechnicalNumber: string;
    goodsCategoryId: number;
    goodsCategoryName: string;
    measure: number;
    unitName: string;
    conformityId: number;
    conformityName: string;
    goodsPrice: number;
    goodsServices: string;
    productNameList: Array<string>;
    productCodeList: Array<string>;
    goodsCodeList: Array<string>;
    goodsNameList: Array<string>;
    goodsCategoryNameList: Array<string>;
    goodsServiceNameList: Array<string>;
    measurementMetricId: number;
    measureList: Array<number>;
    brandIdList: Array<number>;
    productTypeIdList: Array<number>;
    unitIdList: Array<number>;
    conformityIdList: Array<number>;
    serviceIdList: Array<number>;
    productIdList: Array<number>;
    source: string;
    page: Paging;

}