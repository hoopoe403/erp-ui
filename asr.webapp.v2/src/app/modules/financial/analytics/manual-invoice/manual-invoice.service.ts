import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { ManualInvoiceAccumulative } from './manual-invoice.types';
import { ApiHelperService } from '../../../../../environments/api-helper.service';
import { Paging } from 'app/core/type/paging/paging.type';
import { ManualInvoice, ManualInvoiceDetail } from '../../invoices/manual/manual-invoice.types';

@Injectable({
    providedIn: 'root'
})
export class ManualInvoiceService {


    private url: string = 'financial/analytics/manualInvoice/';
    private _pagination: BehaviorSubject<Paging | null> = new BehaviorSubject(null);
    private _manualInvoiceAccumulative: BehaviorSubject<ManualInvoiceAccumulative[] | null> = new BehaviorSubject(null);
    private _manualInvoices: BehaviorSubject<ManualInvoice[] | null> = new BehaviorSubject(null);
    private _manualInvoicesDetails: BehaviorSubject<ManualInvoiceDetail[] | null> = new BehaviorSubject(null);
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
    get manualInvoicesAccumulative$(): Observable<ManualInvoiceAccumulative[]> {
        return this._manualInvoiceAccumulative.asObservable();
    }

    get manualInvoices$(): Observable<ManualInvoice[]> {
        return this._manualInvoices.asObservable();
    }
    get manualInvoicesDetails$(): Observable<ManualInvoiceDetail[]> {
        return this._manualInvoicesDetails.asObservable();
    }
    disposeManualInvoiceAccumulative$() {
        this._manualInvoiceAccumulative.next([]);
        //  this._expenses.complete();
    }
    disposeManualInvoices$() {
        this._manualInvoices.next([]);
        //  this._expenses.complete();
    }

    disposeManualInvoicesDetails$() {
        this._manualInvoicesDetails.next([]);
        //  this._expenses.complete();
    }

    disponsePaginator$() {
        this._pagination.next(null);
        // this._pagination.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    getManualInvoicesAccumulative(manualInvoiceInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; manualInvoiceAccumulative: ManualInvoiceAccumulative[] }>(ApiHelperService.BASE_URL + this.url + 'findByObj', manualInvoiceInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._manualInvoiceAccumulative.next(response.data.manualInvoiceAccumulative);
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

    getManualInvoiceAccumulative(manualInvoiceAccumulativInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; manualInvoiceAccumulative: ManualInvoiceAccumulative[] }>(ApiHelperService.BASE_URL + this.url + 'findByObjAccumulative', manualInvoiceAccumulativInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._manualInvoiceAccumulative.next(response.data.manualInvoiceAccumulative);
            })
        );
    }
    getManualInvoices(manualInvoiceInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; manualInvoices: ManualInvoiceAccumulative[] }>(ApiHelperService.BASE_URL + this.url + 'findByObjManualInvoice', manualInvoiceInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._manualInvoices.next(response.data.manualInvoices);
            })
        );
    }
    getManualInvoicesDetail(manualInvoiceInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; manualInvoices: ManualInvoiceAccumulative[] }>(ApiHelperService.BASE_URL + this.url + 'findByObjManualInvoiceDetail', manualInvoiceInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._manualInvoicesDetails.next(response.data.manualInvoiceDetails);
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
    getProfitLossCategory(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/profitLossCategory').pipe(
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
    async getManualInvoiceAccumulativeWithoutPaging(invocieInfo: ManualInvoiceAccumulative): Promise<any[]> {
        let responses: any[] = [];
        const obj: ManualInvoiceAccumulative = { ...invocieInfo };
        const page: Paging = new Paging();
        page.length = invocieInfo.page.length;
        page.order = invocieInfo.page.order;
        page.sort = invocieInfo.page.sort;
        page.pageSize = 2000;
        page.flag = false;
        obj.page = page;
        const numberOfAPIRequests = Math.ceil(obj.page.length / obj.page.pageSize); // Number of API requests
        for (let i = 1; i <= numberOfAPIRequests; i++) {
            obj.page.pageNumber = i;
            const response = await this._httpClient.post<{ data: any }>(ApiHelperService.BASE_URL + this.url + 'findByObjAccumulative', obj).toPromise();
            responses.push(response.data.manualInvoiceAccumulative);
        }
        return responses;
    }
    async getManualInvoiceAccumulativeForDownloadingFile(invocieInfo: ManualInvoiceAccumulative): Promise<any[]> {
        const responses = await this.getManualInvoiceAccumulativeWithoutPaging(invocieInfo);
        return [].concat(...responses);
    }
    async getManualInvoiceWithoutPaging(invocieInfo: ManualInvoice): Promise<any[]> {
        let responses: any[] = [];
        const obj: ManualInvoice = { ...invocieInfo };
        const page: Paging = new Paging();
        page.length = invocieInfo.page.length;
        page.order = invocieInfo.page.order;
        page.sort = invocieInfo.page.sort;
        page.pageSize = 2000;
        page.flag = false;
        obj.page = page;
        const numberOfAPIRequests = Math.ceil(obj.page.length / obj.page.pageSize); // Number of API requests
        for (let i = 1; i <= numberOfAPIRequests; i++) {
            obj.page.pageNumber = i;
            const response = await this._httpClient.post<{ data: any }>(ApiHelperService.BASE_URL + this.url + 'findByObjManualInvoice', obj).toPromise();
            responses.push(response.data.manualInvoices);
        }
        return responses;
    }
    async getManualInvoiceForDownloadingFile(invocieInfo: ManualInvoice): Promise<any[]> {
        const responses = await this.getManualInvoiceWithoutPaging(invocieInfo);
        return [].concat(...responses);
    }
    async getManualInvoiceDetailsWithoutPaging(invocieInfo: ManualInvoiceDetail): Promise<any[]> {
        let responses: any[] = [];
        const obj: ManualInvoiceDetail = { ...invocieInfo };
        const page: Paging = new Paging();
        page.length = invocieInfo.page.length;
        page.order = invocieInfo.page.order;
        page.sort = invocieInfo.page.sort;
        page.pageSize = 2000;
        page.flag = false;
        obj.page = page;
        const numberOfAPIRequests = Math.ceil(obj.page.length / obj.page.pageSize); // Number of API requests
        for (let i = 1; i <= numberOfAPIRequests; i++) {
            obj.page.pageNumber = i;
            const response = await this._httpClient.post<{ data: any }>(ApiHelperService.BASE_URL + this.url + 'findByObjManualInvoiceDetail', obj).toPromise();
            responses.push(response.data.manualInvoiceDetails);
        }
        return responses;
    }
    async getManualInvoiceDetailsForDownloadingFile(invocieInfo: ManualInvoiceDetail): Promise<any[]> {
        const responses = await this.getManualInvoiceDetailsWithoutPaging(invocieInfo);
        return [].concat(...responses);
    }

}
