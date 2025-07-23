import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { CustomerOrder, CustomerOrderDetail, OrderProductInfo } from './order.types';
import { ApiHelperService } from '../../../../environments/api-helper.service';
import { Paging } from 'app/core/type/paging/paging.type';
import { Customer } from 'app/modules/configuration/customer/customer/customer.types';
import { Product } from 'app/modules/configuration/branding/product/product.types';

@Injectable({
    providedIn: 'root'
})
export class OrderService {


    private url: string = 'sales/order/';
    private _pagination: BehaviorSubject<Paging | null> = new BehaviorSubject(null);
    private _orders: BehaviorSubject<CustomerOrder[] | null> = new BehaviorSubject(null);
    private _ordersDetails: BehaviorSubject<CustomerOrderDetail[] | null> = new BehaviorSubject(null)
    private expandedNodes = new BehaviorSubject<Set<number>>(new Set());
    private selectedPoducts = new Array<OrderProductInfo>();
    private selectedCustomerId = 0;
    private panelCovers = [];
    private frameCovers = [];
    private isActionDisabled: boolean = true;
    private customerControlValue: string = '';
    private products: any;
    isLoading: boolean = false;
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


    get orders$(): Observable<CustomerOrder[]> {
        return this._orders.asObservable();
    }
    get ordersDetails$(): Observable<CustomerOrderDetail[]> {
        return this._ordersDetails.asObservable();
    }

    disposeOrders$() {
        this._orders.next([]);
        //  this._expenses.complete();
    }
    disposeOrdersDetails$() {
        this._ordersDetails.next([]);
        //  this._expenses.complete();
    }
    disposePaginator$() {
        this._pagination.next(null);
        // this._pagination.complete();
    }

    disposeExpandedNodes() {
        this.expandedNodes.next(null);
    }
    disposeSelectedProducts() {
        this.selectedPoducts = [];
    }
    disposeProducts() {
        this.products = [];
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------


    getExpandedNodes() {
        return this.expandedNodes.asObservable();
    }

    setExpandedNodes(nodes: Set<number>) {
        this.expandedNodes.next(nodes);
    }
    getSelectedPoducts(): Array<OrderProductInfo> {
        return this.selectedPoducts;
    }

    setSelectedPoducts(products: Array<OrderProductInfo>) {
        this.selectedPoducts = products;
    }
    getSelectedCustomerId(): number {
        return this.selectedCustomerId;
    }
    setSelectedCustomerId(customerId: number) {
        this.selectedCustomerId = customerId;
    }
    setPanelCovers(panelCovers: Array<any>) {
        this.panelCovers = panelCovers;
    }
    getPanelCovers(): Array<any> {
        return this.panelCovers;
    }
    setFrameCovers(frameCovers: Array<any>) {
        this.frameCovers = frameCovers;
    }
    getFrameCovers(): Array<any> {
        return this.frameCovers;
    }

    setIsActionDisabled(isActionDisabled: boolean) {
        this.isActionDisabled = isActionDisabled;
    }
    getIsActionDisabled(): boolean {
        return this.isActionDisabled;
    }

    setCustomerControlValue(value: string) {
        this.customerControlValue = value.toUpperCase();
    }
    getCustomerControlValue(): string {
        return this.customerControlValue;
    }
    setProductList(products: any) {
        this.products = products;
    }
    getProductList(): any {
        return this.products;
    }
    getOrders(orderInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; orders: CustomerOrder[] }>(ApiHelperService.BASE_URL + this.url + 'findByObj', orderInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._orders.next(response.data.orders);
            })
        );
    }
    getOrderDetails(orderInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; orders: CustomerOrder[] }>(ApiHelperService.BASE_URL + this.url + 'findByObjDetail', orderInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._ordersDetails.next(response.data.orders);
            })
        );
    }

    getOrder(id: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + id).pipe(
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


    getOrdersInOnInit(orderInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; orders: CustomerOrder[] }>(ApiHelperService.BASE_URL + this.url + 'findByObjOnInit', orderInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._orders.next(response.data.orders);
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

    getCustomerOrders(orderInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; orders: CustomerOrder[] }>(ApiHelperService.BASE_URL + this.url + 'obj/getCustomerAcceptedSalesDepOrders', orderInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._orders.next(response.data.orders);
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

    revoke(orderInfo: CustomerOrder): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'revokeOrder', orderInfo).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }
    rollback(orderInfo: CustomerOrder): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'rollbackOrder', orderInfo).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }
    getProductsTreeBybrandId(brandId: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'tree/productByBrandId/' + brandId).pipe(
            map((products) => {
                return products;
            }),
            switchMap((products) => {

                if (!products) {
                    return throwError('Could not found course with id of ' + '!');
                }

                return of(products);
            })
        );
    }

    getCustomersWithFilter(customerInfo: any):
        Observable<any> {
        return this._httpClient.post<{ customer: Customer[] }>(ApiHelperService.BASE_URL + this.url + 'obj/customerWithFilter', customerInfo).pipe(
            tap((response) => {
                console.log(response);
            })
        );
    }
    getProductsInfo(obj: Product): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'obj/product/getProductsInfo', obj).pipe(
            tap((response) => {
                return response;
            })
        );
    }
    getProducts(obj: Product): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'obj/product', obj).pipe(
            tap((response) => {
                return response;
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
