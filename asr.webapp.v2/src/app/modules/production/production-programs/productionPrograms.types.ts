import { Paging } from "app/core/type/paging/paging.type";
import { BaseModel } from "app/core/type/base/BaseModel";

export class ProductionProgram extends BaseModel {
        productionProgramId: number;
        requestId: number;
        requestDetailId: number;
        requestDetailNumber: number;
        rowNumber: number;
        requestNumber: number;
        requestCode: string;
        requestTypeId: number;
        requestTypeName: string;
        productId: number;
        productCode: string;
        productName: string;
        fullName: string;
        brandId: number;
        brandName: string;
        frameCoverId: number;
        frameCoverName: string;
        panelCoverId: number;
        panelCoverName: string;
        customerId: number;
        customerFullName: string;
        serial: string;
        deliveryDate: Date;
        productionDateTime: String;
        status: number;
        statusDescription: string;
        remittanceSerial: string;
        productionFromDate: String;
        productionToDate: String;
        orderIdList: Array<number>;
        serialPool: Array<ProductionProgramSerialPool>;
        statusIdList: Array<number>;
        productionProgramIdList: Array<number>;
        page: Paging;
   
   }
   export class ProductionProgramSerialPool extends BaseModel {
        productionProgramSerialPoolId: number;
        productionProgramId: number;
        orderId: number;
        orderDetailId: number;
        orderDetailNumber: number;
        rowNumber: number;
        orderCode: string;
        warehouseInventoryDetailId: number;
        warehouseInventoryId: number;
        serial: string;
        status: number;
        statusDescription: string;
        statusColor: string;
}