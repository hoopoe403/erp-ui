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
  materialList: Array<number>;
  unitList: Array<GoodsUnit>;
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

/**
 * A unit a goods is counted in. Exactly one per goods is primary (conversionRate 1); every other unit
 * says how many primary units it is (1 box = 12 pieces -> conversionRate 12 when pieces are primary).
 */
export interface GoodsUnit {
  unitId: number;
  unitName?: string;
  unitCode?: string;
  isPrimary: boolean;
  conversionRate: number;
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