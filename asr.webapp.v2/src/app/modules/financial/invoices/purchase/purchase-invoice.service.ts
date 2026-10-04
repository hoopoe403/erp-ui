import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PurchaseInvoice, PurchaseInvoiceList } from './purchase-invoice.types';
import { ApiHelperService } from '../../../../../environments/api-helper.service';
import { Paging } from 'app/core/type/paging/paging.type';

/**
 * The Purchase Invoice endpoints use plain HTTP semantics (no `{succeed, message, data}`
 * envelope): a successful call's body IS the resource - the invoice, the list page, the
 * lookup array - and any failure is an HTTP error (400 invalid request, 404 not found,
 * 409 duplicate vendor invoice number) whose RFC 7807 `detail` holds the readable text.
 * Callers handle failures in `error`, not by checking a flag on the response.
 * Dropdown data (vendors, accounts, VAT...) comes from erp-be's master-data modules
 * through the shared lookups (financial/shared/lookup), not from here.
 */
@Injectable({
    providedIn: 'root'
})
export class PurchaseInvoiceService {


    private url: string = 'financial/purchaseInvoice/';
    private _pagination: BehaviorSubject<Paging | null> = new BehaviorSubject(null);
    private _purchaseInvoices: BehaviorSubject<PurchaseInvoice[] | null> = new BehaviorSubject(null);
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


    get purchaseInvoices$(): Observable<PurchaseInvoice[]> {
        return this._purchaseInvoices.asObservable();
    }

    disposePurchaseInvoices$() {
        this._purchaseInvoices.next([]);
        //  this._expenses.complete();
    }

    disponsePaginator$() {
        this._pagination.next(null);
        // this._pagination.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    getPurchaseInvoices(purchaseInvoiceInfo: any): Observable<PurchaseInvoiceList> {
        return this._httpClient.post<PurchaseInvoiceList>(ApiHelperService.BASE_URL + this.url + 'findByObj', purchaseInvoiceInfo).pipe(
            tap((response) => {
                this._pagination.next(response.page);
                this._purchaseInvoices.next(response.purchaseInvoices);
            })
        );
    }

    /** 404 (no such invoice) arrives as an HTTP error. */
    getPurchaseInvoice(id: number): Observable<PurchaseInvoice> {
        return this._httpClient.get<PurchaseInvoice>(ApiHelperService.BASE_URL + this.url + id);
    }

    getPurchaseInvoiceInOnInit(purchaseInvoiceInfo: any): Observable<PurchaseInvoiceList> {
        return this._httpClient.post<PurchaseInvoiceList>(ApiHelperService.BASE_URL + this.url + 'findByObjInOnInit', purchaseInvoiceInfo).pipe(
            tap((response) => {
                this._pagination.next(response.page);
                this._purchaseInvoices.next(response.purchaseInvoices);
            })
        );
    }

    /** Posts the invoice; emits the stored invoice. 404 if it doesn't exist. */
    confirm(purchaseInvoice: PurchaseInvoice): Observable<PurchaseInvoice> {
        return this._httpClient.post<PurchaseInvoice>(ApiHelperService.BASE_URL + this.url + 'confirm', purchaseInvoice);
    }

    /** 201 - emits the stored invoice with its server-assigned id, number and status. 409 for a duplicate. */
    create(purchaseInvoice: PurchaseInvoice): Observable<PurchaseInvoice> {
        return this._httpClient.post<PurchaseInvoice>(ApiHelperService.BASE_URL + this.url + 'create', purchaseInvoice);
    }

    /** Emits the stored invoice. 404 if it doesn't exist, 409 for a duplicate. */
    edit(purchaseInvoice: PurchaseInvoice): Observable<PurchaseInvoice> {
        return this._httpClient.post<PurchaseInvoice>(ApiHelperService.BASE_URL + this.url + 'edit', purchaseInvoice);
    }

    /** The invoice's documents endpoints, for `<app-file-attachments [filesPath]>`. */
    filesPath(purchaseInvoiceId: number): string {
        return this.url + purchaseInvoiceId + '/files';
    }

    /** A plain array of statuses ({statusId, statusDescription, color, isDefault...}). */
    getStatuses(): Observable<any[]> {
        return this._httpClient.get<any[]>(ApiHelperService.BASE_URL + this.url + 'drp/statuses');
    }
}
