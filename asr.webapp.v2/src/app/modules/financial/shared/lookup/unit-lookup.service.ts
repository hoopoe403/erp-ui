import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiHelperService } from '../../../../../environments/api-helper.service';
import { LookupOption } from '../lookup-option.type';

export interface UnitOption {
    unitId: number;
    unitCode: string;
    unitName: string;
    abbreviation: string;
}

/**
 * A unit as a dropdown entry: its abbreviation ("pcs", "h") as the short code, since erp-be's
 * unit code is just a number - falls back to that number for a unit without an abbreviation.
 */
export function toUnitLookupOption(unit: UnitOption): LookupOption {
    return { id: unit.unitId, code: unit.abbreviation || unit.unitCode, name: unit.unitName };
}

/** Active units (erp-be `shared/unit`), plus the line-items table's quick add. */
@Injectable({
    providedIn: 'root'
})
export class UnitLookupService {

    private readonly _url = ApiHelperService.BASE_URL + 'shared/unit/';

    constructor(private _httpClient: HttpClient) {
    }

    getUnits(): Observable<UnitOption[]> {
        return this._httpClient.get<any[]>(this._url + 'drp/active').pipe(
            map((list) => (list || []).map((u) => this._toOption(u))),
            catchError(() => of([] as UnitOption[]))
        );
    }

    /** 201 - emits the created unit; null if erp-be refused it. erp-be unit codes are numbers. */
    addQuickUnit(code: string, name: string): Observable<UnitOption> {
        const numericCode = code && /^\d+$/.test(code.trim()) ? Number(code.trim()) : null;
        return this._httpClient.post<any>(this._url + 'create', { unitCode: numericCode, unitName: name }).pipe(
            map((created) => (created ? this._toOption(created) : null)),
            catchError(() => of(null as UnitOption))
        );
    }

    private _toOption(u: any): UnitOption {
        return {
            unitId: u.unitId,
            unitCode: u.unitCode != null ? String(u.unitCode) : '',
            unitName: u.unitName,
            abbreviation: u.abbreviation
        };
    }
}
