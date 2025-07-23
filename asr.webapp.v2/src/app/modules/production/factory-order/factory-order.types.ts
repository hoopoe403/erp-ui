import { Paging } from "app/core/type/paging/paging.type";
import { BaseModel } from "app/core/type/base/BaseModel";

export class FactoryOrder extends BaseModel {
    factoryOrderId: number;
    factoryOrderCode: string;
    purchaserId: number;
    supplierTypeId: number;
    supplierId: number;
    supplierName: string;
    categoryId: number;
    goodsId: number;
    goodsCode: string;
    goodsName: string;
    serviceId: number;
    serviceName: string;
    total: number;
    receivedItems: number;
    remainedItems: number;
    goodsMeasure: number;
    contractorId: number;
    contractorName: string;
    orderNumber: number;
    totalPrice: number;
    referenceNumber: string;
    estimatedDeliveryDate: Date;
    registerDateTime: Date;
    registerLocalDate: string;
    registerLocalTime: string;
    orderDescription: string;
    status: number;
    statusDescription: string;
    goodsList: Array<FactoryOrderGoods>;
    goodsReceiptList: Array<FactoryOrderReceipt>;
    goodsReceiptListFlat: Array<FactoryOrderReceipt>;
    statusList: Array<number>;
    purchaserName: string;
    purchaserIdList: Array<number>;
    page: Paging;

}

export class FactoryOrderGoods {
    rownumber: number;
    goodsId: number;
    goodsName: string;
    goodsCategoryCode;
    categoryName: string;
    measure: number;
    unitPrice: number;
    unitId: number;
    measurementMetricId: number;;
    received: number;
    total: number;
    status: number;
    serviceId: number
}

export interface FactoryOrderReceipt {
    factoryOrderId: number;
    factoryOrderReceiptId: number;
    goodsId: number;
    goodsName: string;
    goodsCategoryCode: string;
    categoryName: string;
    measure: number;
    total: number;
    measurementMetricId: number;
    unitId: number;
}

export interface FactoryOrderReceiptDetail {
    factoryOrderReceiptId: number;
    rownumber: number;
    measure: number;
    goodsId: number;
    total: number;
    clientIP: string;
    registerUserID: number;
    registerUserName: string;
    localChangeDate: string;
    localChangeTime: string;
    changeDate: string;
}

export interface FactoryOrderReceipt {
    factoryOrderId: number;
    factoryOrderReceiptId: number;
    goodsId: number;
    goodsName: string;
    goodsCategoryCode: string;
    categoryName: string;
    measure: number;
    total: number;
    measurementMetricId: number;
    unitId: number;
}

export class ContractorFactoryOrderGoodsAPI {
    contractorId: number;
    contractorGoods: Array<ContractorFactoryOrderGoods>;
    goodsReceiptList: Array<FactoryOrderReceiptAPI>;
    goodsReceiptListFlat: Array<FactoryOrderReceipt>;
    page: Paging;
}

export class FactoryOrderContractor {
    goodsCategoryCode: string;
    goodsName: string;
    purchaserId: number;
    purchaserName: string;
    contractorId: number;
    contractorName: number;
    inProgressOrders: number;
    doneOrders: number;
    contractorGoods: Array<ContractorFactoryOrderGoods>;
    goodsReceiptList: Array<FactoryOrderReceiptAPI>;
    goodsReceiptListFlat: Array<FactoryOrderReceipt>;
    page: Paging;
}

export class FactoryOrderContractorAPI {
    purchaserId: number;
    contractorId: number;
    contractorName: number;
    inProgressOrders: number;
    doneOrders: number;
    contractorGoods: Array<ContractorFactoryOrderGoods>;
    goodsReceiptListFlat: Array<FactoryOrderReceipt>;
}

export class ContractorFactoryOrderGoods {
    factoryOrderId: number;
    factoryOrderCode: string;
    factoryOrderNumber: string;
    goodsId: number;
    totalMeasure: number;
    received: number;
    measurementMetricId: number;
    unitId: number;
    unitPrice: number;
    totalPrice: number;
    status: number;
    goodsName: string;
    goodsCategoryCode: string;
    categoryName: string;
    serviceId: number;
    serviceName: string;

}

export interface FactoryOrderReceiptAPI {
    factoryOrderId: number;
    goodsId: number;
    goodsName: string;
    goodsCategoryCode: string;
    categoryName: string;
    measurementMetricId: number;
    unitId: number;
    totalMeasure: number;
    total: number;
    received: number;
    rownumber: number;
    unitPrice: number;
    receiptList: Array<FactoryOrderReceiptDetailAPI>;
}

export interface FactoryOrderReceiptDetailAPI {
    factoryOrderReceiptId: number;
    rownumber: number;
    measure: number;
    goodsId: number;
    total: number;
    clientIP: string;
    registerUserID: number;
    registerUserName: string;
    localChangeDate: string;
    localChangeTime: string;
    changeDate: string;
}