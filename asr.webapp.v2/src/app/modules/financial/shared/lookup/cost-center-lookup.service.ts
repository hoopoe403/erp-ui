import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiHelperService } from '../../../../../environments/api-helper.service';
import { CostCenterOption } from '../master-data.types';

/** Active cost centers (erp-be `costCenter`), plus the line-items table's quick add. */
@Injectable({
    providedIn: 'root'
})
export class CostCenterLookupService {

    private readonly _url = ApiHelperService.BASE_URL + 'financial/costCenter/';

    constructor(private _httpClient: HttpClient) {
    }

    getCostCenters(): Observable<CostCenterOption[]> {
        return this._httpClient.get<any[]>(this._url + 'drp/active').pipe(
            map((list) => (list || []).map((c) => this._toOption(c))),
            catchError(() => of([] as CostCenterOption[]))
        );
    }

    /** 201 - emits the created cost center; null if erp-be refused it. */
    addQuickCostCenter(code: string, name: string): Observable<CostCenterOption> {
        return this._httpClient.post<any>(this._url + 'create', { costCenterCode: code || null, costCenterName: name }).pipe(
            map((created) => (created ? this._toOption(created) : null)),
            catchError(() => of(null as CostCenterOption))
        );
    }

    private _toOption(c: any): CostCenterOption {
        return { costCenterId: c.costCenterId, costCenterCode: c.costCenterCode, costCenterName: c.costCenterName };
    }
}
