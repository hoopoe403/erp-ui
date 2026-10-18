import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { ApiHelperService } from '../../../../../environments/api-helper.service';
import { VatRate, VatRateFilter, VatRateListResponse, VatRateRequest } from './vat-setup.types';

/**
 * The VAT Setup pages, backed by the VAT rates (`financial/vatRate`). Plain REST: success returns the
 * resource itself, failures are HTTP errors whose body is an RFC 7807 problem (`error.detail` holds the
 * readable message). The VAT group, VAT product group and GL account pickers come from the shared
 * `VatLookupService` / `GlAccountLookupService`, like on the invoice lines.
 */
@Injectable({
    providedIn: 'root'
})
export class VatSetupService {

    private readonly _url = ApiHelperService.BASE_URL + 'financial/vatRate/';

    constructor(private _httpClient: HttpClient,
                private _fuseConfirmationService: FuseConfirmationService) {
    }

    getVatRates(filter: VatRateFilter): Observable<VatRateListResponse> {
        return this._httpClient.post<VatRateListResponse>(this._url + 'findByObj', filter);
    }

    getVatRate(id: number): Observable<VatRate> {
        return this._httpClient.get<VatRate>(this._url + id);
    }

    getStatuses(): Observable<any[]> {
        return this._httpClient.get<any[]>(this._url + 'drp/statuses');
    }

    create(request: VatRateRequest): Observable<VatRate> {
        return this._httpClient.post<VatRate>(this._url + 'create', request);
    }

    edit(request: VatRateRequest): Observable<VatRate> {
        return this._httpClient.post<VatRate>(this._url + 'edit', request);
    }

    delete(id: number): Observable<void> {
        return this._httpClient.delete<void>(this._url + id);
    }

    /**
     * Asks the user, then deletes. Emits true once deleted, false when the user cancels; a refused delete (e.g.
     * 409: the only rate of a combination that invoices use) comes through as the HTTP error.
     */
    confirmAndDelete(vatRate: VatRate): Observable<boolean> {
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete VAT rate',
            message: `Delete the ${vatRate.ratePercent}% rate for ${vatRate.vatGroupName} / ${vatRate.vatProductGroupName}? `
                + 'Invoices keep their amounts; only this setup row is removed.',
            actions: { confirm: { label: 'Delete' } }
        });
        return confirmation.afterClosed().pipe(
            switchMap((result) => result === 'confirmed' ? this.delete(vatRate.vatRateId).pipe(map(() => true)) : of(false))
        );
    }
}
