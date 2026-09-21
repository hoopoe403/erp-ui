import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { PurchaseInvoice, PurchaseInvoiceList } from './purchase-invoice.types';
import { ApiHelperService } from '../../../../../environments/api-helper.service';
import { Paging } from 'app/core/type/paging/paging.type';

/**
 * The Purchase Invoice endpoints use plain HTTP semantics (no `{succeed, message, data}`
 * envelope): a successful call's body IS the resource - the invoice, the list page, the
 * lookup array - and any failure is an HTTP error (400 invalid request, 404 not found,
 * 409 duplicate vendor invoice number) whose RFC 7807 `detail` holds the readable text.
 * Callers handle failures in `error`, not by checking a flag on the response.
 * The `legacyUrl` calls further down still hit the old Result-envelope controller.
 */
@Injectable({
    providedIn: 'root'
})
export class PurchaseInvoiceService {


    private url: string = 'financial/purchaseInvoice/';
    // Real Oracle-backed reference data (GL account tree, vendor/owner lookups) that
    // has nothing to do with where invoice *records* live — stays on the old,
    // untouched ManualInvoiceController rather than following the mock-backed move.
    private legacyUrl: string = 'financial/manualInvoice/';
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

    /** A plain array of statuses ({statusId, statusDescription, color, isDefault...}). */
    getStatuses(): Observable<any[]> {
        return this._httpClient.get<any[]>(ApiHelperService.BASE_URL + this.url + 'drp/statuses');
    }


    getFinancialCategories(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.legacyUrl + 'tree/financialCategory').pipe(
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
        return this._httpClient.get(ApiHelperService.BASE_URL + this.legacyUrl + 'obj/owners/' + payerTypeId).pipe(
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
        return this._httpClient.get(ApiHelperService.BASE_URL + this.legacyUrl + 'obj/owners/' + issuerTypeId).pipe(
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
        return this._httpClient.get(ApiHelperService.BASE_URL + this.legacyUrl + 'drp/ownerType').pipe(
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

    // -----------------------------------------------------------------------------------------------------
    // Local-mock-data lookups (Cost Center, Fixed Asset, VAT groups) — none of these
    // have a real DB table yet; erp-be serves them from a local JSON file instead
    // (see InvoiceMasterDataService / application.local-mock-data.enabled).
    // -----------------------------------------------------------------------------------------------------

    getMockCostCenters(): Observable<any[]> {
        return this._httpClient.get<any[]>(ApiHelperService.BASE_URL + this.url + 'mock/cost-centers');
    }

    /** 201 - emits the created cost center. 501 when local mock data is off. */
    addMockCostCenter(costCenter: { costCenterCode: string; costCenterName: string }): Observable<any> {
        return this._httpClient.post<any>(ApiHelperService.BASE_URL + this.url + 'mock/cost-centers', costCenter);
    }

    getMockFixedAssets(): Observable<any[]> {
        return this._httpClient.get<any[]>(ApiHelperService.BASE_URL + this.url + 'mock/fixed-assets');
    }

    getMockVatPostingGroups(): Observable<any[]> {
        return this._httpClient.get<any[]>(ApiHelperService.BASE_URL + this.url + 'mock/vat-posting-groups');
    }

    getMockVatProductPostingGroups(): Observable<any[]> {
        return this._httpClient.get<any[]>(ApiHelperService.BASE_URL + this.url + 'mock/vat-product-posting-groups');
    }

    getMockVatPostingSetup(): Observable<any[]> {
        return this._httpClient.get<any[]>(ApiHelperService.BASE_URL + this.url + 'mock/vat-posting-setup');
    }

    /**
     * Unit already exists as real, Oracle-backed master data elsewhere in this
     * system. Unlike the mock/* lookups above, this single endpoint serves both
     * reads and quick-adds — erp-be decides mock vs. real internally based on
     * application.local-mock-data.enabled, so this service never needs to know
     * which one is active.
     */
    getUnits(): Observable<any[]> {
        return this._httpClient.get<any[]>(ApiHelperService.BASE_URL + this.url + 'drp/units');
    }

    /** 201 - emits the created unit. */
    addUnit(unit: { unitCode: string; unitName: string }): Observable<any> {
        return this._httpClient.post<any>(ApiHelperService.BASE_URL + this.url + 'drp/units', unit);
    }
}
