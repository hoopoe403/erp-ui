import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { Invoice } from './invoice.types';
import { ApiHelperService } from '../../../../../environments/api-helper.service';
import { Paging } from 'app/core/type/paging/paging.type';

@Injectable({
    providedIn: 'root'
})
export class InvoiceService {


    private url: string = 'financial/invoice/';
    private _pagination: BehaviorSubject<Paging | null> = new BehaviorSubject(null);
    private _invoices: BehaviorSubject<Invoice[] | null> = new BehaviorSubject(null);
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


    get invoices$(): Observable<Invoice[]> {
        return this._invoices.asObservable();
    }

    disposeInvoices$() {
        this._invoices.next([]);
        //  this._expenses.complete();
    }

    disponsePaginator$() {
        this._pagination.next(null);
        // this._pagination.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    getInvoices(invoiceInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; invoices: Invoice[] }>(ApiHelperService.BASE_URL + this.url + 'findByObj', invoiceInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._invoices.next(response.data.invoices);
            })
        );
    }

    getInvoice(id: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + id).pipe(
            map((invoice) => {
                return invoice;
            }),
            switchMap((invoice) => {

                if (!invoice) {
                    return throwError('Could not found course with id of ' + id + '!');
                }
                console.log(this._invoices.value);
                return of(invoice);
            })
        );
    }
    getInvoicesInOnInit(invoiceInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; invoices: Invoice[] }>(ApiHelperService.BASE_URL + this.url + 'findByObjInOnInit', invoiceInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._invoices.next(response.data.invoices);
            })
        );
    }

    confirm(invoice: Invoice): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'confirm', invoice).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }

    edit(invoice: Invoice): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'edit', invoice).pipe(
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

}
