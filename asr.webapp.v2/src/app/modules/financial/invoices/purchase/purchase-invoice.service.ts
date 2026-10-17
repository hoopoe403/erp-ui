import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PurchaseInvoice, PurchaseInvoiceList, PurchaseInvoiceReviewer } from './purchase-invoice.types';
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

    // ---- approval workflow: each emits the updated invoice (status, allowedActions...). 409 when
    // the invoice's status doesn't allow the step, 403 when the current user may not take it.

    /** Draft/Rejected -> Pending Approval, to the invoice's reviewer. */
    sendForApproval(id: number): Observable<PurchaseInvoice> {
        return this._httpClient.post<PurchaseInvoice>(ApiHelperService.BASE_URL + this.url + id + '/send-for-approval', null);
    }

    /** Pending Approval -> Draft (only whoever sent it). */
    withdraw(id: number): Observable<PurchaseInvoice> {
        return this._httpClient.post<PurchaseInvoice>(ApiHelperService.BASE_URL + this.url + id + '/withdraw', null);
    }

    /** Pending Approval -> Approved (only the assigned reviewer); the comment is optional. */
    approve(id: number, comment: string | null): Observable<PurchaseInvoice> {
        return this._httpClient.post<PurchaseInvoice>(ApiHelperService.BASE_URL + this.url + id + '/approve', { comment });
    }

    /** Pending Approval -> Rejected (only the assigned reviewer); the comment (why) is optional. */
    reject(id: number, comment: string | null): Observable<PurchaseInvoice> {
        return this._httpClient.post<PurchaseInvoice>(ApiHelperService.BASE_URL + this.url + id + '/reject', { comment });
    }

    /** Approved -> Draft, to change something (needs approving again). */
    reopen(id: number): Observable<PurchaseInvoice> {
        return this._httpClient.post<PurchaseInvoice>(ApiHelperService.BASE_URL + this.url + id + '/reopen', null);
    }

    /** Approved -> Posted. */
    post(id: number): Observable<PurchaseInvoice> {
        return this._httpClient.post<PurchaseInvoice>(ApiHelperService.BASE_URL + this.url + id + '/post', null);
    }

    /** Posted -> Cancelled, for good (will reverse the posting once posting creates ledger entries). */
    cancel(id: number): Observable<PurchaseInvoice> {
        return this._httpClient.post<PurchaseInvoice>(ApiHelperService.BASE_URL + this.url + id + '/cancel', null);
    }

    /** Posted -> Draft: cancels the posting and reopens the same invoice to be changed and posted again. */
    correct(id: number): Observable<PurchaseInvoice> {
        return this._httpClient.post<PurchaseInvoice>(ApiHelperService.BASE_URL + this.url + id + '/correct', null);
    }

    /** Users who may be picked as reviewer (the PI_REVIEWER role). */
    getReviewers(): Observable<PurchaseInvoiceReviewer[]> {
        return this._httpClient.get<PurchaseInvoiceReviewer[]>(ApiHelperService.BASE_URL + this.url + 'drp/reviewers');
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
