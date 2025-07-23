import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { ProductInventory } from './product-inventory.types';
import { ApiHelperService } from '../../../../../environments/api-helper.service';
import { Paging } from 'app/core/type/paging/paging.type';

@Injectable({
    providedIn: 'root'
})
export class ProductInventoryService {


    private url: string = 'inventory/reports/product/';
    private _pagination: BehaviorSubject<Paging | null> = new BehaviorSubject(null);
    private _productInventories: BehaviorSubject<ProductInventory[] | null> = new BehaviorSubject(null);
    private _productInventoriesDetails: BehaviorSubject<ProductInventory[] | null> = new BehaviorSubject(null);
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



    get productInventories$(): Observable<ProductInventory[]> {
        return this._productInventories.asObservable();
    }

    get productInventoriesDetails$(): Observable<ProductInventory[]> {
        return this._productInventoriesDetails.asObservable();
    }


    disposeProductInventorys$() {
        this._productInventories.next([]);
        //  this._expenses.complete();
    }

    disposeProductInventorysDetails$() {
        this._productInventoriesDetails.next([]);
        //  this._expenses.complete();
    }



    disponsePaginator$() {
        this._pagination.next(null);
        // this._pagination.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    getProductInventoryOnInit(productInventoryInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; productInventories: ProductInventory[] }>(ApiHelperService.BASE_URL + this.url + 'findByObjOnInit', productInventoryInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._productInventories.next(response.data.products);
            })
        );
    }

    getProductInventory(productInventoryInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; productInventories: ProductInventory[] }>(ApiHelperService.BASE_URL + this.url + 'findByObj', productInventoryInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._productInventories.next(response.data.products);
            })
        );
    }
    getProductInventoryDetails(productInventoryInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; productInventoriesDetails: ProductInventory[] }>(ApiHelperService.BASE_URL + this.url + 'findByObjDetail', productInventoryInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._productInventoriesDetails.next(response.data.products);
            })
        );
    }

    getNumberOfDistinctProducts(productInventoryInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; productInventories: ProductInventory[] }>(ApiHelperService.BASE_URL + this.url + 'summary/numberOfDistinctProducts', productInventoryInfo).pipe(
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
    getAccumulativeSummary(productInventoryInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; productInventories: ProductInventory[] }>(ApiHelperService.BASE_URL + this.url + 'summary/accumulative', productInventoryInfo).pipe(
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

    getStatuses(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/statuses').pipe(
            map((status) => {
                return status;
            }),
            switchMap((status) => {

                if (!status) {
                    return throwError('Could not found course with id of ' + '!');
                }

                return of(status);
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
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/cover').pipe(
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

    getDrpBrand(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/brand').pipe(
            map((brand) => {
                return brand;
            }),
            switchMap((brand) => {

                if (!brand) {
                    return throwError('Could not found course with id of ' + '!');
                }

                return of(brand);
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


    getCustomerOrder(id: number): any {
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
    getDepotInfo(id: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'getDepotInfo/' + id).pipe(
            map((depot) => {
                return depot;
            }),
            switchMap((depot) => {

                if (!depot) {
                    return throwError('Could not found course with id of ' + id + '!');
                }
                return of(depot);
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

    getTransferInfo(transferDetailId: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'obj/transfer/' + transferDetailId).pipe(
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
    async getProductInventoryDetailsWithoutPaging(productInventoryDetailInfo: ProductInventory): Promise<any[]> {
        let responses: any[] = [];
        const obj: ProductInventory = { ...productInventoryDetailInfo };
        const page: Paging = new Paging();
        page.length = productInventoryDetailInfo.page.length;
        page.order = productInventoryDetailInfo.page.order;
        page.sort = productInventoryDetailInfo.page.sort;
        page.pageSize = 2000;
        page.flag = false;
        obj.page = page;
        const numberOfAPIRequests = Math.ceil(obj.page.length / obj.page.pageSize); // Number of API requests
        for (let i = 1; i <= numberOfAPIRequests; i++) {
            obj.page.pageNumber = i;
            const response = await this._httpClient.post<{ data: any }>(ApiHelperService.BASE_URL + this.url + 'findByObjDetail', obj).toPromise();
            responses.push(response.data.products);


        }
        return responses;
    }
    async getProductInventoryDetailsForDownloadingFile(productInventoryDetailInfo: ProductInventory): Promise<any[]> {
        const responses = await this.getProductInventoryDetailsWithoutPaging(productInventoryDetailInfo);
        return [].concat(...responses);
    }

    async getProductInventoriesWithoutPaging(productInventoryInfo: ProductInventory): Promise<any[]> {
        let responses: any[] = [];
        const obj: ProductInventory = { ...productInventoryInfo };
        const page: Paging = new Paging();
        page.length = productInventoryInfo.page.length;
        page.order = productInventoryInfo.page.order;
        page.sort = productInventoryInfo.page.sort;
        page.pageSize = 2000;
        page.flag = false;
        obj.page = page;
        const numberOfAPIRequests = Math.ceil(obj.page.length / obj.page.pageSize); // Number of API requests
        for (let i = 1; i <= numberOfAPIRequests; i++) {
            obj.page.pageNumber = i;
            const response = await this._httpClient.post<{ data: any }>(ApiHelperService.BASE_URL + this.url + 'findByObj', obj).toPromise();
            responses.push(response.data.products);
        }
        return responses;
    }
    async getProductInventoriesForDownloadingFile(productInventoryInfo: ProductInventory): Promise<any[]> {
        const responses = await this.getProductInventoriesWithoutPaging(productInventoryInfo);
        return [].concat(...responses);
    }
}
