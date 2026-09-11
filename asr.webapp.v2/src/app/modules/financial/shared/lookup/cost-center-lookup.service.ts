import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PurchaseInvoiceService } from '../../invoices/purchase/purchase-invoice.service';
import { MockCostCenter } from '../mock-data';

/**
 * Cost Center has no real DB table yet — erp-be serves this from a local JSON
 * file instead (see PurchaseInvoiceMasterDataService), gated by
 * application.local-mock-data.enabled. Returns an empty list when that's off.
 */
@Injectable({
    providedIn: 'root'
})
export class CostCenterLookupService {

    constructor(private _purchaseInvoiceService: PurchaseInvoiceService) {
    }

    getCostCenters(): Observable<MockCostCenter[]> {
        return this._purchaseInvoiceService.getMockCostCenters().pipe(
            map((res: any) => (res && res.data ? res.data : []) as MockCostCenter[]),
            catchError(() => of([] as MockCostCenter[]))
        );
    }

    addQuickCostCenter(code: string, name: string): Observable<MockCostCenter> {
        return this._purchaseInvoiceService.addMockCostCenter({ costCenterCode: code, costCenterName: name }).pipe(
            map((res: any) => res && res.data ? res.data as MockCostCenter : null)
        );
    }
}
