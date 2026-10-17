import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiHelperService } from '../../../../../environments/api-helper.service';

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
 * Goods for a purchase invoice item line (lineType 'IT'), shown as "Raw Material" in the UI -
 * goods will be renamed to raw material later, so the code keeps the current name. Real
 * inventory master data (TBL_GOODS / TBL_GOODS_UNIT); erp-be only sends id/code/name.
 */
@Injectable({
    providedIn: 'root'
})
export class GoodsLookupService {

    private readonly _url = ApiHelperService.BASE_URL + 'financial/purchaseInvoice/drp/goods';

    constructor(private _httpClient: HttpClient) {
    }

    getGoods(): Observable<GoodsOption[]> {
        return this._httpClient.get<GoodsOption[]>(this._url).pipe(
            catchError(() => of([] as GoodsOption[]))
        );
    }

    /** Primary unit first - the default for a line that picks this goods. */
    getGoodsUnits(goodsId: number): Observable<GoodsUnitOption[]> {
        return this._httpClient.get<GoodsUnitOption[]>(this._url + '/' + goodsId + '/units').pipe(
            catchError(() => of([] as GoodsUnitOption[]))
        );
    }
}
