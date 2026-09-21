import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiHelperService } from '../../../../../environments/api-helper.service';

export interface PaymentTypeOption {
    paymentTypeId: number;
    paymentTypeName: string;
}

/**
 * Payment Type is real, Oracle-backed (ERP.TBL_PAYMENT_TYPE / VW_PAYMENT_TYPE)
 * and already used elsewhere in this system (Revenue/Expense/Trial Balance) —
 * always real, never mocked, same as GL Account/Vendor. The backend endpoint
 * (PurchaseInvoiceController.getPaymentTypes()) returns the generic
 * {key, value} shape PaymentTypeRepository.getDrpPaymentType() produces
 * (key = PAYMENT_TYPE_ID as a string, value = PAYMENT_TYPE_NAME) — normalized
 * here into PaymentTypeOption so consumers don't need to know that.
 * <p>
 * Called HTTP endpoint directly (rather than through PurchaseInvoiceService,
 * as most of the other lookups in this folder do) because this one is shared
 * by two unrelated feature modules — Contractor (a supplier's default payment
 * type) and Purchase Invoice (defaults from the selected vendor, stays
 * editable) — and depending on PurchaseInvoiceService just for this would be
 * a backwards module dependency from Contractor's side.
 */
@Injectable({
    providedIn: 'root'
})
export class PaymentTypeLookupService {

    private readonly _url = ApiHelperService.BASE_URL + 'financial/purchaseInvoice/drp/payment-types';

    constructor(private _httpClient: HttpClient) {
    }

    getPaymentTypes(): Observable<PaymentTypeOption[]> {
        return this._httpClient.get(this._url).pipe(
            map((res: any) => ((res || []) as { key: string; value: string }[])
                .map((kv) => ({ paymentTypeId: Number(kv.key), paymentTypeName: kv.value }))),
            catchError(() => of([] as PaymentTypeOption[]))
        );
    }
}
