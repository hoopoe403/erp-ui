import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiHelperService } from '../../../../../environments/api-helper.service';
import { FixedAssetOption } from '../master-data.types';

/** Active fixed assets (erp-be `fixedAsset`). */
@Injectable({
    providedIn: 'root'
})
export class FixedAssetLookupService {

    private readonly _url = ApiHelperService.BASE_URL + 'financial/fixedAsset/drp/list';

    constructor(private _httpClient: HttpClient) {
    }

    getFixedAssets(): Observable<FixedAssetOption[]> {
        return this._httpClient.get<any[]>(this._url).pipe(
            map((assets) => (assets || []).map((a): FixedAssetOption => ({
                fixedAssetId: a.fixedAssetId,
                fixedAssetCode: a.fixedAssetCode,
                fixedAssetName: a.fixedAssetName
            }))),
            catchError(() => of([] as FixedAssetOption[]))
        );
    }
}
