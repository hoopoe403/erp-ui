import { BaseModel } from "app/core/type/base/BaseModel";
import { KeyValue, Measure, KeyCount, GoodsMeasure } from "../../../../core/type/key-value/key-value.type";
import { Paging } from "../../../../core/type/paging/paging.type";
export class Goods {
  goodsId: number;
  goodsCode: string;
  goodsName: string;
  categoryId: number;
  categoryName: string;
  categoryCode: string;
  categoryGoodsCode: string;
  organizationId: number;
  organizationName: string;
  hasCover: number;
  hasGoodsCover: number;
  objectLength: number;
  objectWidth: number;
  objectHeight: number;
  dimensionsUnitId: number;
  dimensionsUnitName: string;
  objectWeight: number;
  weightUnitId: number;
  weightUnitName: string;
  materialList: Array<number>;
  orderDeadline: number;
  criticalPoint: number;
  measurementMetricId: number;
  arrivalMeasurementMetricId: number;
  departureMeasurementMetricId: number;
  stockMeasurementMetricId: number;
  reductionTimingId: number;
  technicalNumber: string;
  goodsIdList: Array<number>;
  notGoodsIdList: Array<number>;
  selectedGoodsIdList: Array<number>;
  selectedItemsViewMode: number;
  propertyList: Array<KeyValue>;
  goodsPropertyValue: Array<GoodsPropertyValue>;
  productsList: Array<GoodsMeasure>;
  serviceList: Array<number>;
  childrenList: Array<Measure>;
  stock: number;
  status: number;
  language: string;
  clientIP: string;
  registerUserID: number;
  registerUserName: string;
  localChangeDate: string;
  localChangeTime: string;
  chaneDate: string;
  page: Paging;

}

export class OrgProducts {
  organizationId: number;
  productList: Array<number>;
}

export class GoodsPropertyValue {
  propertyId: number;
  propertyValueId: number;
  propertyText: string;
}


export class GoodsService extends BaseModel {
  goodsServiceId: number;
  goodsId: number;
  goodsCode: string;
  goodsName: string;
  serviceId: number;
  serviceCode: string;
  serviceName: string;
  status: number;
}