import { BaseModel } from "app/core/type/base/BaseModel";
import { Paging } from "app/core/type/paging/paging.type";

export class Warehouse extends BaseModel {

    warehouseId: number;
    warehouseCode: string;
    warehouseName: string;
    warehouseLength: number;
    warehouseWidth: number;
    warehouseHeight: number;
    dimensionsUnitId: number;
    dimensiondUnitName: string;
    weightCapacity: number;
    weightUnitId: number;
    ownerId: number;
    ownerName: string;
    totalSegments: number;
    totalGoods: number;
    totalProducts: number;
    ownerTypeId: number;
    ownerTypeName: string;
    branchId: number;
    branchName: string;
    departmentId: number;
    departmentName: string;
    warehouseTypeId: number;
    merchandises: Array<number>;
    status: number;
    statusDescription: string;
    statusColor: string;
    statusIdList: Array<number>;
    page: Paging;
    languageID: string;


}