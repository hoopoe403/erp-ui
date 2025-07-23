import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { ProductSubset } from './product-subset.types';
import { ApiHelperService } from '../../../../../environments/api-helper.service';
import { Paging } from 'app/core/type/paging/paging.type';

@Injectable({
    providedIn: 'root'
})
export class ProductSubsetService {

    private url: string = 'configuration/reports/productSubset/';
    private _pagination: BehaviorSubject<Paging | null> = new BehaviorSubject(null);
    private _productSubset: BehaviorSubject<ProductSubset[] | null> = new BehaviorSubject(null);
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


    get productSubset$(): Observable<ProductSubset[]> {
        return this._productSubset.asObservable();
    }

    disposeProductSubset$() {
        this._productSubset.next([]);
        //  this._expenses.complete();
    }

    disponsePaginator$() {
        this._pagination.next(null);
        // this._pagination.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    getProductSubset(productSubsetInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; productSubsetInfo: ProductSubset[] }>(ApiHelperService.BASE_URL + this.url + 'findByObj', productSubsetInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._productSubset.next(response.data.subsets);
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

    getDrpUnits(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/unit').pipe(
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

    getDrpConformity(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/conformity').pipe(
            map((conformity) => {
                return conformity;
            }),
            switchMap((conformity) => {

                if (!conformity) {
                    return throwError('Could not found course with id of ' + '!');
                }

                return of(conformity);
            })
        );
    }

    async getProductSubsetsWithoutPaging(productSubsetInfo: ProductSubset): Promise<any[]> {
        let responses: any[] = [];
        const obj: ProductSubset = { ...productSubsetInfo };
        const page: Paging = new Paging();
        page.length = productSubsetInfo.page.length;
        page.order = productSubsetInfo.page.order;
        page.sort = productSubsetInfo.page.sort;
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
    async getProductSubsetForDownloadingFile(productSubsetInfo: ProductSubset): Promise<any[]> {
        const responses = await this.getProductSubsetsWithoutPaging(productSubsetInfo);
        return [].concat(...responses);
    }

}
