import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiHelperService } from '../../../../../environments/api-helper.service';
import { AccountOption } from '../master-data.types';

/**
 * The postable accounts of the chart of accounts (erp-be `accountChart`). The chart is a
 * tree; only its leaves can carry an invoice line, so parent accounts are left out. Each
 * account shows its full code (parent codes included) so similar child codes stay apart.
 */
@Injectable({
    providedIn: 'root'
})
export class GlAccountLookupService {

    private readonly _url = ApiHelperService.BASE_URL + 'financial/accountChart/drp/active';

    constructor(private _httpClient: HttpClient) {
    }

    getGlAccounts(): Observable<AccountOption[]> {
        return this._httpClient.get<any[]>(this._url).pipe(
            map((accounts) => {
                const list = accounts || [];
                const parentIds = new Set(list.map((a) => a.parentId).filter((id) => id != null));
                return list
                    .filter((a) => !parentIds.has(a.accountChartId))
                    .map((a): AccountOption => ({
                        accountId: a.accountChartId,
                        accountCode: a.fullCode || a.accountChartCode,
                        accountName: a.accountChartName
                    }));
            }),
            catchError(() => of([] as AccountOption[]))
        );
    }
}
