
import { GoodsMeasure } from "app/core/type/key-value/key-value.type";
import { Paging } from "app/core/type/paging/paging.type";

/**
 * Product Unit - represents a measurement unit for a product
 * Similar to React app's unit structure:
 * - Primary unit is the base unit (isPrimary = true)
 * - Secondary units are conversion-based (e.g., 1 box = 12 pieces)
 */
export interface ProductUnit {
    unitId: number;              // Reference to the Units table
    unitName?: string;           // Display name (e.g., "Piece", "Box", "Kilogram")
    unitCode?: string;           // Short code (e.g., "PCS", "BOX", "KG")
    isPrimary: boolean;          // True if this is the primary/base unit
    conversionRate: number;      // Conversion rate to primary unit (1 for primary)         // The product this unit belongs to
}

export class Product {
    productId: number = 0;
    productCode: string;
    fullCode: string;
    brandProductCode: string;
    productName: string;
    fullName: string;
    parentID: number;
    brandId: number;
    brandName: string;
    organizationId: number;
    organizationName: string;
    parentCode: string;
    propertyValueList: [];
    productTypeId: number;
    depotCount: number;
    approximateDelivery: number;
    isSelected: number;
    status: number;
    languageID: number;
    clientIP: string;
    registerUserID: number;
    registerUserName: string;
    localChangeDate: string;
    localChangeTime: string;
    chaneDate: string;
    edit?: boolean = false;
    goodsList: Array<GoodsMeasure>;
    productIdList: Array<number>;
    specificationList: Array<string>;
    levelId: number;
    statusIdList: Array<number>;
    brandIds: Array<number>;
    page: Paging;
    units?: ProductUnit[];       // Product units list
}

