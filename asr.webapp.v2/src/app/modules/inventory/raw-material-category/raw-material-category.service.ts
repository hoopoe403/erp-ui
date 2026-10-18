import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import {
    RAW_MATERIAL_CATEGORY_STATUSES, RawMaterialCategory, RawMaterialCategorySearch, RawMaterialCategoryStatus, withCategoryStatusInfo
} from './raw-material-category.types';
import { ApiHelperService } from '../../../../environments/api-helper.service';
import { Paging } from 'app/core/type/paging/paging.type';

/**
 * Inventory Raw material category API. These endpoints return the resource itself (no
 * `{ succeed, message, data }` envelope); failures are RFC 7807 problems - see `errorMessage`.
 */
@Injectable({
    providedIn: 'root'
})
export class RawMaterialCategoryService {

    private url: string = 'inventory/rawMaterialCategory/';
    private _pagination: BehaviorSubject<Paging | null> = new BehaviorSubject(null);
    private _categories: BehaviorSubject<RawMaterialCategory[] | null> = new BehaviorSubject(null);

    constructor(private _httpClient: HttpClient) {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    get pagination$(): Observable<Paging> {
        return this._pagination.asObservable();
    }

    get categories$(): Observable<RawMaterialCategory[]> {
        return this._categories.asObservable();
    }

    disposeCategories$() {
        this._categories.next([]);
    }

    disposePaginator$() {
        this._pagination.next(null);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Raw material category
    // -----------------------------------------------------------------------------------------------------

    getCategories(search: RawMaterialCategorySearch): Observable<{ rawMaterialCategories: RawMaterialCategory[]; page: Paging }> {
        return this._httpClient.post<{ rawMaterialCategories: RawMaterialCategory[]; page: Paging }>(ApiHelperService.BASE_URL + this.url + 'findByObj', search).pipe(
            tap(response => (response.rawMaterialCategories || []).forEach(withCategoryStatusInfo)),
            tap((response) => {
                this._pagination.next(response.page);
                this._categories.next(response.rawMaterialCategories);
            })
        );
    }

    getCategoriesOnInit(search: RawMaterialCategorySearch): Observable<{ rawMaterialCategories: RawMaterialCategory[]; page: Paging }> {
        return this._httpClient.post<{ rawMaterialCategories: RawMaterialCategory[]; page: Paging }>(ApiHelperService.BASE_URL + this.url + 'findByObjInOnInit', search).pipe(
            tap(response => (response.rawMaterialCategories || []).forEach(withCategoryStatusInfo)),
            tap((response) => {
                this._pagination.next(response.page);
                this._categories.next(response.rawMaterialCategories);
            })
        );
    }

    getCategory(id: number): Observable<RawMaterialCategory> {
        return this._httpClient.get<RawMaterialCategory>(ApiHelperService.BASE_URL + this.url + id).pipe(
            map(withCategoryStatusInfo)
        );
    }

    /** Every category in full-code (tree) order - the tree page and the parent dropdown. */
    getAllCategories(): Observable<RawMaterialCategory[]> {
        return this._httpClient.get<RawMaterialCategory[]>(ApiHelperService.BASE_URL + this.url + 'drp/list').pipe(
            map(categories => (categories || []).map(withCategoryStatusInfo))
        );
    }

    createCategory(category: RawMaterialCategory): Observable<RawMaterialCategory> {
        return this._httpClient.post<RawMaterialCategory>(ApiHelperService.BASE_URL + this.url + 'create', category).pipe(
            map(withCategoryStatusInfo)
        );
    }

    editCategory(category: RawMaterialCategory): Observable<RawMaterialCategory> {
        return this._httpClient.post<RawMaterialCategory>(ApiHelperService.BASE_URL + this.url + 'edit', category).pipe(
            map(withCategoryStatusInfo)
        );
    }

    getStatuses(): Observable<RawMaterialCategoryStatus[]> {
        return of(RAW_MATERIAL_CATEGORY_STATUSES);
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
}
