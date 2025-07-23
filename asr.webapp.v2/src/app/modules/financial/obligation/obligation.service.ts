import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { Obligation } from './obligation.types';
import { ApiHelperService } from '../../../../environments/api-helper.service';
import { Customer } from 'app/modules/configuration/customer/customer/customer.types';
import { Paging } from 'app/core/type/paging/paging.type';

@Injectable({
    providedIn: 'root'
})
export class ObligationService {


    private url: string = 'financial/obligation/';
    private _Obligations: BehaviorSubject<Obligation[] | null> = new BehaviorSubject(null);
    private _pagination: BehaviorSubject<Paging | null> = new BehaviorSubject(null);
    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient) {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------


    get obligations$(): Observable<Obligation[]> {
        return this._Obligations.asObservable();
    }
    get pagination$(): Observable<Paging> {
        return this._pagination.asObservable();
    }
    disposeObligations$() {
        this._Obligations.next([]);
        //  this._expenses.complete();
    }



    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    getObligations(ObligationInfo: any):
        Observable<any> {
        return this._httpClient.post<{ obligations: Obligation[] }>(ApiHelperService.BASE_URL + this.url + 'findByObj', ObligationInfo).pipe(
            tap((response) => {
                this._Obligations.next(response.data.obligations);
                this._pagination.next(response.data.page);
            })
        );
    }

    getObligation(id: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + id).pipe(
            map((obligation) => {
                return obligation;
            }),
            switchMap((obligation) => {

                if (!obligation) {
                    return throwError('Could not found course with id of ' + id + '!');
                }
                console.log(this._Obligations.value);
                return of(obligation);
            })
        );
    }
    getObligationInOnInit(obligationInfo: any):
        Observable<any> {
        return this._httpClient.post<{ obligation: Obligation[] }>(ApiHelperService.BASE_URL + this.url + 'findByObjOnInit', obligationInfo).pipe(
            tap((response) => {
                this._Obligations.next(response.data.obligations);
                this._pagination.next(response.data.page);
            })
        );
    }


    create(obligationInfo: Obligation): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'create', obligationInfo).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }
    edit(obligationInfo: Obligation): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'edit', obligationInfo).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }
    confirm(obligationInfo: Obligation): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'confirm', obligationInfo).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }
    getDrpCustomerType(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/customerType').pipe(
            map((CustomerType) => {
                return CustomerType;
            }),
            switchMap((CustomerType) => {

                if (!CustomerType) {
                    return throwError('Could not found course with id of ' + '!');
                }

                return of(CustomerType);
            })
        );
    }
    getCustomersWithFilter(customerInfo: any):
        Observable<any> {
        return this._httpClient.post<{ customer: Customer[] }>(ApiHelperService.BASE_URL + this.url + 'obj/customerWithFilter', customerInfo).pipe(
            tap((response) => {
                console.log(response);
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
    getFinancialResources(obj: any): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'financialResource', obj).pipe(
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
}
