import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PurchaseInvoiceService } from '../../invoices/purchase/purchase-invoice.service';
import { MockFixedAsset } from '../mock-data';

/**
 * No real Fixed Asset module exists yet (picker UI only) — erp-be serves this
 * placeholder list from a local JSON file (see PurchaseInvoiceMasterDataService),
 * gated by application.local-mock-data.enabled. Returns an empty list when that's off.
 */
@Injectable({
    providedIn: 'root'
})
export class FixedAssetLookupService {

    constructor(private _purchaseInvoiceService: PurchaseInvoiceService) {
    }

    getFixedAssets(): Observable<MockFixedAsset[]> {
        return this._purchaseInvoiceService.getMockFixedAssets().pipe(
            map((res: any) => (res && res.data ? res.data : []) as MockFixedAsset[]),
            catchError(() => of([] as MockFixedAsset[]))
        );
    }
}
