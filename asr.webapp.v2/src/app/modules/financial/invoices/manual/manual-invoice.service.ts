import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { ManualInvoice } from './manual-invoice.types';
import { ApiHelperService } from '../../../../../environments/api-helper.service';
import { Paging } from 'app/core/type/paging/paging.type';

@Injectable({
    providedIn: 'root'
})
export class ManualInvoiceService {


    private url: string = 'financial/manualInvoice/';
    private _pagination: BehaviorSubject<Paging | null> = new BehaviorSubject(null);
    private _manualInvoices: BehaviorSubject<ManualInvoice[] | null> = new BehaviorSubject(null);
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


    get manualInvoices$(): Observable<ManualInvoice[]> {
        return this._manualInvoices.asObservable();
    }

    disposeManualInvoices$() {
        this._manualInvoices.next([]);
        //  this._expenses.complete();
    }

    disponsePaginator$() {
        this._pagination.next(null);
        // this._pagination.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    getManualInvoices(manualInvoiceInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; manualInvoices: ManualInvoice[] }>(ApiHelperService.BASE_URL + this.url + 'findByObj', manualInvoiceInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._manualInvoices.next(response.data.manualInvoices);
            })
        );
    }

    getManualInvoice(id: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + id).pipe(
            map((manualInvoice) => {
                return manualInvoice;
            }),
            switchMap((manualInvoice) => {

                if (!manualInvoice) {
                    return throwError('Could not found course with id of ' + id + '!');
                }
                console.log(this._manualInvoices.value);
                return of(manualInvoice);
            })
        );
    }
    getManualInvoiceInOnInit(manualInvoiceInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; manualInvoices: ManualInvoice[] }>(ApiHelperService.BASE_URL + this.url + 'findByObjInOnInit', manualInvoiceInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._manualInvoices.next(response.data.manualInvoices);
            })
        );
    }

    confirm(manualInvoice: ManualInvoice): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'confirm', manualInvoice).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }
    create(manualInvoice: ManualInvoice): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'create', manualInvoice).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }
    edit(manualInvoice: ManualInvoice): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'edit', manualInvoice).pipe(
            tap((response: any) => {
                return response;
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


    getFinancialCategories(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'tree/financialCategory').pipe(
            map((financialCategories) => {
                return financialCategories;
            }),
            switchMap((financialCategories) => {

                if (!financialCategories) {
                    return throwError('Could not found course with id of ' + '!');
                }

                return of(financialCategories);
            })
        );
    }
    getDebtors(payerTypeId: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'obj/owners/' + payerTypeId).pipe(
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
    getCreditors(issuerTypeId: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'obj/owners/' + issuerTypeId).pipe(
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
    getOwnerTypes(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/ownerType').pipe(
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
