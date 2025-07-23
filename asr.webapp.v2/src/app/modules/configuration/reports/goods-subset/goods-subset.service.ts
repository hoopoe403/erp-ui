import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { GoodsSubset } from './goods-subset.types';
import { ApiHelperService } from '../../../../../environments/api-helper.service';
import { Paging } from 'app/core/type/paging/paging.type';

@Injectable({
    providedIn: 'root'
})
export class GoodsSubsetService {

    private url: string = 'configuration/reports/goodsSubset/';
    private _pagination: BehaviorSubject<Paging | null> = new BehaviorSubject(null);
    private _goodsSubset: BehaviorSubject<GoodsSubset[] | null> = new BehaviorSubject(null);
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


    get goodsSubset$(): Observable<GoodsSubset[]> {
        return this._goodsSubset.asObservable();
    }

    disposeGoodsSubset$() {
        this._goodsSubset.next([]);
        //  this._expenses.complete();
    }

    disponsePaginator$() {
        this._pagination.next(null);
        // this._pagination.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    getGoodsSubset(goodsSubsetInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; goodsSubsetInfo: GoodsSubset[] }>(ApiHelperService.BASE_URL + this.url + 'findByObj', goodsSubsetInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._goodsSubset.next(response.data.subsets);
            })
        );
    }



    getGoodsCats(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'tree/goodsCat').pipe(
            map((cats) => {
                return cats;
            }),
            switchMap((cats) => {

                if (!cats) {
                    return throwError('Could not found course with id of ' + '!');
                }

                return of(cats);
            })
        );
    }
    getDrpBrands(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/brand').pipe(
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


    getDrpUnits(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/unit').pipe(
            map((unit) => {
                return unit;
            }),
            switchMap((unit) => {

                if (!unit) {
                    return throwError('Could not found course with id of ' + '!');
                }

                return of(unit);
            })
        );
    }

    getDrpGoodsServices(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/service').pipe(
            map((service) => {
                return service;
            }),
            switchMap((service) => {

                if (!service) {
                    return throwError('Could not found course with id of ' + '!');
                }

                return of(service);
            })
        );
    }


    async getGoodsSubsetsWithoutPaging(goodsSubsetInfo: GoodsSubset): Promise<any[]> {
        let responses: any[] = [];
        const obj: GoodsSubset = { ...goodsSubsetInfo };
        const page: Paging = new Paging();
        page.length = goodsSubsetInfo.page.length;
        page.order = goodsSubsetInfo.page.order;
        page.sort = goodsSubsetInfo.page.sort;
        page.pageSize = 2000;
        page.flag = false;
        obj.page = page;
        const numberOfAPIRequests = Math.ceil(obj.page.length / obj.page.pageSize); // Number of API requests
        for (let i = 1; i <= numberOfAPIRequests; i++) {
            obj.page.pageNumber = i;
            const response = await this._httpClient.post<{ data: any }>(ApiHelperService.BASE_URL + this.url + 'findByObj', obj).toPromise();
            responses.push(response.data.subsets);
        }
        return responses;
    }
    async getGoodsSubsetForDownloadingFile(goodsSubsetInfo: GoodsSubset): Promise<any[]> {
        const responses = await this.getGoodsSubsetsWithoutPaging(goodsSubsetInfo);
        return [].concat(...responses);
    }

}
