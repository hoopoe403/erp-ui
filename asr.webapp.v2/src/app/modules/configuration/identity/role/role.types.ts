import { BaseModel } from "app/core/type/base/BaseModel";
import { Paging } from "app/core/type/paging/paging.type";

export class Role extends BaseModel {
    roleId: number;
    roleCode: string;
    roleName: string;
    status: string;
    statusDescription: string;
    statusColor: string;
    userIdList: Array<number>;
    menuIdList: Array<number>;
    accessIdList: Array<number>;
    statusIdList: Array<number>;
    page: Paging;
}
