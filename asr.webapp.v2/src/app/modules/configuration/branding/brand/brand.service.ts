import { Injectable } from "@angular/core";
import { Paging } from "app/core/type/paging/paging.type";
import { BehaviorSubject, Observable, of, throwError } from "rxjs";
import { Brand } from "./brand.type";
import { HttpClient } from "@angular/common/http";
import { ApiHelperService } from "environments/api-helper.service";
import { map, switchMap, tap } from "rxjs/operators";


@Injectable({
    providedIn: 'root'
})

export class BrandService {
    
    private url: string = 'configuration/branding/brand/';
    private _pagination: BehaviorSubject<Paging | null> = new BehaviorSubject(null)
    private _brands: BehaviorSubject<Brand[] | null> = new BehaviorSubject(null)
      /**
     * Constructor
     */
      constructor(private _httpClient: HttpClient) {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    get pagination$(): Observable<Paging> {
        return this._pagination.asObservable()
    }


    get brands$(): Observable<Brand[]> {
        return this._brands.asObservable()
    }

    disposeWarehouses$() {
        this._brands.next([]);
        //  this._expenses.complete();
    }

    disponsePaginator$() {
        this._pagination.next(null);
        // this._pagination.complete();
    }
    
    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    getBrands(brandInfo : any):
    Observable<any> {
        return this._httpClient.post<{ pagination : Paging; brands : Brand[] }>(ApiHelperService.BASE_URL + this.url + 'findByObj', brandInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._brands.next(response.data)
            })
        );
    }
    
    
    
    getBrandsOnInit(brandInfo : any):
        Observable<any> {
        return this._httpClient.post<{ pagination : Paging; brands : Brand[] }>(ApiHelperService.BASE_URL + this.url + 'findByObj', brandInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._brands.next(response.data)
            })
        );
    }

    getBrand(id: number): any {
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

    getDrpOrganization(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url +'drp/organization').pipe(
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

    getGoodsCatgories(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'tree/goodsCat').pipe(
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

    
    // getProductsTreeBybrandId(brandId: number): any {
    //     return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'tree/productByBrandId' + brandId).pipe(
    //         map((products) => {
    //             return products;
    //         }),
    //         switchMap((products) => {

    //             if (!products) {
    //                 return throwError('Could not found course with id of ' + '!');
    //             }

    //             return of(products);
    //         })
    //     );
    // }
    getProduct(brandId: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL +'configuration/branding/product/' + brandId).pipe(
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

    getProductGoods(productId: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL +'configuration/branding/product/getProductGoods/' + productId).pipe(
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

    getProducts(brandInfo : any):
        Observable<any> {
        return this._httpClient.post<{ brands : Brand[] }>(ApiHelperService.BASE_URL +  'configuration/branding/product/findByObj', brandInfo).pipe(
            tap((response) => {
                this._brands.next(response.data)
            })
        );
    }

    getGoodsForMixture(goodsInfo: any): Observable<any> {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'obj/goods/findByObjUsingPaging', goodsInfo).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }

    editProduct(product: any) {
        return this._httpClient.post(ApiHelperService.BASE_URL + 'configuration/branding/product/edit', product).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }

    createProduct(product: any) {
        return this._httpClient.post(ApiHelperService.BASE_URL + 'configuration/branding/product/create', product).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }

    getUnits(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'obj/units').pipe(
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

    setProductGoods(goods: any) {
        return this._httpClient.post(ApiHelperService.BASE_URL + 'configuration/branding/product/setProductGoods', goods).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }

    saveBrand(brand : Brand) {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'create', brand).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }

    editBrand(brand: Brand): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'edit', brand).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }

   
}