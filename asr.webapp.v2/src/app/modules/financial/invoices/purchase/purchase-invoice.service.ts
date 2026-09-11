import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { PurchaseInvoice } from './purchase-invoice.types';
import { ApiHelperService } from '../../../../../environments/api-helper.service';
import { Paging } from 'app/core/type/paging/paging.type';

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

    getPurchaseInvoices(purchaseInvoiceInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; purchaseInvoices: PurchaseInvoice[] }>(ApiHelperService.BASE_URL + this.url + 'findByObj', purchaseInvoiceInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._purchaseInvoices.next(response.data.purchaseInvoices);
            })
        );
    }

    getPurchaseInvoice(id: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + id).pipe(
            map((purchaseInvoice) => {
                return purchaseInvoice;
            }),
            switchMap((purchaseInvoice) => {

                if (!purchaseInvoice) {
                    return throwError('Could not found course with id of ' + id + '!');
                }
                return of(purchaseInvoice);
            })
        );
    }
    getPurchaseInvoiceInOnInit(purchaseInvoiceInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; purchaseInvoices: PurchaseInvoice[] }>(ApiHelperService.BASE_URL + this.url + 'findByObjInOnInit', purchaseInvoiceInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._purchaseInvoices.next(response.data.purchaseInvoices);
            })
        );
    }

    confirm(purchaseInvoice: PurchaseInvoice): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'confirm', purchaseInvoice).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }
    create(purchaseInvoice: PurchaseInvoice): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'create', purchaseInvoice).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }
    edit(purchaseInvoice: PurchaseInvoice): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'edit', purchaseInvoice).pipe(
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
    // (see PurchaseInvoiceMasterDataService / application.local-mock-data.enabled).
    // -----------------------------------------------------------------------------------------------------

    getMockCostCenters(): Observable<any> {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'mock/cost-centers');
    }

    addMockCostCenter(costCenter: { costCenterCode: string; costCenterName: string }): Observable<any> {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'mock/cost-centers', costCenter);
    }

    getMockFixedAssets(): Observable<any> {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'mock/fixed-assets');
    }

    getMockVatPostingGroups(): Observable<any> {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'mock/vat-posting-groups');
    }

    getMockVatProductPostingGroups(): Observable<any> {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'mock/vat-product-posting-groups');
    }

    getMockVatPostingSetup(): Observable<any> {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'mock/vat-posting-setup');
    }

    /**
     * Unit already exists as real, Oracle-backed master data elsewhere in this
     * system. Unlike the mock/* lookups above, this single endpoint serves both
     * reads and quick-adds — erp-be decides mock vs. real internally based on
     * application.local-mock-data.enabled, so this service never needs to know
     * which one is active.
     */
    getUnits(): Observable<any> {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/units');
    }

    addUnit(unit: { unitCode: string; unitName: string }): Observable<any> {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'drp/units', unit);
    }
}
