import { Observable } from 'rxjs';

/**
 * A unit a product or goods is counted in. Exactly one per item is the primary (base) unit.
 */
export interface UnitRow {
    unitId: number;
    unitName?: string;
    unitCode?: string;
    isPrimary: boolean;
    conversionRate: number;
}

/**
 * Configuration for the unit properties dialog
 */
export interface UnitPropertiesDialogConfig {
    title: string;
    subtitle?: string;
    units: UnitRow[];
    loadUnits: () => Observable<any>;   // Returns the available units as { data: Units[] }
}

/**
 * Result returned when dialog closes
 */
export interface UnitPropertiesDialogResult {
    saved: boolean;
    units?: UnitRow[];
}
