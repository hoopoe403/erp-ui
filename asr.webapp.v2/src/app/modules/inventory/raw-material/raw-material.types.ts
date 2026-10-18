import { Paging } from "app/core/type/paging/paging.type";
import { ATTRIBUTE_STATUSES } from "../attribute/attribute.types";

/** Hard-coded, like the other inventory modules: a raw material is Active (the default) or Inactive. */
export const RAW_MATERIAL_STATUSES: Array<any> = ATTRIBUTE_STATUSES;
export const RAW_MATERIAL_STATUS_ACTIVE = 1000001;

/**
 * A raw material (`/api/inventory/rawMaterial`). `categoryId` must be a leaf of the raw material category tree;
 * the unit and the account are optional. Unlike a product it has no brand, no variants and no SKUs, and its
 * category has no attribute list: any attribute can be given a value - one value per attribute (the UI keeps
 * list attributes to a single value too). `attributeIds` (the list attributes with values) is read-only. Both
 * are left out of the paged list; a single raw material (get, create, edit) carries them.
 */
export class RawMaterial {
    rawMaterialId: number;
    /** Required, unique, at most 38 characters. */
    rawMaterialCode: string;
    rawMaterialName: string;
    categoryId: number;
    categoryFullCode: string;
    categoryFullName: string;
    accountId: number;
    accountFullCode: string;
    accountFullName: string;
    unitId: number;
    unitName: string;
    technicalNumber: string;
    status: number;
    statusDescription: string;
    statusColor: string;
    attributeIds: Array<number>;
    attributeValues: Array<RawMaterialAttributeValue>;
    userId: string;
    userFullName: string;
    changeDate: string;
}

/** What the raw material form sends for a value: the column that fits the attribute's data type. */
export class RawMaterialAttributeValueInput {
    attributeId: number;
    valueId?: number;
    valueNum?: number;
    valueText?: string;
}

/** A raw material's value of an attribute (TBL_RAW_MATERIAL_ATTRIBUTE_VALUE). */
export class RawMaterialAttributeValue extends RawMaterialAttributeValueInput {
    rawMaterialAttributeValueId: number;
    rawMaterialId: number;
    attributeCode: string;
    attributeName: string;
    dataType: string;
    /** The list value's text, for a LIST attribute. */
    attributeValue: string;
    status: number;
    statusDescription: string;
    statusColor: string;
    userFullName: string;
    changeDate: string;
}

export class RawMaterialSearch {
    rawMaterialCode: string;
    rawMaterialName: string;
    technicalNumber: string;
    categoryId: number;
    accountId: number;
    unitId: number;
    statusIdList: Array<number> = [];
    page: Paging;
}
