import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { Expense } from './expense.types';
import { ApiHelperService } from '../../../../../environments/api-helper.service';
import { Paging } from 'app/core/type/paging/paging.type';
import { AuthorizedPaymentParty } from '../../shared/financial.types';

@Injectable({
    providedIn: 'root'
})
export class ExpenseService {


    private url: string = 'financial/expense/';
    private _pagination: BehaviorSubject<Paging | null> = new BehaviorSubject(null);
    private _expenses: BehaviorSubject<Expense[] | null> = new BehaviorSubject(null);
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


    get expenses$(): Observable<Expense[]> {
        return this._expenses.asObservable();
    }

    disposeExpense$() {
        this._expenses.next([]);
        //  this._expenses.complete();
    }

    disposeExpenses$() {
        this._expenses.next([]);
        //  this._expenses.complete();
    }

    disponsePaginator$() {
        this._pagination.next(null);
        // this._pagination.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    getExpenses(expenseInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; expenses: Expense[] }>(ApiHelperService.BASE_URL + this.url + 'findByObj', expenseInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._expenses.next(response.data.expenses);
            })
        );
    }

    getExpensesOnInit(expenseInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; expenses: Expense[] }>(ApiHelperService.BASE_URL + this.url + 'findByObjOnInit', expenseInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._expenses.next(response.data.expenses);
            })
        );
    }
    getExpense(id: string): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + id).pipe(
            map((expense) => {
                return expense;
            }),
            switchMap((expense) => {

                if (!expense) {
                    return throwError('Could not found course with id of ' + id + '!');
                }
                console.log(this._expenses.value);
                return of(expense);
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

    getRecipients(authorizedPaymentParty: AuthorizedPaymentParty): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'recipient', authorizedPaymentParty).pipe(
            tap((response: any) => {
                return response;
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
    getFinancialResourceDetails(obj: any): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'financialResourceDetail', obj).pipe(
            tap((response: any) => {
                return response;
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

    create(expense: Expense): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'create', expense).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }

    edit(revenue: Expense): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'edit', revenue).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }
    confirm(expense: Expense): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'confirm', expense).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }
    createDraft(expense: Expense): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'createDraft', expense).pipe(
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
