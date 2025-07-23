import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, switchMap, take, tap } from 'rxjs/operators';
import { Pricing, ProductPriceList } from 'app/modules/configuration/branding/pricing/pricing.types';
import { ApiHelperService } from 'environments/api-helper.service';
import { Paging } from 'app/core/type/paging/paging.type';
import { Column } from 'app/core/type/column/user-column.type';

@Injectable({
    providedIn: 'root'
})
export class PricingService {
    // Private
    private _price: BehaviorSubject<Pricing | null> = new BehaviorSubject(null);
    private _prices: BehaviorSubject<Pricing[] | null> = new BehaviorSubject(null);
    private url: string = 'configuration/pricing/';
    private _pagination: BehaviorSubject<Paging | null> = new BehaviorSubject(null);
    private _userColumns: Array<Column>;
    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient) {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for Price
     */
    get price$(): Observable<Pricing> {
        return this._price.asObservable();
    }
    get userColumn$(): Array<Column> {
        return this._userColumns;
    }
    /**
     * Getter for prices
     */
    get prices$(): Observable<Pricing[]> {
        return this._prices.asObservable();
    }
    get pagination$(): Observable<Paging> {
        return this._pagination.asObservable();
    }

    /**
     * Getter for countries
     */

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get prices
     */
    getPrices(pricingInfo: any): Observable<any> {
        return this._httpClient.post<any[]>(ApiHelperService.BASE_URL + this.url + 'findByObj', pricingInfo).pipe(
            tap((prices) => {
                this._pagination.next(prices.data.page);
                this._prices.next(prices.data.prices);
            })
        );
    }

    getAllPrices(pricingInfo: any): Observable<any> {
        return this._httpClient.post<any[]>(ApiHelperService.BASE_URL + this.url + 'findByObjNoPaging', pricingInfo).pipe(
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

    /**
     * Search prices with given query
     *
     * @param query
     */
    searchPrices(query: string): Observable<Pricing[]> {
        return this._httpClient.get<Pricing[]>('api/apps/prices/search', {
            params: { query }
        }).pipe(
            tap((prices) => {
                this._prices.next(prices);
            })
        );
    }

    /**
     * Get price by id
     */
    getPriceById(id: number): Observable<Pricing> {
        if (id === -1) {
            let price = new Pricing();


            // Return the price
            return of(price);
        }
        else {
            return this._prices.pipe(
                take(1),
                map((prices) => {

                    // Find the price
                    const price = prices.find(item => item.productPriceId === id) || null;

                    // Update the price
                    this._price.next(price);

                    // Return the price
                    return price;
                }),
                switchMap((price) => {

                    if (!price) {
                        return throwError('Could not found price with id of ' + id + '!');
                    }

                    return of(price);
                })
            );
        }
    }

    addToPriceList(price: Pricing) {
        const currentValue = this._prices.value;
        const updatedValue = [...currentValue, price];
        this._prices.next(updatedValue);

    }
    editPriceListItem(price: Pricing) {
        this._prices.next(
            this._prices.value.map((current: Pricing) =>        // <-- `Array#map` function
                current.productPriceId === price.productPriceId ? price : current
            )
        );
    }

    create(price: Pricing): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'create', price).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }

    edit(price: Pricing): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'edit', price).pipe(
            tap((response: any) => {
                return response;
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

    createProductPriceList(price: ProductPriceList): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'createProductPriceList', price).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }

    getProductPriceList(price: ProductPriceList): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'getProductPriceList', price).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }
    confirmProductPriceList(priceListInfo: ProductPriceList): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'confirmProductPriceList', priceListInfo).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }
    loadUserAccess(priceListInfo: ProductPriceList) {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'loadUserAccess', priceListInfo).pipe(
            tap((response: any) => {

                return response;
            })
        );
    }

    loadUserColumns(): any {
        return this._httpClient
            .get(ApiHelperService.BASE_URL + this.url + "userColumns")
            .pipe(
                map((data: any) => {
                    this._userColumns = data.data;
                    return data;
                }),
                switchMap((data) => {
                    if (!data) {
                        return throwError("Could not found course with id of " + "!");
                    }

                    return of(data);
                })
            );
    }
}
