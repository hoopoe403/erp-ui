import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { Product } from './product.types';
import { ApiHelperService } from '../../../../../environments/api-helper.service';
import { Paging } from 'app/core/type/paging/paging.type';
import { Goods } from 'app/modules/inventory/goods/goods/goods.types';

@Injectable({
    providedIn: 'root'
})
export class ProductService {


    private url: string = 'configuration/branding/product/';
    private _pagination: BehaviorSubject<Paging | null> = new BehaviorSubject(null);
    private _products: BehaviorSubject<Product[] | null> = new BehaviorSubject(null);
    private productsTree: any;
    private expandedNodes = new BehaviorSubject<Set<number>>(new Set());
    private importProductIdList = new Array<number>();
    private importedGoodsList = new Array<Goods>();
    private productInfo = new Product;
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




    get products$(): Observable<Product[]> {
        return this._products.asObservable();
    }

    setProductList(products: any) {
        this.productsTree = products;
    }
    getProductList(): any {
        return this.productsTree;
    }
    getExpandedNodes() {
        return this.expandedNodes.asObservable();
    }

    setExpandedNodes(nodes: Set<number>) {
        this.expandedNodes.next(nodes);
    }
    setImportedProductIdList(importProductIdList: Array<number>) {
        this.importProductIdList = importProductIdList;
    }
    getImportedProductIdList(): Array<number> {
        return this.importProductIdList;
    }
    setProductInfo(productInfo: Product) {
        this.productInfo = productInfo;
    }
    getImportedGoodsList(): Array<Goods> {
        return this.importedGoodsList;
    }
    setImportedGoodsList(goodsList: Array<Goods>) {
        this.importedGoodsList = goodsList;
    }
    getProductInfo(): Product {
        return this.productInfo;
    }
    disposeProducts$() {
        this._products.next([]);
        //  this._expenses.complete();
    }

    disposePaginator$() {
        this._pagination.next(null);
        // this._pagination.complete();
    }
    disposeProducts() {
        this.productsTree = [];
    }
    disposeExpandedNodes() {
        this.expandedNodes.next(null);
    }
    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------


    getProducts(productInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; products: Product[] }>(ApiHelperService.BASE_URL + this.url + 'findByObjFinalProducts', productInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._products.next(response.data.products);
            })
        );
    }


    geProductsOnInit(productInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; products: Product[] }>(ApiHelperService.BASE_URL + this.url + 'findByObjOnInitFinalProducts', productInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._products.next(response.data.products);
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
    getProduct(id: string): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'findByIdV2/' + id).pipe(
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
    getUnits(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'units').pipe(
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

    getProductSubsets(productSubsetInfo: any): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'productSubsetDistinct', productSubsetInfo).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }
    getProductTree(obj: Product): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'obj/product', obj).pipe(
            tap((response) => {
                return response;
            })
        );
    }
    getGoods(goodsInfo: any): Observable<any> {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'goods/findByObjUsingPaging', goodsInfo).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }
    setProductSubsets(productInfo: any): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'setProductGoods', productInfo).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }
}
