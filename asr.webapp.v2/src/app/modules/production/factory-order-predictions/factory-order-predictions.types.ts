import { Paging } from "app/core/type/paging/paging.type";
import { BaseModel } from "app/core/type/base/BaseModel";

export class FactoryOrderPrediction extends BaseModel {
    factoryOrderPredictionId: number;
    factoryOrderPredictionCode: string;
    goodsId: number;
    goodsCode: string;
    goodsName: string;
    categoryCode: string;
    categoryName: string;
    categoryGoodsCode: string;
    requiredInventory: number;
    organInventory: number;
    contractorInventory: number;
    inProgressOrderInventory: number;
    totalAvailableInventory: number;
    totalRequiredInventory: number;
    measurementMetricId: number;
    measurementMetricName: string;
    unitId: number;
    unitName: string;
    status: number;
    statusDescription: string;
    statusColor: string;
    period: string;
    statusIdList: Array<number>;
    levelNumberList: Array<number>;
    page : Paging;
}

export class FactoryOrderPredictionDetail extends BaseModel {
    factoryOrderPredictionDetailId : number;
    productId : number;
    productCode : string;
    productName : string;
    brandId : number;
    brandName : string;
    goodsId : number;
    categoryId : number;
    categoryGoodsCode : string;
    goodsName : string;
    categoryName : string;
    parentId : number;
    parentName : string;
    parentCode : string;
    parentTypeId : number;
    parentTypeName : string;
    parentUsageMeasure : number;
    usageMeasureInParent : number;
    measure : number;
    measurementMetricId :number;
    measurementMetricName : string;
    unitId :number;
    unitName : string;
    status :number;
    statusDescription : string;
    statusColor : string;
    levelNumber :number;
    levelDesc : string;
    statusIdList: Array<number>;
    levelNumberList: Array<number>;
    parentTypeIdList: Array<number>;
    page : Paging;
}