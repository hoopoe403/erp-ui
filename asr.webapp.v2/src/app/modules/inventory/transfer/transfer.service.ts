import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { Transfer } from './transfer.types';
import { ApiHelperService } from '../../../../environments/api-helper.service';
import { Paging } from 'app/core/type/paging/paging.type';
import { Invoice } from 'app/modules/financial/invoices/mechanized/invoice.types';

@Injectable({
    providedIn: 'root'
})
export class TransferService {


    private url: string = 'inventory/transfer/';
    private _pagination: BehaviorSubject<Paging | null> = new BehaviorSubject(null);
    private _transfers: BehaviorSubject<Transfer[] | null> = new BehaviorSubject(null);
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


    get transfers$(): Observable<Transfer[]> {
        return this._transfers.asObservable();
    }

    disposeTransfers$() {
        this._transfers.next([]);
        //  this._expenses.complete();
    }

    disponsePaginator$() {
        this._pagination.next(null);
        // this._pagination.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    getTransfers(transferInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; transfers: Transfer[] }>(ApiHelperService.BASE_URL + this.url + 'findByObjWithPaging', transferInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._transfers.next(response.data.transfers);
            })
        );
    }
    getTransferDetails(transferInfo: any): Observable<any> {
        return this._httpClient.post<{ pagination: Paging; transfers: Transfer[] }>(ApiHelperService.BASE_URL + this.url + 'findByObjDetailWithPaging', transferInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._transfers.next(response.data.transferDetails);
            })
        );
    }
    getTransfersOnInit(transferInfo: any):
        Observable<any> {
        return this._httpClient.post<{ pagination: Paging; shipedList: Transfer[] }>(ApiHelperService.BASE_URL + this.url + 'findByObjInOnInit', transferInfo).pipe(
            tap((response) => {
                this._pagination.next(response.data.page);
                this._transfers.next(response.data.transfers);
            })
        );
    }


    getTransferInfo(id: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'obj/transfer/' + id).pipe(
            map((transfer) => {
                return transfer;
            }),
            switchMap((transfer) => {

                if (!transfer) {
                    return throwError('Could not found course with id of ' + id + '!');
                }

                return of(transfer);
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



    setInvoice(invoiceInfo: Invoice): any {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'setInvoice', invoiceInfo).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }
    getOwnerTypes(): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/ownerTypes').pipe(
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
    getWarehouses(ownerId: number): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'obj/warehouse/' + ownerId).pipe(
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
