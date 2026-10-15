import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import {
    PRODUCT_CATEGORY_STATUSES, ProductCategory, ProductCategorySearch, ProductCategoryStatus, withCategoryStatusInfo
} from './product-category.types';
import { ApiHelperService } from '../../../../environments/api-helper.service';
import { Paging } from 'app/core/type/paging/paging.type';
import { Attribute, withStatusInfo } from '../attribute/attribute.types';

/**
 * Inventory Product Category API. These endpoints return the resource itself (no
 * `{ succeed, message, data }` envelope); failures are RFC 7807 problems - see `errorMessage`.
 */
@Injectable({
    providedIn: 'root'
})
export class ProductCategoryService {

    private url: string = 'inventory/productCategory/';
    private _pagination: BehaviorSubject<Paging | null> = new BehaviorSubject(null);
    private _categories: BehaviorSubject<ProductCategory[] | null> = new BehaviorSubject(null);

    constructor(private _httpClient: HttpClient) {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    get pagination$(): Observable<Paging> {
        return this._pagination.asObservable();
    }

    get categories$(): Observable<ProductCategory[]> {
        return this._categories.asObservable();
    }

    disposeCategories$() {
        this._categories.next([]);
    }

    disposePaginator$() {
        this._pagination.next(null);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Product Category
    // -----------------------------------------------------------------------------------------------------

    getCategories(search: ProductCategorySearch): Observable<{ productCategories: ProductCategory[]; page: Paging }> {
        return this._httpClient.post<{ productCategories: ProductCategory[]; page: Paging }>(ApiHelperService.BASE_URL + this.url + 'findByObj', search).pipe(
            tap(response => (response.productCategories || []).forEach(withCategoryStatusInfo)),
            tap((response) => {
                this._pagination.next(response.page);
                this._categories.next(response.productCategories);
            })
        );
    }

    getCategoriesOnInit(search: ProductCategorySearch): Observable<{ productCategories: ProductCategory[]; page: Paging }> {
        return this._httpClient.post<{ productCategories: ProductCategory[]; page: Paging }>(ApiHelperService.BASE_URL + this.url + 'findByObjInOnInit', search).pipe(
            tap(response => (response.productCategories || []).forEach(withCategoryStatusInfo)),
            tap((response) => {
                this._pagination.next(response.page);
                this._categories.next(response.productCategories);
            })
        );
    }

    getCategory(id: number): Observable<ProductCategory> {
        return this._httpClient.get<ProductCategory>(ApiHelperService.BASE_URL + this.url + id).pipe(
            map(withCategoryStatusInfo)
        );
    }

    /** Every category in full-code (tree) order - the tree page and the parent dropdown. */
    getAllCategories(): Observable<ProductCategory[]> {
        return this._httpClient.get<ProductCategory[]>(ApiHelperService.BASE_URL + this.url + 'drp/list').pipe(
            map(categories => (categories || []).map(withCategoryStatusInfo))
        );
    }

    createCategory(category: ProductCategory): Observable<ProductCategory> {
        return this._httpClient.post<ProductCategory>(ApiHelperService.BASE_URL + this.url + 'create', category).pipe(
            map(withCategoryStatusInfo)
        );
    }

    editCategory(category: ProductCategory): Observable<ProductCategory> {
        return this._httpClient.post<ProductCategory>(ApiHelperService.BASE_URL + this.url + 'edit', category).pipe(
            map(withCategoryStatusInfo)
        );
    }

    getStatuses(): Observable<ProductCategoryStatus[]> {
        return of(PRODUCT_CATEGORY_STATUSES);
    }

    /** Every attribute in code order - what a category's attributes are picked from. */
    getAttributes(): Observable<Attribute[]> {
        return this._httpClient.get<Attribute[]>(ApiHelperService.BASE_URL + 'inventory/attribute/drp/list').pipe(
            map(attributes => (attributes || []).map(withStatusInfo))
        );
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
