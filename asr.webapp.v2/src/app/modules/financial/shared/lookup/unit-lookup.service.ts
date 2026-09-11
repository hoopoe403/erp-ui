import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PurchaseInvoiceService } from '../../invoices/purchase/purchase-invoice.service';

export interface UnitOption {
    unitId: number;
    unitCode: string;
    unitName: string;
    abbreviation: string;
}

/**
 * Unit of measure (qty/kg/pcs/...) — already real master data elsewhere in this
 * system (see erp-be's UnitRepository, reused by Product/Warehouse/Factory Order
 * etc.), unlike Cost Center/Fixed Asset/VAT groups. Both methods below hit the
 * same erp-be endpoint regardless of application.local-mock-data.enabled — the
 * backend decides whether to serve/store local mock data or go through the real
 * UnitRepository, so this service (and its caller) never needs to know which.
 */
@Injectable({
    providedIn: 'root'
})
export class UnitLookupService {

    constructor(private _purchaseInvoiceService: PurchaseInvoiceService) {
    }

    getUnits(): Observable<UnitOption[]> {
        return this._purchaseInvoiceService.getUnits().pipe(
            map((res: any) => (res && res.data ? res.data : []) as UnitOption[]),
            catchError(() => of([] as UnitOption[]))
        );
    }

    addQuickUnit(code: string, name: string): Observable<UnitOption> {
        return this._purchaseInvoiceService.addUnit({ unitCode: code, unitName: name }).pipe(
            map((res: any) => res && res.data ? res.data as UnitOption : null)
        );
    }
}
