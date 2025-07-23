import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { GoodsInventory, GoodsInventoryHistory } from './goods-inventory.types';
import { ApiHelperService } from '../../../../../environments/api-helper.service';
import { Paging } from 'app/core/type/paging/paging.type';

@Injectable({
    providedIn: 'root'
})
export class GoodsInventoryService {

    private url: string = 'inventory/reports/goods/';
    private _pagination: BehaviorSubject<Paging | null> = new BehaviorSubject(null);
    private _goodsInventory: BehaviorSubject<GoodsInventory[] | null> = new BehaviorSubject(null);
    private _historyPagination: BehaviorSubject<Paging | null> = new BehaviorSubject(null);
    private _goodsInventoryHistory: BehaviorSubject<GoodsInventoryHistory[] | null> = new BehaviorSubject(null);
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


    get goodsInventory$(): Observable<GoodsInventory[]> {
        return this._goodsInventory.asObservable();
    }

    disposegoodsInventory$() {
        this._goodsInventory.next([]);
        //  this._expenses.complete();
    }

    disponsePaginator$() {
        this._pagination.next(null);
        // this._pagination.complete();
    }

    get historyPagination$(): Observable<Paging> {
        return this._historyPagination.asObservable();
    }


    get goodsInventoryHistory$(): Observable<GoodsInventoryHistory[]> {
        return this._goodsInventoryHistory.asObservable();
    }

    disposegoodsInventoryHistory$() {
        this._goodsInventoryHistory.next([]);
        //  this._expenses.complete();
    }

    disponseHistoryPaginator$() {
        this._historyPagination.next(null);
        // this._pagination.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    getGoodsInventory(goodsInventoryInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; goodsInventoryInfo: GoodsInventory[] }>(ApiHelperService.BASE_URL + this.url + 'findByObj', goodsInventoryInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._goodsInventory.next(response.data.goods);
            })
        );
    }

    getDrpWarehouse(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/warehouses').pipe(
            map((warehouse) => {
                return warehouse;
            }),
            switchMap((warehouse) => {

                if (!warehouse) {
                    return throwError('Could not found course with id of ' + '!');
                }

                return of(warehouse);
            })
        );
    }

    getDrpCover(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + 'inventory/reports/product/drp/cover').pipe(
            map((cover) => {
                return cover;
            }),
            switchMap((cover) => {

                if (!cover) {
                    return throwError('Could not found course with id of ' + '!');
                }

                return of(cover);
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

    getGoodsInventoryOnInit(goodsInventoryInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; goodsInventory: GoodsInventory[] }>(ApiHelperService.BASE_URL + this.url + 'findByObjOnInit', goodsInventoryInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._goodsInventory.next(response.data.goods);
            })
        );
    }




    getInventortHistory(goodsInventoryHistoryInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; goodsInventoryHistoryInfo: GoodsInventoryHistory[] }>(ApiHelperService.BASE_URL + this.url + 'obj/inventoryHistory', goodsInventoryHistoryInfo).pipe(
            tap((response) => {
                this._historyPagination.next(response.data.page);
                this._goodsInventoryHistory.next(response.data.history);
            })
        );
    }


    getWarehouseInventoryId(obj: any): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'obj/getWarehouseInventoryId', obj).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }

}
