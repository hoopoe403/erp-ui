import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { CustomerOrder, CustomerOrderDetail } from '../order/order.types';
import { ApiHelperService } from '../../../../environments/api-helper.service';
import { Paging } from 'app/core/type/paging/paging.type';

@Injectable({
    providedIn: 'root'
})
export class ShippedConfirmationService {


    private url: string = 'sales/ShippedConfirmation/';
    private _pagination: BehaviorSubject<Paging | null> = new BehaviorSubject(null);
    private _shippedList: BehaviorSubject<CustomerOrder[] | null> = new BehaviorSubject(null);
    private _shippedListDetail: BehaviorSubject<CustomerOrderDetail[] | null> = new BehaviorSubject(null);

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


    get shippedList$(): Observable<CustomerOrder[]> {
        return this._shippedList.asObservable();
    }
    get shipedListDetail$(): Observable<CustomerOrderDetail[]> {
        return this._shippedListDetail.asObservable();
    }


    disposeShippedList$() {
        this._shippedList.next([]);
        //  this._expenses.complete();
    }

    disposeShippedListDetail$() {
        this._shippedListDetail.next([]);
        //  this._expenses.complete();
    }

    disponsePaginator$() {
        this._pagination.next(null);
        // this._pagination.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    getShippedList(shippedInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; shippedList: CustomerOrder[] }>(ApiHelperService.BASE_URL + this.url + 'findByObj', shippedInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._shippedList.next(response.data.orders);
            })
        );
    }
    getShippedListDetail(shippedDetailInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; shippedListDetail: CustomerOrderDetail[] }>(ApiHelperService.BASE_URL + this.url + 'findByObjDetail', shippedDetailInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._shippedListDetail.next(response.data.orders);
            })
        );
    }
    getShippedListInOnInit(shippedInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; shipedList: CustomerOrder[] }>(ApiHelperService.BASE_URL + this.url + 'findByObjInOnInit', shippedInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._shippedList.next(response.data.orders);
            })
        );
    }


    getOrderInfo(id: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'obj/order/' + id).pipe(
            map((order) => {
                return order;
            }),
            switchMap((order) => {

                if (!order) {
                    return throwError('Could not found course with id of ' + id + '!');
                }

                return of(order);
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
    getBrands(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/brands').pipe(
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

    getCovers(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/cover').pipe(
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


    getCustomerInfo(customerId: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'obj/customer/' + customerId).pipe(
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
    getDrpProductType(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/productType').pipe(
            map((ProductType) => {
                return ProductType;
            }),
            switchMap((ProductType) => {

                if (!ProductType) {
                    return throwError('Could not found course with id of ' + '!');
                }

                return of(ProductType);
            })
        );
    }

    getDroOrganization(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/organizations').pipe(
            map((organizations) => {
                return organizations;
            }),
            switchMap((organizations) => {

                if (!organizations) {
                    return throwError('Could not found course with id of ' + '!');
                }

                return of(organizations);
            })
        );
    }
    confirm(orderInfo: CustomerOrder): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'confirm', orderInfo).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }
    confirmByList(orderInfo: CustomerOrder): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'confirmByList', orderInfo).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }
    getFinancialYears(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/years').pipe(
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
    getDrpCustomerType(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/customerType').pipe(
            map((CustomerType) => {
                return CustomerType;
            }),
            switchMap((CustomerType) => {

                if (!CustomerType) {
                    return throwError('Could not found course with id of ' + '!');
                }

                return of(CustomerType);
            })
        );
    }
}
