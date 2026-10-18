import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiHelperService } from '../../../../environments/api-helper.service';
import { Paging } from 'app/core/type/paging/paging.type';
import { withStatusInfo } from '../attribute/attribute.types';
import { RawMaterial, RawMaterialSearch, RAW_MATERIAL_STATUSES } from './raw-material.types';

/**
 * Inventory Raw Material API. These endpoints return the resource itself (no `{ succeed, message, data }`
 * envelope); failures are RFC 7807 problems - see `errorMessage`. A raw material is saved with its attribute
 * values in one call. Attributes and their list values come from `ProductService`/`ProductCategoryService`,
 * accounts from `GoodsService` and units from `AttributeService` - the same lookups the other inventory forms use.
 */
@Injectable({
    providedIn: 'root'
})
export class RawMaterialService {

    private url: string = 'inventory/rawMaterial/';
    private _pagination: BehaviorSubject<Paging | null> = new BehaviorSubject(null);
    private _rawMaterials: BehaviorSubject<RawMaterial[] | null> = new BehaviorSubject(null);

    constructor(private _httpClient: HttpClient) {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    get pagination$(): Observable<Paging> {
        return this._pagination.asObservable();
    }

    get rawMaterials$(): Observable<RawMaterial[]> {
        return this._rawMaterials.asObservable();
    }

    disposeRawMaterials$() {
        this._rawMaterials.next([]);
    }

    disposePaginator$() {
        this._pagination.next(null);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Raw Material
    // -----------------------------------------------------------------------------------------------------

    getRawMaterials(search: RawMaterialSearch): Observable<{ rawMaterials: RawMaterial[]; page: Paging }> {
        return this.searchRawMaterials('findByObj', search);
    }

    getRawMaterialsOnInit(search: RawMaterialSearch): Observable<{ rawMaterials: RawMaterial[]; page: Paging }> {
        return this.searchRawMaterials('findByObjInOnInit', search);
    }

    getRawMaterial(id: number): Observable<RawMaterial> {
        return this._httpClient.get<RawMaterial>(ApiHelperService.BASE_URL + this.url + id).pipe(map(withStatusInfo));
    }

    createRawMaterial(rawMaterial: RawMaterial): Observable<RawMaterial> {
        return this._httpClient.post<RawMaterial>(ApiHelperService.BASE_URL + this.url + 'create', rawMaterial).pipe(map(withStatusInfo));
    }

    editRawMaterial(rawMaterial: RawMaterial): Observable<RawMaterial> {
        return this._httpClient.post<RawMaterial>(ApiHelperService.BASE_URL + this.url + 'edit', rawMaterial).pipe(map(withStatusInfo));
    }

    getStatuses(): Observable<any[]> {
        return of(RAW_MATERIAL_STATUSES);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Helpers
    // -----------------------------------------------------------------------------------------------------

    /** The human-readable message of an RFC 7807 problem (400 validation, 404, 409), or a generic fallback. */
    errorMessage(error: any): string {
        if (error instanceof HttpErrorResponse && error.error) {
            return error.error.detail || error.error.title || error.message;
        }
        return 'Something went wrong. Please try again.';
    }

    private searchRawMaterials(path: string, search: RawMaterialSearch): Observable<{ rawMaterials: RawMaterial[]; page: Paging }> {
        return this._httpClient.post<{ rawMaterials: RawMaterial[]; page: Paging }>(ApiHelperService.BASE_URL + this.url + path, search).pipe(
            tap((response) => {
                (response.rawMaterials || []).forEach(withStatusInfo);
                this._pagination.next(response.page);
                this._rawMaterials.next(response.rawMaterials);
            })
        );
    }
}
