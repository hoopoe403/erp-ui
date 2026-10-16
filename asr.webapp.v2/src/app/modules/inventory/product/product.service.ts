import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiHelperService } from '../../../../environments/api-helper.service';
import { Paging } from 'app/core/type/paging/paging.type';
import { AttributeValue, withStatusInfo } from '../attribute/attribute.types';
import { AttributeService } from '../attribute/attribute.service';
import {
    Brand,
    CategoryAttributeRow,
    Product,
    ProductSearch,
    ProductVariant,
    ProductVariantAttributeValueRow,
    ProductVariantSkuUsage,
    PRODUCT_STATUS_ACTIVE,
    PRODUCT_STATUSES
} from './product.types';

/**
 * Inventory Product / Product Variant API, plus the read-only history of their attribute rows. These
 * endpoints return the resource itself (no `{ succeed, message, data }` envelope); failures are RFC 7807
 * problems - see `errorMessage`. A product is saved with its variant attributes and fixed values, a variant
 * with its attribute values - each in one call.
 */
@Injectable({
    providedIn: 'root'
})
export class ProductService {

    private url: string = 'inventory/product/';
    private variantUrl: string = 'inventory/productVariant/';
    private _pagination: BehaviorSubject<Paging | null> = new BehaviorSubject(null);
    private _products: BehaviorSubject<Product[] | null> = new BehaviorSubject(null);

    constructor(private _httpClient: HttpClient, private _attributeService: AttributeService) {
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

    disposeProducts$() {
        this._products.next([]);
    }

    disposePaginator$() {
        this._pagination.next(null);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Product
    // -----------------------------------------------------------------------------------------------------

    getProducts(search: ProductSearch): Observable<{ products: Product[]; page: Paging }> {
        return this.searchProducts('findByObj', search);
    }

    getProductsOnInit(search: ProductSearch): Observable<{ products: Product[]; page: Paging }> {
        return this.searchProducts('findByObjInOnInit', search);
    }

    getProduct(id: number): Observable<Product> {
        return this._httpClient.get<Product>(ApiHelperService.BASE_URL + this.url + id).pipe(map(withStatusInfo));
    }

    createProduct(product: Product): Observable<Product> {
        return this._httpClient.post<Product>(ApiHelperService.BASE_URL + this.url + 'create', product).pipe(map(withStatusInfo));
    }

    editProduct(product: Product): Observable<Product> {
        return this._httpClient.post<Product>(ApiHelperService.BASE_URL + this.url + 'edit', product).pipe(map(withStatusInfo));
    }

    getStatuses(): Observable<any[]> {
        return of(PRODUCT_STATUSES);
    }

    getBrands(): Observable<Brand[]> {
        return this._httpClient.get<Brand[]>(ApiHelperService.BASE_URL + 'inventory/brand/drp/list');
    }

    /** Adds a brand (code and name must be unique); the server gives it the default status. */
    createBrand(brand: Brand): Observable<Brand> {
        return this._httpClient.post<Brand>(ApiHelperService.BASE_URL + 'inventory/brand/create', brand);
    }

    /** The category's attributes - the only ones a product of it can have. */
    getCategoryAttributes(categoryId: number): Observable<CategoryAttributeRow[]> {
        return this._httpClient.get<CategoryAttributeRow[]>(
            ApiHelperService.BASE_URL + 'inventory/productCategoryAttribute/category/' + categoryId).pipe(
            map(rows => (rows || []).filter(x => x.status === PRODUCT_STATUS_ACTIVE))
        );
    }

    /** The active values of a list attribute, in their sort order. */
    getAttributeValues(attributeId: number): Observable<AttributeValue[]> {
        const page = new Paging();
        page.pageNumber = 1;
        page.pageSize = 2000;
        page.flag = false;
        page.sort = 'sortOrder';
        page.order = 'asc';
        return this._attributeService.getAttributeValues(<any>{ attributeId: attributeId, statusIdList: [PRODUCT_STATUS_ACTIVE], page: page })
            .pipe(map(res => (res.attributeValues || []).sort((a, b) =>
                ((a.sortOrder ?? 9999) - (b.sortOrder ?? 9999)) || (a.attributeValue || '').localeCompare(b.attributeValue || ''))));
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Variant
    // -----------------------------------------------------------------------------------------------------

    getVariants(productId: number): Observable<ProductVariant[]> {
        return this._httpClient.get<ProductVariant[]>(ApiHelperService.BASE_URL + this.variantUrl + 'product/' + productId)
            .pipe(map(variants => (variants || []).map(withStatusInfo)));
    }

    createVariant(variant: ProductVariant): Observable<ProductVariant> {
        return this._httpClient.post<ProductVariant>(ApiHelperService.BASE_URL + this.variantUrl + 'create', variant).pipe(map(withStatusInfo));
    }

    editVariant(variant: ProductVariant): Observable<ProductVariant> {
        return this._httpClient.post<ProductVariant>(ApiHelperService.BASE_URL + this.variantUrl + 'edit', variant).pipe(map(withStatusInfo));
    }

    /** Every variant - of any product, active or inactive - that already uses one of these SKUs (compared in upper case). */
    checkSkus(skus: Array<string>): Observable<ProductVariantSkuUsage[]> {
        return this._httpClient.post<ProductVariantSkuUsage[]>(ApiHelperService.BASE_URL + this.variantUrl + 'checkSkus', { skus: skus })
            .pipe(map(usages => usages || []));
    }

    /** Every value row of the variant - active and removed (its history lives in the _LOG table). */
    getVariantValueHistory(productVariantId: number): Observable<ProductVariantAttributeValueRow[]> {
        return this._httpClient.get<ProductVariantAttributeValueRow[]>(
            ApiHelperService.BASE_URL + 'inventory/productVariantAttributeValue/variant/' + productVariantId)
            .pipe(map(rows => (rows || []).map(withStatusInfo)));
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Helpers
    // -----------------------------------------------------------------------------------------------------

    /** The human-readable message of an RFC 7807 problem (400 validation, 404, 409), or a generic fallback. */
    errorMessage(error: any): string {
        if (error instanceof HttpErrorResponse && error.error) {
            return error.error.detail || error.error.title || error.message;
        }
        return 'Something went wrong. Please try again.';
    }

    private searchProducts(path: string, search: ProductSearch): Observable<{ products: Product[]; page: Paging }> {
        return this._httpClient.post<{ products: Product[]; page: Paging }>(ApiHelperService.BASE_URL + this.url + path, search).pipe(
            tap((response) => {
                (response.products || []).forEach(withStatusInfo);
                this._pagination.next(response.page);
                this._products.next(response.products);
            })
        );
    }
}
