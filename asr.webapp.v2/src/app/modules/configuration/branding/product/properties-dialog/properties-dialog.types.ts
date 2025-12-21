import { Product, ProductUnit } from '../product.types';

/**
 * Configuration for the Product Properties Dialog
 */
export interface ProductPropertiesDialogConfig {
    product: Product;
    title?: string;
}

/**
 * Result returned when dialog closes
 */
export interface ProductPropertiesDialogResult {
    saved: boolean;
    units?: ProductUnit[];
}

