import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { ApiHelperService } from '../../../../../environments/api-helper.service';
import { PaymentTypeOption } from 'app/modules/financial/shared/lookup/payment-type-lookup.service';
import {
    InvoiceSide,
    PaymentPostingSetup,
    PaymentPostingSetupFilter,
    PaymentPostingSetupListResponse,
    PaymentPostingSetupRequest
} from './payment-posting-setup.types';

/**
 * The Creditor / Debtor Posting Setup pages, backed by `financial/paymentPostingSetup`. Plain REST: failures are
 * HTTP errors whose body is an RFC 7807 problem (`error.detail` holds the readable message).
 */
@Injectable({
    providedIn: 'root'
})
export class PaymentPostingSetupService {

    private readonly _url = ApiHelperService.BASE_URL + 'financial/paymentPostingSetup/';

    constructor(private _httpClient: HttpClient,
                private _fuseConfirmationService: FuseConfirmationService) {
    }

    getSetups(filter: PaymentPostingSetupFilter): Observable<PaymentPostingSetupListResponse> {
        return this._httpClient.post<PaymentPostingSetupListResponse>(this._url + 'findByObj', filter);
    }

    getSetup(id: number): Observable<PaymentPostingSetup> {
        return this._httpClient.get<PaymentPostingSetup>(this._url + id);
    }

    getStatuses(): Observable<any[]> {
        return this._httpClient.get<any[]>(this._url + 'drp/statuses');
    }

    /** Active payment types with no account on this side yet - invoices using them cannot be posted. */
    getMissingPaymentTypes(side: InvoiceSide): Observable<PaymentTypeOption[]> {
        return this._httpClient.get<PaymentTypeOption[]>(this._url + 'drp/missingPaymentTypes', { params: { invoiceSide: side } });
    }

    create(request: PaymentPostingSetupRequest): Observable<PaymentPostingSetup> {
        return this._httpClient.post<PaymentPostingSetup>(this._url + 'create', request);
    }

    edit(request: PaymentPostingSetupRequest): Observable<PaymentPostingSetup> {
        return this._httpClient.post<PaymentPostingSetup>(this._url + 'edit', request);
    }

    delete(id: number): Observable<void> {
        return this._httpClient.delete<void>(this._url + id);
    }

    /** Asks the user, then deletes. Emits true once deleted, false when the user cancels. */
    confirmAndDelete(setup: PaymentPostingSetup): Observable<boolean> {
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete posting setup',
            message: `Remove the account for ${setup.paymentTypeName}? Invoices already posted keep their entries; `
                + 'new invoices with this payment type cannot be posted until an account is set again.',
            actions: { confirm: { label: 'Delete' } }
        });
        return confirmation.afterClosed().pipe(
            switchMap((result) => result === 'confirmed'
                ? this.delete(setup.paymentPostingSetupId).pipe(map(() => true))
                : of(false))
        );
    }
}
