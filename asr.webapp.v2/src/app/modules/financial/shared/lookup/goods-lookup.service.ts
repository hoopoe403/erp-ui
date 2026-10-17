import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PurchaseInvoiceService } from '../../invoices/purchase/purchase-invoice.service';

export interface GoodsOption {
    goodsId: number;
    goodsCode: string;
    goodsName: string;
}

/** One unit a goods is counted in. Exactly one per goods is the primary (base) unit, with conversion rate 1. */
export interface GoodsUnitOption {
    unitId: number;
    unitCode: string;
    unitName: string;
    isPrimary: boolean;
    conversionRate: number;
}

/**
 * Goods for an item line (lineType 'IT'), shown as "Raw Material" in the UI - goods will be
 * renamed to raw material later, so the code keeps the current name. Real inventory master
 * data (TBL_GOODS / TBL_GOODS_UNIT); erp-be only sends id/code/name, not the full goods.
 */
@Injectable({
    providedIn: 'root'
})
export class GoodsLookupService {

    constructor(private _purchaseInvoiceService: PurchaseInvoiceService) {
    }

    getGoods(): Observable<GoodsOption[]> {
        return this._purchaseInvoiceService.getGoods().pipe(
            map((res: any) => (res || []) as GoodsOption[]),
            catchError(() => of([] as GoodsOption[]))
        );
    }

    /** Primary unit first - the default for a line that picks this goods. */
    getGoodsUnits(goodsId: number): Observable<GoodsUnitOption[]> {
        return this._purchaseInvoiceService.getGoodsUnits(goodsId).pipe(
            map((res: any) => (res || []) as GoodsUnitOption[]),
            catchError(() => of([] as GoodsUnitOption[]))
        );
    }
}
