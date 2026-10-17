import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiHelperService } from '../../../../../environments/api-helper.service';
import { VendorOption } from '../master-data.types';

/** erp-be's Active status for master data (vendors, banks...). */
const ACTIVE_STATUS = 1000001;

/**
 * Active vendors from erp-be's vendor module (`/shared/vendor`), each with the defaults a
 * purchase invoice takes from it (currency, VAT group, payment type, due days) - so picking
 * a vendor needs no second request.
 */
@Injectable({
    providedIn: 'root'
})
export class VendorLookupService {

    private readonly _url = ApiHelperService.BASE_URL + 'shared/vendor/findByObj';

    constructor(private _httpClient: HttpClient) {
    }

    getVendors(): Observable<VendorOption[]> {
        const search = {
            statusIdList: [ACTIVE_STATUS],
            page: { pageNumber: 1, pageSize: 1000, flag: true }
        };
        return this._httpClient.post<any>(this._url, search).pipe(
            map((res) => ((res && res.vendors) || []).map((v: any): VendorOption => ({
                vendorId: v.vendorId,
                vendorCode: v.vendorCode,
                vendorName: v.vendorName,
                currencyId: v.currencyId ?? null,
                currencyCode: v.currencyAbbreviation ?? null,
                currencyName: v.currencyName ?? null,
                vatGroupId: v.vatGroupId ?? null,
                paymentTypeId: v.paymentTypeId ?? null,
                paymentTypeName: v.paymentTypeName ?? null,
                dueDays: v.dueDate ?? null
            }))),
            catchError(() => of([] as VendorOption[]))
        );
    }
}
