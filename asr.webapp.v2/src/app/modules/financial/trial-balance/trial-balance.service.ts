import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { concatMap, map, switchMap, tap } from 'rxjs/operators';
import { TrialBalance, TrialBalanceDetail } from './trial-balance.types';
import { ApiHelperService } from '../../../../environments/api-helper.service';
import { Paging } from 'app/core/type/paging/paging.type';

@Injectable({
    providedIn: 'root'
})
export class TrialBalanceService {


    private url: string = 'financial/trialBalance/';
    private _pagination: BehaviorSubject<Paging | null> = new BehaviorSubject(null);
    private _trialBalances: BehaviorSubject<TrialBalance[] | null> = new BehaviorSubject(null);
    private _trialBalancesDetails: BehaviorSubject<TrialBalanceDetail[] | null> = new BehaviorSubject(null);
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


    get trialBalances$(): Observable<TrialBalance[]> {
        return this._trialBalances.asObservable();
    }

    get trialBalancesDetails$(): Observable<TrialBalanceDetail[]> {
        return this._trialBalancesDetails.asObservable();
    }

    disposeTrialbalances$() {
        this._trialBalances.next([]);
        //  this._expenses.complete();
    }

    disposeTrialbalancesDetails$() {
        this._trialBalancesDetails.next([]);
        //  this._expenses.complete();
    }

    disponsePaginator$() {
        this._pagination.next(null);
        // this._pagination.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    getTrialBalances(trialBalanceInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; trialBalances: TrialBalance[] }>(ApiHelperService.BASE_URL + this.url + 'findByObj', trialBalanceInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._trialBalances.next(response.data.trialBalances);
            })
        );
    }
    getTrialBalancesDetails(trialBalanceDetailInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; trialBalancesDetails: TrialBalanceDetail[] }>(ApiHelperService.BASE_URL + this.url + 'findByObjDetail', trialBalanceDetailInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._trialBalancesDetails.next(response.data.trialBalancesDetails);
            })
        );
    }



    async getTrialBalancesDetailsWithoutPaging(trialBalanceDetailInfo: TrialBalanceDetail): Promise<any[]> {
        let responses: any[] = [];
        const obj: TrialBalanceDetail = { ...trialBalanceDetailInfo };
        const page: Paging = new Paging();
        page.length = trialBalanceDetailInfo.page.length;
        page.order = trialBalanceDetailInfo.page.order;
        page.sort = trialBalanceDetailInfo.page.sort;
        page.pageSize = 2000;
        page.flag = false;
        obj.page = page;
        const numberOfAPIRequests = Math.ceil(obj.page.length / obj.page.pageSize); // Number of API requests
        for (let i = 1; i <= numberOfAPIRequests; i++) {
            obj.page.pageNumber = i;
            const response = await this._httpClient.post<{ data: any }>(ApiHelperService.BASE_URL + this.url + 'findByObjDetail', obj).toPromise();
            responses.push(response.data.trialBalancesDetails);


        }
        return responses;
    }
    async getTrialBalanceDetailsForDownloadingFile(trialBalanceDetailInfo: TrialBalanceDetail): Promise<any[]> {
        const responses = await this.getTrialBalancesDetailsWithoutPaging(trialBalanceDetailInfo);
        return [].concat(...responses);
    }

    async getTrialBalancesWithoutPaging(trialBalanceInfo: TrialBalance): Promise<any[]> {
        let responses: any[] = [];
        const obj: TrialBalance = { ...trialBalanceInfo };
        const page: Paging = new Paging();
        page.length = trialBalanceInfo.page.length;
        page.order = trialBalanceInfo.page.order;
        page.sort = trialBalanceInfo.page.sort;
        page.pageSize = 2000;
        page.flag = false;
        obj.page = page;
        const numberOfAPIRequests = Math.ceil(obj.page.length / obj.page.pageSize); // Number of API requests
        for (let i = 1; i <= numberOfAPIRequests; i++) {
            obj.page.pageNumber = i;
            const response = await this._httpClient.post<{ data: any }>(ApiHelperService.BASE_URL + this.url + 'findByObj', obj).toPromise();
            responses.push(response.data.trialBalances);
        }
        return responses;
    }
    async getTrialBalancesForDownloadingFile(trialBalanceInfo: TrialBalance): Promise<any[]> {
        const responses = await this.getTrialBalancesWithoutPaging(trialBalanceInfo);
        return [].concat(...responses);
    }
    getTrialBalance(id: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + id).pipe(
            map((trialbalance) => {
                return trialbalance;
            }),
            switchMap((trialbalance) => {

                if (!trialbalance) {
                    return throwError('Could not found course with id of ' + id + '!');
                }
                console.log(this._trialBalances.value);
                return of(trialbalance);
            })
        );
    }
    geTrialBalancesInOnInit(trialBalanceInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; trialBalances: TrialBalance[] }>(ApiHelperService.BASE_URL + this.url + 'findByObjInOnInit', trialBalanceInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._trialBalances.next(response.data.trialBalances);
            })
        );
    }

    confirm(tralBalanceInfo: TrialBalance): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'confirm', tralBalanceInfo).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }

    edit(tralBalanceInfo: TrialBalance): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'edit', tralBalanceInfo).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }

    getFinancialYears(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/years').pipe(
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

    getRevenue(id: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'getRevenueInfo/' + id).pipe(
            map((revenue) => {
                return revenue;
            }),
            switchMap((revenue) => {

                if (!revenue) {
                    return throwError('Could not found course with id of ' + id + '!');
                }
                return of(revenue);
            })
        );
    }

    getExpense(id: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'getExpenseInfo/' + id).pipe(
            map((expense) => {
                return expense;
            }),
            switchMap((expense) => {

                if (!expense) {
                    return throwError('Could not found course with id of ' + id + '!');
                }
                return of(expense);
            })
        );
    }

    getCustomerOrder(id: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'getCustomerOrderInfo/' + id).pipe(
            map((customerOrder) => {
                return customerOrder;
            }),
            switchMap((customerOrder) => {

                if (!customerOrder) {
                    return throwError('Could not found course with id of ' + id + '!');
                }
                return of(customerOrder);
            })
        );
    }

    getInvoice(id: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'getInvoiceInfo/' + id).pipe(
            map((invoice) => {
                return invoice;
            }),
            switchMap((invoice) => {

                if (!invoice) {
                    return throwError('Could not found course with id of ' + id + '!');
                }
                return of(invoice);
            })
        );
    }
    getManualInvoice(id: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'getManualInvoiceInfo/' + id).pipe(
            map((invoice) => {
                return invoice;
            }),
            switchMap((invoice) => {

                if (!invoice) {
                    return throwError('Could not found course with id of ' + id + '!');
                }
                return of(invoice);
            })
        );
    }
    getChequeInfo(id: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'getChequeInfo/' + id).pipe(
            map((invoice) => {
                return invoice;
            }),
            switchMap((invoice) => {

                if (!invoice) {
                    return throwError('Could not found course with id of ' + id + '!');
                }
                return of(invoice);
            })
        );
    }
    getCustomerInfo(customerId: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'obj/customer/' + customerId).pipe(
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
    getOwners(ownerTypeId: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'obj/owners/' + ownerTypeId).pipe(
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

    getPaymentTypes(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/paymentType').pipe(
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
