import { Value } from "app/core/type/key-value/key-value.type";
import { Paging } from "app/core/type/paging/paging.type";

export class Property {
    filter(arg0: (f: any) => boolean) {
      throw new Error('Method not implemented.');
    }
    propertyId: number;
    propertyCode: string;
    propertyName: string;
    unitId: number;
    unitName: string;
    valueCount: number;
    controlTypeId: number;
    controlTypeName: string;
    usages : number;
    page : Paging ; 
    propertyValue:Array<Value>;
    language: number;
    clientIP: string;
    registerUserID: number;
    registerUserName: string;
    localChangeDate: string;
    localChangeTime: string;
    status: number;
    statusDescription: string;
    statusColor: string;
    statusIdList: Array<number>;
    changeDate: string;
}
