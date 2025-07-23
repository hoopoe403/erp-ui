import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { Warehouse } from './warehouse.types';
import { ApiHelperService } from '../../../../environments/api-helper.service';
import { Paging } from 'app/core/type/paging/paging.type';

@Injectable({
    providedIn: 'root'
})
export class WarehouseService {


    private url: string = 'inventory/warehouse/';
    private _pagination: BehaviorSubject<Paging | null> = new BehaviorSubject(null);
    private _warehouses: BehaviorSubject<Warehouse[] | null> = new BehaviorSubject(null);
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


    get warehouses$(): Observable<Warehouse[]> {
        return this._warehouses.asObservable();
    }

    disposeWarehouses$() {
        this._warehouses.next([]);
        //  this._expenses.complete();
    }

    disponsePaginator$() {
        this._pagination.next(null);
        // this._pagination.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    getWarehouses(warehouseInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; warehouses: Warehouse[] }>(ApiHelperService.BASE_URL + this.url + 'findByObj', warehouseInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._warehouses.next(response.data.warehouses);
            })
        );
    }


    getWarehousesOnInit(warehouseInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; warehouses: Warehouse[] }>(ApiHelperService.BASE_URL + this.url + 'findByObjOnInit', warehouseInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._warehouses.next(response.data.warehouses);
            })
        );
    }


    createWarehouse(warehouse: Warehouse): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'create', warehouse).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }

    editWarehouse(warehouse: Warehouse): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'edit', warehouse).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }


    getDrpBranch(orgId: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/branch' + '/' + orgId).pipe(
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

    getUnits(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'obj/units').pipe(
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



    getWarehouse(id: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + id).pipe(
            map((warehouse) => {
                return warehouse;
            }),
            switchMap((warehouse) => {

                if (!warehouse) {
                    return throwError('Could not found course with id of ' + id + '!');
                }

                return of(warehouse);
            })
        );
    }

    getDrpDepartment(orgId: number, depId: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/department' + '/' + orgId + '/' + depId).pipe(
            map((data) => {
                return data;
            }),
            switchMap((data) => {

                if (!data) {
                    return throwError('Could not found course with id of ' + orgId + depId + '!');
                }

                return of(data);
            })
        );
    }


    getOwner(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/owners').pipe(
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


    getDrpWarehouseType(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/warehouseTypes').pipe(
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

    getWarehouseDepTree(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'tree/department').pipe(
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

}
