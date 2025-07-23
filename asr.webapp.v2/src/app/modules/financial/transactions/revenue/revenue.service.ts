import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { Revenue } from './revenue.types';
import { ApiHelperService } from '../../../../../environments/api-helper.service';
import { Paging } from 'app/core/type/paging/paging.type';
import { AuthorizedPaymentParty } from '../../shared/financial.types';

@Injectable({
    providedIn: 'root'
})
export class RevenueService {


    private url: string = 'financial/revenue/';
    private _pagination: BehaviorSubject<Paging | null> = new BehaviorSubject(null);
    private _revenues: BehaviorSubject<Revenue[] | null> = new BehaviorSubject(null);
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


    get revenues$(): Observable<Revenue[]> {
        return this._revenues.asObservable();
    }
    disposeExpenses$() {
        this._revenues.next([]);
        //  this._expenses.complete();
    }

    disponsePaginator$() {
        this._pagination.next(null);
        // this._pagination.complete();
    }
    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    getRevenues(revenueInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; revenues: Revenue[] }>(ApiHelperService.BASE_URL + this.url + 'findByObj', revenueInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._revenues.next(response.data.revenues);
            })
        );
    }
    getRevenuesOnInit(revenueInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; revenues: Revenue[] }>(ApiHelperService.BASE_URL + this.url + 'findByObjOnInit', revenueInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._revenues.next(response.data.revenues);
            })
        );
    }

    getRevenue(id: string): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + id).pipe(
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

    getPayers(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'payer').pipe(
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

    getFinancialResourceTypePaymentType(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'financialResourceTypePaymentType').pipe(
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
    getFinancialResources(obj: any): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'financialResource', obj).pipe(
            tap((response: any) => {
                return response;
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
    getBanks(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/bank').pipe(
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
    getRecipients(authorizedPaymentParty: AuthorizedPaymentParty): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'recipient', authorizedPaymentParty).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }
    create(revenue: Revenue): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'create', revenue).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }

    edit(revenue: Revenue): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'edit', revenue).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }
    confirm(revenue: Revenue): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'confirm', revenue).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }
    createDraft(revenue: Revenue): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'createDraft', revenue).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }
    getChequeTypes(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'chequeType').pipe(
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
