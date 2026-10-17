import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PurchaseInvoiceService } from '../../invoices/purchase/purchase-invoice.service';
import { MockVatGroup, VatPostingSetupEntry } from '../mock-data';

/**
 * VAT Posting Group / VAT Product Posting Group / VAT Posting Setup (the rate
 * matrix) - real erp-be master data (TBL_VAT_GROUP, TBL_VAT_PRODUCT_GROUP,
 * TBL_VAT_RATE), mapped onto the id/code/name shapes the forms already use.
 * <p>
 * getRate()/getDefaultVatProductPostingGroupId() are used synchronously while
 * calculating line amounts, so this service eagerly fetches and caches all
 * three lists once on construction (in addition to exposing them as
 * Observables for components that want to render the dropdowns directly).
 */
@Injectable({
    providedIn: 'root'
})
export class VatLookupService {

    private _vatPostingGroups: MockVatGroup[] = [];
    private _vatProductPostingGroups: MockVatGroup[] = [];
    private _vatPostingSetup: VatPostingSetupEntry[] = [];

    constructor(private _purchaseInvoiceService: PurchaseInvoiceService) {
        this._fetchVatPostingGroups().subscribe((list) => (this._vatPostingGroups = list));
        this._fetchVatProductPostingGroups().subscribe((list) => (this._vatProductPostingGroups = list));
        this._fetchVatPostingSetup().subscribe((list) => (this._vatPostingSetup = list));
    }

    getVatPostingGroups(): Observable<MockVatGroup[]> {
        return this._fetchVatPostingGroups();
    }

    getVatProductPostingGroups(): Observable<MockVatGroup[]> {
        return this._fetchVatProductPostingGroups();
    }

    /**
     * "Standard" (19%) is the most common VAT product posting group for EU goods/
     * services, so new invoice lines default to it rather than starting blank —
     * the accountant can still change it per line. Looked up by code or name rather
     * than a hardcoded id so it keeps working if the backend's ids ever change.
     */
    getDefaultVatProductPostingGroupId(): number | null {
        const isStandard = (value: string): boolean => (value || '').toUpperCase() === 'STANDARD';
        return this._vatProductPostingGroups.find((g) => isStandard(g.code) || isStandard(g.name))?.id ?? null;
    }

    /**
     * Looks up the VAT rate% for a posting group / product posting group combination
     * (mirrors MS365 Business Central's VAT Posting Setup). Returns 0 if the
     * combination isn't in the matrix (either group not yet selected, a combination
     * genuinely not covered by this dataset, or the lookup hasn't loaded yet).
     */
    getRate(vatPostingGroupId: number | null, vatProductPostingGroupId: number | null): number {
        if (!vatPostingGroupId || !vatProductPostingGroupId) {
            return 0;
        }
        const entry = this._vatPostingSetup.find(
            (e) => e.vatPostingGroupId === vatPostingGroupId && e.vatProductPostingGroupId === vatProductPostingGroupId
        );
        return entry ? entry.ratePercent : 0;
    }

    private _fetchVatPostingGroups(): Observable<MockVatGroup[]> {
        return this._purchaseInvoiceService.getVatGroups().pipe(
            map((res: any[]) => (res || []).map((g): MockVatGroup => ({ id: g.vatGroupId, code: g.vatGroupCode, name: g.vatGroupName }))),
            catchError(() => of([] as MockVatGroup[]))
        );
    }

    private _fetchVatProductPostingGroups(): Observable<MockVatGroup[]> {
        return this._purchaseInvoiceService.getVatProductGroups().pipe(
            map((res: any[]) => (res || []).map((g): MockVatGroup => ({
                id: g.vatProductGroupId, code: g.vatProductGroupCode, name: g.vatProductGroupName
            }))),
            catchError(() => of([] as MockVatGroup[]))
        );
    }

    private _fetchVatPostingSetup(): Observable<VatPostingSetupEntry[]> {
        return this._purchaseInvoiceService.getCurrentVatRates().pipe(
            map((res: any[]) => (res || []).map((r): VatPostingSetupEntry => ({
                vatPostingGroupId: r.vatGroupId, vatProductPostingGroupId: r.vatProductGroupId, ratePercent: Number(r.ratePercent) || 0
            }))),
            catchError(() => of([] as VatPostingSetupEntry[]))
        );
    }
}
