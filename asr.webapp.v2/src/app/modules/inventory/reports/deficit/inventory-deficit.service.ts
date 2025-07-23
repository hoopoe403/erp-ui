import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { InventoryDeficit } from './inventory-deficit.types';
import { ApiHelperService } from '../../../../../environments/api-helper.service';
import { Paging } from 'app/core/type/paging/paging.type';

@Injectable({
    providedIn: 'root'
})
export class InventoryDeficitService {


    private url: string = 'inventory/reports/inventoryDeficit/';
    private _pagination: BehaviorSubject<Paging | null> = new BehaviorSubject(null);
    private _inventoryDeficits: BehaviorSubject<InventoryDeficit[] | null> = new BehaviorSubject(null);
    private _inventoryDeficitsDetails: BehaviorSubject<InventoryDeficit[] | null> = new BehaviorSubject(null);
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




    get inventoryDeficits$(): Observable<InventoryDeficit[]> {
        return this._inventoryDeficits.asObservable();
    }
    get inventoryDeficitsDetails$(): Observable<InventoryDeficit[]> {
        return this._inventoryDeficitsDetails.asObservable();
    }


    disposeInventoryDeficits$() {
        this._inventoryDeficits.next([]);
        //  this._expenses.complete();
    }

    disposeInventoryDeficitsDetails$() {
        this._inventoryDeficitsDetails.next([]);
        //  this._expenses.complete();
    }


    disponsePaginator$() {
        this._pagination.next(null);
        // this._pagination.complete();
    }



    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    getInventoryDeficits(inventoryDeficitInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; InventoryDeficits: InventoryDeficit[] }>(ApiHelperService.BASE_URL + this.url + 'findByObj', inventoryDeficitInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._inventoryDeficits.next(response.data.deficits);
            })
        );
    }
    getInventoryDeficitsDetails(inventoryDeficitInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; InventoryDeficitsDetails: InventoryDeficit[] }>(ApiHelperService.BASE_URL + this.url + 'findByObjDetail', inventoryDeficitInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._inventoryDeficitsDetails.next(response.data.deficits);
            })
        );
    }




    getCovers(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/cover').pipe(
            map((paymentTypes) => {
                return paymentTypes;
            }),
            switchMap((paymentTypes) => {

                if (!paymentTypes) {
                    return throwError('Could not found course with id of ' + '!');
                }

                return of(paymentTypes);
            })
        );
    }
}
