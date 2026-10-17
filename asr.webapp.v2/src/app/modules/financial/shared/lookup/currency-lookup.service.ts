import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiHelperService } from '../../../../../environments/api-helper.service';
import { CurrencyOption } from '../master-data.types';

/** Active currencies (erp-be `currency`). */
@Injectable({
    providedIn: 'root'
})
export class CurrencyLookupService {

    private readonly _url = ApiHelperService.BASE_URL + 'financial/currency/drp/list';

    constructor(private _httpClient: HttpClient) {
    }

    getCurrencies(): Observable<CurrencyOption[]> {
        return this._httpClient.get<any[]>(this._url).pipe(
            map((list) => (list || []).map((c): CurrencyOption => ({
                currencyId: c.currencyId, currencyCode: c.currencyCode, currencyName: c.currencyName
            }))),
            catchError(() => of([] as CurrencyOption[]))
        );
    }
}
