import { Paging } from "app/core/type/paging/paging.type";
import { BaseModel } from "app/core/type/base/BaseModel";

export class GoodsSubset extends BaseModel {
    goodsMixtureMeasureId: number;
    goodsId: number;
    goodsName: string;
    goodsCode: string;
    technicalNumber: string;
    goodsCategoryId: number;
    goodsCategoryName: string;
    subsetName: string;
    subsetCode: string;
    subsetTechnicalNumber: string;
    subsetCategoryId: number;
    subsetCategoryName: string;
    measure: number;
    unitName: string;
    measurementElementName: string;
    goodsServices: string;
    subsetServices: string;
    unitIdList: Array<number>;
    goodsServiceIdList: Array<number>;
    goodsServiceNameList: Array<string>;
    subsetServiceIdList: Array<number>;
    subsetServiceNameList: Array<string>;
    measureFrom: number;
    measureTo: number;
    page: Paging;

}