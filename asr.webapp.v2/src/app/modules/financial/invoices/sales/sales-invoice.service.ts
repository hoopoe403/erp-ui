import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { SalesInvoice, SalesInvoiceList } from './sales-invoice.types';
import { ApiHelperService } from '../../../../../environments/api-helper.service';
import { Paging } from 'app/core/type/paging/paging.type';

/**
 * The Sales Invoice endpoints use plain HTTP semantics (no `{succeed, message, data}`
 * envelope) - the Accounts Receivable mirror of PurchaseInvoiceService: a successful
 * call's body IS the resource - the invoice, the list page, the statuses array - and
 * any failure is an HTTP error (400 invalid request, 404 not found, 409 duplicate
 * customer reference number) whose RFC 7807 `detail` holds the readable text. Callers
 * handle failures in `error`, not by checking a flag on the response.
 * <p>
 * Unlike Purchase Invoice, there's no `legacyUrl` here - reference data this module
 * needs (Customer, GL accounts, cost centers, fixed assets, VAT groups, units,
 * payment types) is all already served elsewhere and reached through the shared
 * lookup services under financial/shared/lookup/ instead of through this service.
 */
@Injectable({
    providedIn: 'root'
})
export class SalesInvoiceService {

    private url: string = 'financial/salesInvoice/';
    private _pagination: BehaviorSubject<Paging | null> = new BehaviorSubject(null);
    private _salesInvoices: BehaviorSubject<SalesInvoice[] | null> = new BehaviorSubject(null);

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

    get salesInvoices$(): Observable<SalesInvoice[]> {
        return this._salesInvoices.asObservable();
    }

    disposeSalesInvoices$() {
        this._salesInvoices.next([]);
    }

    disponsePaginator$() {
        this._pagination.next(null);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    getSalesInvoices(salesInvoiceInfo: any): Observable<SalesInvoiceList> {
        return this._httpClient.post<SalesInvoiceList>(ApiHelperService.BASE_URL + this.url + 'findByObj', salesInvoiceInfo).pipe(
            tap((response) => {
                this._pagination.next(response.page);
                this._salesInvoices.next(response.salesInvoices);
            })
        );
    }

    /** 404 (no such invoice) arrives as an HTTP error. */
    getSalesInvoice(id: number): Observable<SalesInvoice> {
        return this._httpClient.get<SalesInvoice>(ApiHelperService.BASE_URL + this.url + id);
    }

    getSalesInvoiceInOnInit(salesInvoiceInfo: any): Observable<SalesInvoiceList> {
        return this._httpClient.post<SalesInvoiceList>(ApiHelperService.BASE_URL + this.url + 'findByObjInOnInit', salesInvoiceInfo).pipe(
            tap((response) => {
                this._pagination.next(response.page);
                this._salesInvoices.next(response.salesInvoices);
            })
        );
    }

    /** Posts the invoice; emits the stored invoice. 404 if it doesn't exist. */
    confirm(salesInvoice: SalesInvoice): Observable<SalesInvoice> {
        return this._httpClient.post<SalesInvoice>(ApiHelperService.BASE_URL + this.url + 'confirm', salesInvoice);
    }

    /** 201 - emits the stored invoice with its server-assigned id, number and status. 409 for a duplicate. */
    create(salesInvoice: SalesInvoice): Observable<SalesInvoice> {
        return this._httpClient.post<SalesInvoice>(ApiHelperService.BASE_URL + this.url + 'create', salesInvoice);
    }

    /** Emits the stored invoice. 404 if it doesn't exist, 409 for a duplicate. */
    edit(salesInvoice: SalesInvoice): Observable<SalesInvoice> {
        return this._httpClient.post<SalesInvoice>(ApiHelperService.BASE_URL + this.url + 'edit', salesInvoice);
    }

    /** A plain array of statuses ({statusId, statusDescription, color, isDefault...}). */
    getStatuses(): Observable<any[]> {
        return this._httpClient.get<any[]>(ApiHelperService.BASE_URL + this.url + 'drp/statuses');
    }
}
