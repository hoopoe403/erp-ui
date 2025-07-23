import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { Statement, StatementDetail } from './statement.types';
import { ApiHelperService } from '../../../../environments/api-helper.service';
import { Paging } from 'app/core/type/paging/paging.type';


@Injectable({
    providedIn: 'root'
})
export class StatementService {


    private url: string = 'financial/statement/';
    private _pagination: BehaviorSubject<Paging | null> = new BehaviorSubject(null);
    private _statements: BehaviorSubject<Statement[] | null> = new BehaviorSubject(null);
    private _statementDetails: BehaviorSubject<StatementDetail[] | null> = new BehaviorSubject(null);
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




    get statements$(): Observable<Statement[]> {
        return this._statements.asObservable();
    }


    get statementDetails$(): Observable<StatementDetail[]> {
        return this._statementDetails.asObservable();
    }

    disposeStatements$() {
        this._statements.next([]);
        //  this._expenses.complete();
    }
    disposeStatementDetails$() {
        this._statementDetails.next([]);
        //  this._expenses.complete();
    }
    disponsePaginator$() {
        this._pagination.next(null);
        // this._pagination.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    getStatement(id: string): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + id).pipe(
            map((statement) => {
                return statement;
            }),
            switchMap((statement) => {

                if (!statement) {
                    return throwError('Could not found course with id of ' + id + '!');
                }
                return of(statement);
            })
        );
    }
    getStatements(statementInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; statements: Statement[] }>(ApiHelperService.BASE_URL + this.url + 'findByObj', statementInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._statements.next(response.data.statements);
            })
        );
    }

    getStatementDetails(statementInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; statements: StatementDetail[] }>(ApiHelperService.BASE_URL + this.url + 'findByObjDetail', statementInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._statementDetails.next(response.data.statementDetails);
            })
        );
    }


    getStatementsOnInit(statementInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; statements: StatementDetail[] }>(ApiHelperService.BASE_URL + this.url + 'findByObjOnInit', statementInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._statements.next(response.data.statements);
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
    getOwnerTypes(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/financialTransactionDoerType').pipe(
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

    getArianSystemRoBeneficiaryRecipients(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'aryanSystemRoBeneficiaryRecipients').pipe(
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
}
