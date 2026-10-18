import { Paging } from "app/core/type/paging/paging.type";

/** A status a raw material category can have. */
export class RawMaterialCategoryStatus {
    statusId: number;
    statusDescription: string;
    color: string;
    isDefault: number;
}

// Hard-coded: a raw material category is Active (the default for a new one) or Inactive.
export const RAW_MATERIAL_CATEGORY_STATUSES: Array<RawMaterialCategoryStatus> = [
    { statusId: 1000001, statusDescription: 'Active', color: 'bg-green-500', isDefault: 1 },
    { statusId: 1000000, statusDescription: 'Inactive', color: 'bg-red-500', isDefault: 0 },
];

/** Fills statusDescription / statusColor from RAW_MATERIAL_CATEGORY_STATUSES when the backend only sends the status id. */
export function withCategoryStatusInfo(category: RawMaterialCategory): RawMaterialCategory {
    const status = RAW_MATERIAL_CATEGORY_STATUSES.find(x => x.statusId === category.status);
    if (status) {
        category.statusDescription = category.statusDescription || status.statusDescription;
        category.statusColor = category.statusColor || status.color;
    }
    return category;
}

/**
 * An attribute assigned to a raw material category, with the values its raw materials may use: the allowed
 * value ids of a LIST attribute (at least one); empty for a number or text attribute - any value.
 */
export interface RawMaterialCategoryAttribute {
    attributeId: number;
    attributeValueIds: Array<number>;
}

/**
 * A raw material category as the API returns it. fullCode, fullName, levelId, parentFullName, status
 * description/colour and the audit fields are server-owned: the backend ignores them on save.
 * `attributes` limits the category's raw materials to those attributes and values; a category without
 * any leaves every attribute open.
 */
export class RawMaterialCategory {
    rawMaterialCategoryId: number;
    rawMaterialCategoryCode: string;
    fullCode: string;
    rawMaterialCategoryName: string;
    fullName: string;
    parentId: number;
    parentFullName: string;
    orderDeadline: number;
    orderCriticalPoint: number;
    levelId: number;
    status: number;
    statusDescription: string;
    statusColor: string;
    userId: string;
    userFullName: string;
    changeDate: string;
    attributes: Array<RawMaterialCategoryAttribute>;
}

export class RawMaterialCategorySearch {
    rawMaterialCategoryCode: string;
    rawMaterialCategoryName: string;
    fullCode: string;
    fullName: string;
    parentId: number;
    levelId: number;
    statusIdList: Array<number> = [];
    page: Paging;
}

/** A node of the category tree page (nested, before MatTreeFlattener flattens it). */
export class RawMaterialCategoryNode {
    category: RawMaterialCategory;
    children: Array<RawMaterialCategoryNode> = [];
}

/** A flattened tree node, the shape MatTree renders. */
export class RawMaterialCategoryFlatNode {
    id: number;
    category: RawMaterialCategory;
    level: number;
    expandable: boolean;
}
