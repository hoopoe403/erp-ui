import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { FinancialCategory } from './category.types';
import { ApiHelperService } from '../../../../environments/api-helper.service';
import { Paging } from 'app/core/type/paging/paging.type';

@Injectable({
    providedIn: 'root'
})
export class FinancialCategoryService {


    private url: string = 'financial/category/';
    private _pagination: BehaviorSubject<Paging | null> = new BehaviorSubject(null);
    private _categories: BehaviorSubject<FinancialCategory[] | null> = new BehaviorSubject(null);
    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient) {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    get pagination$(): Observable<Paging> {
        return this._pagination.asObservable();
    }


    get categories$(): Observable<FinancialCategory[]> {
        return this._categories.asObservable();
    }

    disposeCategories$() {
        this._categories.next([]);
        //  this._expenses.complete();
    }

    disponsePaginator$() {
        this._pagination.next(null);
        // this._pagination.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    getCategories(categoryInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; categories: FinancialCategory[] }>(ApiHelperService.BASE_URL + this.url + 'findByObj', categoryInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._categories.next(response.data.categories);
            })
        );
    }
    getCategoriesInOnInit(categoryInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; categories: FinancialCategory[] }>(ApiHelperService.BASE_URL + this.url + 'findByObjInOnInit', categoryInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._categories.next(response.data.categories);
            })
        );
    }

    create(category: FinancialCategory): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'create', category).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }

    edit(category: FinancialCategory): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'edit', category).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }
    getStatuses(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/statuses').pipe(
            map((data) => {
                return data;
            }),
            switchMap((data) => {

                if (!data) {
                    return throwError('Could not found course with id of ' + '!');
                }

                return of(data);
            })
        );
    }

    getCategoryTree(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'tree/category').pipe(
            map((data) => {
                return data;
            }),
            switchMap((data) => {

                if (!data) {
                    return throwError('Could not found course with id of ' + '!');
                }

                return of(data);
            })
        );
    }

    getProfitLossCategories(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/profitLossCategory').pipe(
            map((data) => {
                return data;
            }),
            switchMap((data) => {

                if (!data) {
                    return throwError('Could not found course with id of ' + '!');
                }

                return of(data);
            })
        );
    }
}
