import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { Cheque } from './cheque.types';
import { ApiHelperService } from '../../../../environments/api-helper.service';
import { Paging } from 'app/core/type/paging/paging.type';

@Injectable({
    providedIn: 'root'
})
export class ChequeService {


    private url: string = 'financial/cheque/';
    private _pagination: BehaviorSubject<Paging | null> = new BehaviorSubject(null);
    private _cheques: BehaviorSubject<Cheque[] | null> = new BehaviorSubject(null);
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




    get cheques$(): Observable<Cheque[]> {
        return this._cheques.asObservable();
    }



    disposeCheques$() {
        this._cheques.next([]);
        //  this._expenses.complete();
    }

    disponsePaginator$() {
        this._pagination.next(null);
        // this._pagination.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    getCheque(id: string): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + id).pipe(
            map((cheque) => {
                return cheque;
            }),
            switchMap((cheque) => {

                if (!cheque) {
                    return throwError('Could not found course with id of ' + id + '!');
                }
                return of(cheque);
            })
        );
    }
    getCheques(chequeInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; cheques: Cheque[] }>(ApiHelperService.BASE_URL + this.url + 'findByObj', chequeInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._cheques.next(response.data.cheques);
            })
        );
    }



    getChequesOnInit(chequeInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; cheques: Cheque[] }>(ApiHelperService.BASE_URL + this.url + 'findByObjOnInit', chequeInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._cheques.next(response.data.cheques);
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
    cashCheque(cheque: Cheque): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'cashCheque', cheque).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }
    bounceCheque(cheque: Cheque): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'bounceCheque', cheque).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }
    refundCheque(cheque: Cheque): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'refundCheque', cheque).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }
    getRecipients(obj: any): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'recipient', obj).pipe(
            tap((response: any) => {
                return response;
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
    getFirstChequeTransaction(obj: any): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'firstChequeTransaction', obj).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }
    getChequeTransaction(obj: any): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'chequeTransaction', obj).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }
    getChequeTypes(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/chequeTypes').pipe(
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
