import { BaseModel } from "app/core/type/base/BaseModel";
import { Paging } from "app/core/type/paging/paging.type";

export class CustomerOrder {
    orderId: number;
    rowQuantity: number;
    productQuantity: number;
    subTotal: number;
    tax: number;
    customerDiscount: number;
    extraDiscount: number;
    total: number;
    totalPrimeCost: number;
    paidAmount: number;
    customerId: number;
    customerNameFamily: string;
    orderTypeId: number;
    orderTypeName: string;
    minPaymentRate: number;
    orderCode: string;
    orderNumber: string;
    productList: Array<orderProduct>;
    productCode: string;
    productName: string;
    approximateDeliveryDate: Date;
    exactDeliveryDate: Date;
    deliveryDays: number;
    hasFrame: number;
    coverId: number;
    coverName: string;
    organizationId: number;
    organizationName: string;
    departmentId: number;
    departmentName: string;
    regDateTime: String;
    regLocalDate: String;
    status: number;
    statusDesc: string;
    statusColor: string;
    statusColour: string;
    statusIdList: Array<number>;
    clientIP: string;
    registerUserID: number;
    registerUserName: string;
    localChangeDate: string;
    localChangeTime: string;
    chaneDate: string;
    orderSerialList: Array<orderSerial>;
    warehouseId: number;
    warehouseName: string;
    warehouseIdList: Array<number>;
    brandIdList: Array<number>;
    frameCoverIdList: Array<number>;
    panelCoverIdList: Array<number>;
    paymentAdjustmentList: Array<customerPayment>;
    descriptionList: Array<description>;
    shippedConfirmedLocalFromDate: string;
    shippedConfirmedLocalToDate: string;
    remittanceCode: string;
    localFromDate: string;
    localToDate: string;
    orderIdList: Array<number>;
    page: Paging;
    accessKey: string;
    productTypeIdList: Array<number>;
    customerTypeIdList: Array<number>;
    customerTypeId
    List: Array<number>;
    subPartitionKeyList: Array<number>;
    totalPrimeCostFrom: number;
    totalPrimeCostTo: number;
    regLocalDateFrom: string;
    regLocalDateTo: string;
}


export class CustomerOrderDetail {
    orderId: number;
    rowQuantity: number;
    productQuantity: number;
    price: number;
    subTotal: number;
    tax: number;
    customerDiscount: number;
    extraDiscount: number;
    total: number;
    paidAmount: number;
    primeCost: number;
    totalPrimeCost: number;
    customerId: number;
    customerNameFamily: string;
    orderTypeId: number;
    orderTypeName: string;
    minPaymentRate: number;
    orderCode: string;
    orderNumber: string;
    productList: Array<orderProduct>;
    productCode: string;
    productName: string;
    approximateDeliveryDate: Date;
    exactDeliveryDate: Date;
    hasFrame: number;
    coverId: number;
    coverName: string;
    panelCoverName: string;
    frameCoverName: string;
    organizationId: number;
    organizationName: string;
    departmentId: number;
    departmentName: string;
    regDateTime: string;
    regLocalDate: string;
    shippedConfirmedLocalDate: string;
    status: number;
    statusDesc: string;
    statusColor: string;
    statusColour: string;
    statusIdList: Array<number>;
    clientIP: string;
    registerUserID: number;
    registerUserName: string;
    localChangeDate: string;
    localChangeTime: string;
    chaneDate: string;
    orderSerialList: Array<orderSerial>;
    warehouseId: number;
    warehouseName: string;
    warehouseIdList: Array<number>;
    brandIdList: Array<number>;
    frameCoverIdList: Array<number>;
    panelCoverIdList: Array<number>;
    paymentAdjustmentList: Array<customerPayment>;
    shippedConfirmedLocalFromDate: string;
    shippedConfirmedLocalToDate: string;
    remittanceCode: string;
    localFromDate: string;
    localToDate: string;
    page: Paging;
    orderIdList: Array<number>;
    productTypeIdList: Array<number>;
    customerTypeIdList: Array<number>;
    subPartitionKeyList: Array<number>;
    primeCostFrom: number;
    primeCostTo: number;
    regLocalDateFrom: string;
    regLocalDateTo: string;
}
export class orderSerial {
    orderDetailId: number;
    orderDetailNumber: number;
    productionProgramSerialPoolId: number;
}
export class orderProduct {

    orderId: number;
    orderDetailId: number;
    orderDetailNumber: number;
    rowNumber: number;
    productId: number;
    productName: string;
    brandId: number;
    brandName: string;
    quantity: number;
    productCoverId: number;
    productCoverName: string;
    productCoverPrice: number;
    panelCoverId: number;
    panelCoverName: string;
    panelCoverPrice: number;
    controlId: string;
    frameConformity?: number;
    panelConformity?: number;
    unitPrice?: number;
}

export class numberCollection {
    paramList: Array<number>;
}

export class OrderProductInfo {
    productId: number;
    productName: string;
    brandId: number;
    brandName: string;
    hasCover: number;
    price: number;
    total: number;
    currencyId: number;
    currencyName: string;
    currencyAbbreviation: string;
    controlId: string;
    frameConformity: number;
    panelConformity: number;
}
export class Budget extends BaseModel {
    budgetId: number;
    ownerId: number;
    ownerName: string;
    ownerTypeId: number;
    ownerTypeName: string;
    balance: number;
    credit: number;
    currencyId: number;
    currencyName: string;
    status: number;
    statusDescription: string;
    statusColor: string;
}
export class customerPayment {
    orderId: number;
    paymentSet: number;
}

export class description {
    rowNumber: number;
    description: string;
}
