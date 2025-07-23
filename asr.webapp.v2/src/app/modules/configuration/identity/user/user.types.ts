import { BaseModel } from "app/core/type/base/BaseModel";
import { ViewColumn } from "app/core/type/column/user-column.type";
import { Paging } from "app/core/type/paging/paging.type";

export class User extends BaseModel {
    userId: number;
    userNumber: number;
    username: string;
    password: string;
    firstName: string;
    email: string;
    avatar: string;
    lastName: string;
    imageUrl: string;
    langKey: string;
    activated: boolean;
    apiId: number;
    status: number;
    statusDescription: string;
    statusColor: string;
    roleIdList: Array<number>;
    menuIdList: Array<number>;
    accessIdList: Array<number>;
    statusIdList: Array<number>;
    viewColumnList: Array<ViewColumn>;
    assignmentType: string;
    page: Paging;
}
