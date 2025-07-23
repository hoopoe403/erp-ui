import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { FactoryOrder } from './factory-order.types';
import { ApiHelperService } from '../../../../environments/api-helper.service';
import { Paging } from 'app/core/type/paging/paging.type';
import { Goods } from 'app/modules/inventory/goods/goods/goods.types';

@Injectable({
    providedIn: 'root'
})
export class FactoryOrderService {

    private url: string = 'production/factoryOrder/';
    private _pagination: BehaviorSubject<Paging | null> = new BehaviorSubject(null);
    private _factoryOrder: BehaviorSubject<FactoryOrder[] | null> = new BehaviorSubject(null);
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


    get factoryOrders$(): Observable<FactoryOrder[]> {
        return this._factoryOrder.asObservable();
    }

    disposefactoryOrders$() {
        this._factoryOrder.next([]);
        //  this._expenses.complete();
    }

    disponsePaginator$() {
        this._pagination.next(null);
        // this._pagination.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    getFactoryOrders(factoryOrderInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; factoryOrderInfo: FactoryOrder[] }>(ApiHelperService.BASE_URL + this.url + 'findByObj', factoryOrderInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._factoryOrder.next(response.data.factoryOrders);
            })
        );
    }
    getFactoryOrder(id: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + id).pipe(
            map((factoryOrder) => {
                return factoryOrder;
            }),
            switchMap((factoryOrder) => {

                if (!factoryOrder) {
                    return throwError('Could not found course with id of ' + id + '!');
                }
                return of(factoryOrder);
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

    getFactoryOrdernInit(factoryOrderInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; factoryOrder: FactoryOrder[] }>(ApiHelperService.BASE_URL + this.url + 'findByObjOnInit', factoryOrderInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._factoryOrder.next(response.data.factoryOrders);
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
    getPurchasers(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/purchasers').pipe(
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
    getActiveGoods(goodsInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; factoryOrder: FactoryOrder[] }>(ApiHelperService.BASE_URL + this.url + 'obj/goods', goodsInfo).pipe();
    }

    getUnits(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'obj/units').pipe(
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
    getGoodsServices(goodsServiceInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; factoryOrder: FactoryOrder[] }>(ApiHelperService.BASE_URL + this.url + 'obj/goodsService', goodsServiceInfo).pipe();
    }


    getContractors(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/contractor').pipe(
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
    getOwners(issuerTypeId: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'obj/owners/' + issuerTypeId).pipe(
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
    create(factoryOrder: FactoryOrder): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'create', factoryOrder).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }
    edit(factoryOrder: FactoryOrder): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'edit', factoryOrder).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }
    getGoodsUsingPaging(goodsInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; goods: Goods[] }>(ApiHelperService.BASE_URL + 'configuration/branding/brand/obj/goods/findByObjUsingPaging', goodsInfo).pipe();
    }
    getContractorFactoryOrder(contractorId: number, purchaserId: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'contractorFactoryOrder' + '/' + contractorId + '/' + purchaserId).pipe(
            map((contractorfactoryOrder) => {
                return contractorfactoryOrder;
            }),
            switchMap((contractorfactoryOrder) => {

                if (!contractorfactoryOrder) {
                    return throwError('Could not found course with id of ' + contractorId + purchaserId + '!');
                }
                return of(contractorfactoryOrder);
            })
        );
    }
    editFactoryOrderContractor(orderInfo: any) {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'editFactoryOrderContractor', orderInfo).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }
    getContractorFactoryOrderGoods(factoryOrder: any) {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'obj/contractorFactoryOrderGoods', factoryOrder).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }

}
