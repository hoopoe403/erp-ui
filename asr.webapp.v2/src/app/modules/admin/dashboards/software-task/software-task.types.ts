import { BaseModel } from "app/core/type/base/BaseModel";
import { Paging } from "app/core/type/paging/paging.type";

export class SoftwareTask extends BaseModel {
    taskId: number;
    priority: number;
    title: string;
    cost: number;
    descriptions: string;
    status: number;
    statusDescription: string;
    statusColor: string;
    costFrom: number;
    costTo: number;
    subSystemIdList: Array<number>;
    menuIdList: Array<number>;
    statusIdList: Array<number>;
    priorityIdList: Array<number>;
    page: Paging;
}