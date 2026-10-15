import { Paging } from "app/core/type/paging/paging.type";

export const ATTRIBUTE_DATA_TYPES: Array<string> = ['TEXT', 'NUMBER', 'LIST'];

// TODO: hard-coded until the backend status dropdown is ready.
export const ATTRIBUTE_STATUSES: Array<any> = [
    { statusId: 1000001, statusDescription: 'Active', statusColor: 'bg-green-500', isDefault: 1 },
    { statusId: 1000000, statusDescription: 'Inactive', statusColor: 'bg-red-500', isDefault: 0 },
];

/** Fills statusDescription / statusColor from ATTRIBUTE_STATUSES when the backend only sends the status id. */
export function withStatusInfo<T extends { status: number; statusDescription: string; statusColor: string }>(item: T): T {
    const status = ATTRIBUTE_STATUSES.find(x => x.statusId === item.status);
    if (status) {
        item.statusDescription = item.statusDescription || status.statusDescription;
        item.statusColor = item.statusColor || status.statusColor;
    }
    return item;
}

export class Attribute {
    attributeId: number;
    attributeCode: string;
    attributeName: string;
    dataType: string;
    unitId: number;
    unitName: string;
    status: number;
    statusDescription: string;
    statusColor: string;
    userId: string;
    userFullName: string;
    changeDate: string;
}

export class AttributeSearch {
    attributeCode: string;
    attributeName: string;
    dataType: string;
    unitId: number;
    statusIdList: Array<number> = [];
    page: Paging;
}

export class AttributeValue {
    attributeValueId: number;
    attributeId: number;
    attributeCode: string;
    attributeName: string;
    attributeValue: string;
    sortOrder: number;
    status: number;
    statusDescription: string;
    statusColor: string;
    userId: string;
    userFullName: string;
    changeDate: string;
}

export class AttributeValueSearch {
    attributeId: number;
    attributeValue: string;
    statusIdList: Array<number> = [];
    page: Paging;
}
