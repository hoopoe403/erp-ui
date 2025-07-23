import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { Goods } from 'app/modules/inventory/goods/goods/goods.types';
import { ApiHelperService } from '../../../../../environments/api-helper.service';

@Injectable({
    providedIn: 'root'
})
export class GoodsService {


    private goodsUrl: string = 'inventory/goods/goods/';
    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient) {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------






    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------


    getGoods(goodsInfo: any): Observable<Goods[]> {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.goodsUrl + 'findByObjUsingPaging', goodsInfo).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }

    getGoodsForMixture(goodsInfo: any): Observable<any> {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.goodsUrl + 'mixture/findByObjUsingPaging', goodsInfo).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }

    create(goods: Goods): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.goodsUrl + 'create', goods).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }

    edit(goods: Goods): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.goodsUrl + 'edit', goods).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }


    getGoodsById(id: string): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.goodsUrl + 'findByIdV2/' + id).pipe(
            map((goods) => {
                return goods;
            }),
            switchMap((goods) => {

                if (!goods) {
                    return throwError('Could not found course with id of ' + id + '!');
                }

                return of(goods);
            })
        );
    }
    getServices(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.goodsUrl + 'drp/service').pipe(
            map((services) => {
                return services;
            }),
            switchMap((services) => {

                if (!services) {
                    return throwError('Could not found course with id of ' + '!');
                }

                return of(services);
            })
        );
    }

    getBrands(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.goodsUrl + 'drp/brand').pipe(
            map((brands) => {
                return brands;
            }),
            switchMap((brands) => {

                if (!brands) {
                    return throwError('Could not found course with id of ' + '!');
                }

                return of(brands);
            })
        );
    }


    getGoodsCatgories(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.goodsUrl + 'tree/goodsCat').pipe(
            map((goodsCategories) => {
                return goodsCategories;
            }),
            switchMap((goodsCategories) => {

                if (!goodsCategories) {
                    return throwError('Could not found course with id of ' + '!');
                }

                return of(goodsCategories);
            })
        );
    }
    getCategoryInfoAndProperties(id: string): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.goodsUrl + 'obj/getCategoryInfoAndProperty/' + id).pipe(
            map((category) => {
                return category;
            }),
            switchMap((category) => {

                if (!category) {
                    return throwError('Could not found course with id of ' + id + '!');
                }

                return of(category);
            })
        );
    }

    getGoodsNames(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.goodsUrl + 'drp/goodsNames').pipe(
            map((goodsNames) => {
                return goodsNames;
            }),
            switchMap((goodsNames) => {

                if (!goodsNames) {
                    return throwError('Could not found course with id of ' + '!');
                }

                return of(goodsNames);
            })
        );
    }

    getOrganizations(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.goodsUrl + 'drp/organization').pipe(
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

    getUnits(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.goodsUrl + 'obj/units').pipe(
            map((units) => {
                return units;
            }),
            switchMap((units) => {

                if (!units) {
                    return throwError('Could not found course with id of ' + '!');
                }

                return of(units);
            })
        );
    }
    getMeasurementMetrics(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.goodsUrl + 'drp/measurementMetric').pipe(
            map((measurementMetrics) => {
                return measurementMetrics;
            }),
            switchMap((measurementMetrics) => {

                if (!measurementMetrics) {
                    return throwError('Could not found course with id of ' + '!');
                }

                return of(measurementMetrics);
            })
        );
    }
    getProductsTree(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.goodsUrl + 'tree/product').pipe(
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
    getProductsTreeBybrandId(brandId: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.goodsUrl + 'tree/productByBrandId/' + brandId).pipe(
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
    getFinalProductList(productInfo: any): Observable<any> {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.goodsUrl + 'obj/finalProductList', productInfo).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }
}
