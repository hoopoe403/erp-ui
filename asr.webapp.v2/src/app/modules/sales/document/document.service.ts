import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { CustomerOrder, CustomerOrderDetail } from '../order/order.types';
import { ApiHelperService } from '../../../../environments/api-helper.service';
import { Paging } from 'app/core/type/paging/paging.type';
import { Customer } from 'app/modules/configuration/customer/customer/customer.types';
import { RevokeRequest } from './document.types';

@Injectable({
    providedIn: 'root'
})
export class DocumentService {


    private url: string = 'sales/document/';
    private _pagination: BehaviorSubject<Paging | null> = new BehaviorSubject(null);
    private _documents: BehaviorSubject<CustomerOrder[] | null> = new BehaviorSubject(null);
    private _documentsDetails: BehaviorSubject<CustomerOrderDetail[] | null> = new BehaviorSubject(null)
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


    get documents$(): Observable<CustomerOrder[]> {
        return this._documents.asObservable();
    }
    get documentsDetails$(): Observable<CustomerOrderDetail[]> {
        return this._documentsDetails.asObservable();
    }

    disposeDocuments$() {
        this._documents.next([]);
        //  this._expenses.complete();
    }
    disposeDocumentsDetails$() {
        this._documentsDetails.next([]);
        //  this._expenses.complete();
    }
    disponsePaginator$() {
        this._pagination.next(null);
        // this._pagination.complete();
    }


    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    getDocuments(documentInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; documents: CustomerOrder[] }>(ApiHelperService.BASE_URL + this.url + 'findByObj', documentInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._documents.next(response.data.orders);
            })
        );
    }
    getDocumentsDetails(documentDetailInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; documents: CustomerOrderDetail[] }>(ApiHelperService.BASE_URL + this.url + 'findByObjDetail', documentDetailInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._documentsDetails.next(response.data.orders);
            })
        );
    }
    getDocument(id: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + id).pipe(
            map((document) => {
                return document;
            }),
            switchMap((document) => {

                if (!document) {
                    return throwError('Could not found course with id of ' + id + '!');
                }
                return of(document);
            })
        );
    }


    getDocumentsInOnInit(documentInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; documents: CustomerOrder[] }>(ApiHelperService.BASE_URL + this.url + 'findByObjOnInit', documentInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._documents.next(response.data.orders);
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

    getCustomerOrders(documentInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; documents: CustomerOrder[] }>(ApiHelperService.BASE_URL + this.url + 'obj/getCustomerAcceptedSalesDepOrders', documentInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._documents.next(response.data.orders);
            })
        );
    }
    getCustomerBudget(customerId: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'customerBudget/' + customerId).pipe(
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

    getStatusHistory(orderId: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'statusHistory/' + orderId).pipe(
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
    getContractors(goodsInfo: any): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + 'configuration/contractor/' + 'findByObj', goodsInfo).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }

    paymentAdjustment(orderInfo: CustomerOrder): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'paymentAdjustment', orderInfo).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }
    getOrder(id: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'getCustomerOrderInfo/' + id).pipe(
            map((customerOrder) => {
                return customerOrder;
            }),
            switchMap((customerOrder) => {

                if (!customerOrder) {
                    return throwError('Could not found course with id of ' + id + '!');
                }
                return of(customerOrder);
            })
        );
    }
    confirmSalesDep(orderInfo: CustomerOrder): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'confirmSalesDep', orderInfo).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }

    confirmPayment(orderInfo: CustomerOrder): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'confirmPayment', orderInfo).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }

    revoke(orderInfo: RevokeRequest): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'revokeOrder', orderInfo).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }
    rollback(orderInfo: RevokeRequest): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'rollbackOrder', orderInfo).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }
    async getDocumentsWithoutPaging(documentInfo: CustomerOrder): Promise<any[]> {
        let responses: any[] = [];
        const obj: CustomerOrder = { ...documentInfo };
        const page: Paging = new Paging();
        page.length = documentInfo.page.length;
        page.order = documentInfo.page.order;
        page.sort = documentInfo.page.sort;
        page.pageSize = 2000;
        page.flag = false;
        obj.page = page;
        const numberOfAPIRequests = Math.ceil(obj.page.length / obj.page.pageSize); // Number of API requests
        for (let i = 1; i <= numberOfAPIRequests; i++) {
            obj.page.pageNumber = i;
            const response = await this._httpClient.post<{ data: any }>(ApiHelperService.BASE_URL + this.url + 'findByObj', obj).toPromise();
            responses.push(response.data.orders);
        }
        return responses;
    }
    async getDocumentsForDownloadingFile(documentInfo: CustomerOrder): Promise<any[]> {
        const responses = await this.getDocumentsWithoutPaging(documentInfo);
        return [].concat(...responses);
    }
    async getDocumentsDetailWithoutPaging(documentDetailInfo: CustomerOrderDetail): Promise<any[]> {
        let responses: any[] = [];
        const obj: CustomerOrderDetail = { ...documentDetailInfo };
        const page: Paging = new Paging();
        page.length = documentDetailInfo.page.length;
        page.order = documentDetailInfo.page.order;
        page.sort = documentDetailInfo.page.sort;
        page.pageSize = 2000;
        page.flag = false;
        obj.page = page;
        const numberOfAPIRequests = await Math.ceil(obj.page.length / obj.page.pageSize); // Number of API requests
        for (let i = 1; i <= numberOfAPIRequests; i++) {
            obj.page.pageNumber = i;
            const response = await this._httpClient.post<{ data: any }>(ApiHelperService.BASE_URL + this.url + 'findByObjDetail', obj).toPromise();
            responses.push(response.data.orders);
        }
        return responses;
    }

    async getDocumentsDetailForDownloadingFile(documentDetailInfo: CustomerOrderDetail): Promise<any[]> {
        const responses = await this.getDocumentsDetailWithoutPaging(documentDetailInfo);
        return [].concat(...responses);
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
