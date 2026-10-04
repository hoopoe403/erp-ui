import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiHelperService } from '../../../../../environments/api-helper.service';

export interface PaymentTypeOption {
    paymentTypeId: number;
    paymentTypeName: string;
}

/** Active payment types (erp-be `paymentType`). */
@Injectable({
    providedIn: 'root'
})
export class PaymentTypeLookupService {

    private readonly _url = ApiHelperService.BASE_URL + 'financial/paymentType/drp/active';

    constructor(private _httpClient: HttpClient) {
    }

    getPaymentTypes(): Observable<PaymentTypeOption[]> {
        return this._httpClient.get<any[]>(this._url).pipe(
            map((list) => (list || []).map((p): PaymentTypeOption => ({ paymentTypeId: p.paymentTypeId, paymentTypeName: p.paymentTypeName }))),
            catchError(() => of([] as PaymentTypeOption[]))
        );
    }
}
