import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { BankAccount, BankAccountType } from './bank-account.types';
import { ApiHelperService } from 'environments/api-helper.service';
import { Bank } from '../../../financial/shared/financial.types';

@Injectable({
    providedIn: 'root'
})
export class BankAccountService {
    private url: string = 'configuration/bankAccount/';

    constructor(private _httpClient: HttpClient) { }

    /**
     * Get bank accounts for an owner (customer or contractor)
     */
    getBankAccounts(ownerId: number, ownerTypeId: number): Observable<any> {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'findByOwner', {
            ownerId: ownerId,
            ownerTypeId: ownerTypeId
        }).pipe(
            map((data) => data),
            switchMap((data) => {
                if (!data) {
                    return throwError('Could not fetch bank accounts');
                }
                return of(data);
            })
        );
    }

    /**
     * Create a new bank account
     */
    create(bankAccount: BankAccount): Observable<any> {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'create', bankAccount).pipe(
            map((data) => data)
        );
    }

    /**
     * Update an existing bank account
     */
    update(bankAccount: BankAccount): Observable<any> {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'edit', bankAccount).pipe(
            map((data) => data)
        );
    }

    /**
     * Delete a bank account
     */
    delete(bankAccountId: number): Observable<any> {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.url + 'delete', {
            bankAccountId: bankAccountId
        }).pipe(
            map((data) => data)
        );
    }

    /**
     * Get bank account types
     */
    getBankAccountTypes(): Observable<any> {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.url + 'drp/bankAccountType').pipe(
            map((data) => data),
            switchMap((data) => {
                if (!data) {
                    return throwError('Could not fetch bank account types');
                }
                return of(data);
            })
        );
    }

    /**
     * Get banks (uses existing financial resource endpoint)
     */
    getBanks(): Observable<any> {
        return this._httpClient.get(ApiHelperService.BASE_URL + 'financial/resource/drp/bank').pipe(
            map((data) => data),
            switchMap((data) => {
                if (!data) {
                    return throwError('Could not fetch banks');
                }
                return of(data);
            })
        );
    }
}

