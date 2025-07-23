import { BaseModel } from "app/core/type/base/BaseModel";

export class Access extends BaseModel {
    accessId: number;
    accessName: string;
    accessKey: string;
    maxAttempt: string;
    status: number;
    statusDescription: string;
    statusColor: string;
    checked: boolean;
    assignmentType: string;
    roleName: string;
}

export class Menu extends BaseModel {
    id: number;
    code: string;
    parentId: number;
    title: string;
    subtitle: string;
    type: string;
    icon: string;
    link: string;
    children: Array<number>;
    assignmentType: string;
    roleName: string;
    subSystemId: number;
    subSystemName: string;
    orderId: number;
    columns: string;
    viewId: number;
}

export class SubSystem extends BaseModel {
    subSystemId: number;
    subSystemName: string;
    assignmentType: string;
    status: number;
    statusDescription: string;
    orderNumber: number;
}
export class AccessApi extends BaseModel {
    accessApiId: number;
    userId: number;
    accessId: number;
    accessName: string;
    accessKey: string;
    apiId: number;
    apiName: string;
    status: number;
    statusDescription: string;
    statusColor: string;
    checked: boolean;
    assignmentType: string;
    roleName: string;
}