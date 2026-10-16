import { Paging } from "app/core/type/paging/paging.type";
import { ATTRIBUTE_STATUSES, AttributeValue } from "../attribute/attribute.types";

/** Hard-coded, like the other inventory modules: a product or variant is Active (the default) or Inactive. */
export const PRODUCT_STATUSES: Array<any> = ATTRIBUTE_STATUSES;
export const PRODUCT_STATUS_ACTIVE = 1000001;

/** The backend refuses selections that make more variants than this (ProductVariantGeneration.MAX_VARIANTS). */
export const MAX_VARIANTS = 500;

/** The attribute data types the product rules branch on (TBL_ATTRIBUTE.DATA_TYPE). */
export const DATA_TYPE_LIST = 'LIST';
export const DATA_TYPE_NUMBER = 'NUMBER';

/**
 * A product (`/api/inventory/product`). `categoryId` is its main category, which decides the attributes it can
 * have. Saved together with the product: `attributeValues` - several per list attribute, one per number or text
 * attribute. The server generates a variant per combination of the list values; `variantAttributeIds` (the list
 * attributes with values) is read-only. Both are left out of the paged list and the picker; a single product
 * (get, create, edit) carries them.
 */
export class Product {
    productId: number;
    /** Required, unique (case-insensitive), at most 20 characters - it starts every generated SKU. */
    productCode: string;
    productName: string;
    categoryId: number;
    categoryFullCode: string;
    categoryFullName: string;
    brandId: number;
    brandName: string;
    status: number;
    statusDescription: string;
    statusColor: string;
    variantAttributeIds: Array<number>;
    attributeValues: Array<ProductAttributeValue>;
    /** Sent on save only: the SKU chosen for each combination (blank = let the server generate it). */
    variantSkus?: Array<ProductVariantSku>;
    userId: string;
    userFullName: string;
    changeDate: string;
}

/** What the product form sends for a fixed value: the column that fits the attribute's data type. */
export class ProductAttributeValueInput {
    attributeId: number;
    valueId?: number;
    valueNum?: number;
    valueText?: string;
}

/** A product's fixed value of an attribute (TBL_PRODUCT_ATTRIBUTE_VALUE), current or removed. */
export class ProductAttributeValue extends ProductAttributeValueInput {
    productAttributeValueId: number;
    productId: number;
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

export class ProductSearch {
    productCode: string;
    productName: string;
    categoryId: number;
    brandId: number;
    statusIdList: Array<number> = [];
    page: Paging;
}

/**
 * A variant (SKU) of a product (`/api/inventory/productVariant`): one value per variant attribute of the
 * product (`attributeValueIds`). `combinationKey` is derived by the server.
 */
export class ProductVariant {
    productVariantId: number;
    productId: number;
    productName: string;
    sku: string;
    barcode: string;
    combinationKey: string;
    attributeValueIds: Array<number>;
    status: number;
    statusDescription: string;
    statusColor: string;
    userId: string;
    userFullName: string;
    changeDate: string;
}

/** A variant's value row (TBL_PRODUCT_VARIANT_ATTRIBUTE_VALUE, history in its _LOG table), active or removed. */
export class ProductVariantAttributeValueRow {
    productVariantAttributeValueId: number;
    productVariantId: number;
    attributeValueId: number;
    attributeId: number;
    attributeCode: string;
    attributeName: string;
    attributeValue: string;
    status: number;
    statusDescription: string;
    statusColor: string;
    userFullName: string;
    changeDate: string;
}

export class Brand {
    brandId: number;
    brandCode: string;
    brandName: string;
    status: number;
}

/** A category's attribute row (`/api/inventory/productCategoryAttribute/category/{id}`). */
export class CategoryAttributeRow {
    productCategoryAttributeId: number;
    productCategoryId: number;
    attributeId: number;
    attributeCode: string;
    attributeName: string;
    status: number;
}

/** Upper-case letters and digits, any other run of characters a single '-', no '-' at either end. */
export function skuPart(text: string): string {
    return (text || '').toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/**
 * The SKU the backend generates for a combination (ProductVariantGeneration.proposedSku): the product code, then
 * each value's short code (else its text), joined by '-' - e.g. TS01-RED-M. Without a usable code the product
 * name (at most 20 characters) starts it, else P<productId>. At most 50 characters. The backend adds -2, -3...
 * when the SKU is already taken.
 */
export function suggestedSku(product: { productId?: number; productCode?: string; productName?: string },
                             values: Array<AttributeValue>): string {
    let prefix = skuPart(product.productCode);
    if (!prefix)
        prefix = skuPart(product.productName).substring(0, 20).replace(/-+$/g, '');
    if (!prefix)
        prefix = 'P' + (product.productId || '');
    const parts = [prefix, ...values.map(v => skuPart(v.shortCode || v.attributeValue)).filter(x => !!x)];
    return parts.join('-').substring(0, 50).replace(/-+$/g, '');
}

/** The SKU chosen on the product form for one combination of its list values. */
export class ProductVariantSku {
    attributeValueIds: Array<number>;
    sku: string;
}

/** A variant that already uses a SKU (`POST productVariant/checkSkus`) - of any product, active or inactive. */
export class ProductVariantSkuUsage {
    sku: string;
    productVariantId: number;
    productId: number;
    productCode: string;
    productName: string;
    combinationKey: string;
    status: number;
}

/** The combination key the backend gives a variant: attributeId:valueId pairs by attribute id, '|' joined; DEFAULT for none. */
export function combinationKey(pairs: Array<{ attributeId: number; valueId: number }>): string {
    if (!pairs.length)
        return 'DEFAULT';
    return [...pairs].sort((a, b) => a.attributeId - b.attributeId || a.valueId - b.valueId)
        .map(p => p.attributeId + ':' + p.valueId).join('|');
}
