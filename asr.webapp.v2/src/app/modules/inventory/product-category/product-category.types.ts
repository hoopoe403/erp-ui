import { Paging } from "app/core/type/paging/paging.type";

/** A status a product category can have. */
export class ProductCategoryStatus {
    statusId: number;
    statusDescription: string;
    color: string;
    isDefault: number;
}

// Hard-coded: a product category is Active (the default for a new one) or Inactive.
export const PRODUCT_CATEGORY_STATUSES: Array<ProductCategoryStatus> = [
    { statusId: 1000001, statusDescription: 'Active', color: 'bg-green-500', isDefault: 1 },
    { statusId: 1000000, statusDescription: 'Inactive', color: 'bg-red-500', isDefault: 0 },
];

/** Fills statusDescription / statusColor from PRODUCT_CATEGORY_STATUSES when the backend only sends the status id. */
export function withCategoryStatusInfo(category: ProductCategory): ProductCategory {
    const status = PRODUCT_CATEGORY_STATUSES.find(x => x.statusId === category.status);
    if (status) {
        category.statusDescription = category.statusDescription || status.statusDescription;
        category.statusColor = category.statusColor || status.color;
    }
    return category;
}

/**
 * A product category as the API returns it. fullCode, fullName, levelId, parentFullName, status
 * description/colour and the audit fields are server-owned: the backend ignores them on save.
 * `attributeIds` are the attributes (not their values) a product of the category is described by;
 * left out on an edit, the backend keeps the stored ones.
 */
export class ProductCategory {
    productCategoryId: number;
    productCategoryCode: string;
    fullCode: string;
    productCategoryName: string;
    fullName: string;
    parentId: number;
    parentFullName: string;
    orderDeadline: number;
    orderCriticalPoint: number;
    levelId: number;
    status: number;
    statusDescription: string;
    statusColor: string;
    attributeIds: Array<number>;
    userId: string;
    userFullName: string;
    changeDate: string;
}

export class ProductCategorySearch {
    productCategoryCode: string;
    productCategoryName: string;
    fullCode: string;
    fullName: string;
    parentId: number;
    levelId: number;
    statusIdList: Array<number> = [];
    page: Paging;
}

/** A node of the category tree page (nested, before MatTreeFlattener flattens it). */
export class ProductCategoryNode {
    category: ProductCategory;
    children: Array<ProductCategoryNode> = [];
}

/** A flattened tree node, the shape MatTree renders. */
export class ProductCategoryFlatNode {
    id: number;
    category: ProductCategory;
    level: number;
    expandable: boolean;
}
