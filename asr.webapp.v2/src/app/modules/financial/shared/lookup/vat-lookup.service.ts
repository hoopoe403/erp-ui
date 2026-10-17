import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ApiHelperService } from '../../../../../environments/api-helper.service';
import { VatGroupOption, VatRateEntry } from '../master-data.types';

/** The VAT product group new lines start with, matched by name (erp-be has no flag for it). */
const DEFAULT_VAT_PRODUCT_GROUP_NAME = 'standard';

/**
 * VAT groups, VAT product groups and the VAT setup (the rate of every group x product
 * group pair) from erp-be.
 *
 * The setup is fetched **once** - one call returns the whole current rate matrix - and
 * kept in memory, so `getRate()` answers every combination a user picks on a line
 * instantly, without a request per change. Only a successful load is kept: if it fails,
 * the next caller tries again instead of being stuck with an empty setup.
 */
@Injectable({
    providedIn: 'root'
})
export class VatLookupService {

    private readonly _baseUrl = ApiHelperService.BASE_URL + 'financial/';

    private _rates = new Map<string, number>();
    private _ratesLoaded = false;
    private _defaultVatProductGroupId: number | null = null;

    constructor(private _httpClient: HttpClient) {
    }

    getVatPostingGroups(): Observable<VatGroupOption[]> {
        return this._httpClient.get<any[]>(this._baseUrl + 'vatGroup/drp/active').pipe(
            map((list) => (list || []).map((g): VatGroupOption => ({ id: g.vatGroupId, code: g.vatGroupCode, name: g.vatGroupName }))),
            catchError(() => of([] as VatGroupOption[]))
        );
    }

    getVatProductPostingGroups(): Observable<VatGroupOption[]> {
        return this._httpClient.get<any[]>(this._baseUrl + 'vatProductGroup/drp/active').pipe(
            map((list) => (list || []).map((g): VatGroupOption => ({ id: g.vatProductGroupId, code: g.vatProductGroupCode, name: g.vatProductGroupName }))),
            tap((groups) => {
                const standard = groups.find((g) => (g.name || '').trim().toLowerCase() === DEFAULT_VAT_PRODUCT_GROUP_NAME);
                this._defaultVatProductGroupId = standard ? standard.id : null;
            }),
            catchError(() => of([] as VatGroupOption[]))
        );
    }

    /** Loads the VAT setup once; later calls return the copy already in memory. */
    loadVatRates(): Observable<VatRateEntry[]> {
        if (this._ratesLoaded) {
            return of(this._entries());
        }
        return this._httpClient.get<any[]>(this._baseUrl + 'vatRate/drp/current').pipe(
            map((list) => (list || []).map((r): VatRateEntry => ({
                vatGroupId: r.vatGroupId, vatProductGroupId: r.vatProductGroupId, ratePercent: Number(r.ratePercent) || 0
            }))),
            tap((entries) => {
                this._rates = new Map(entries.map((e) => [this._key(e.vatGroupId, e.vatProductGroupId), e.ratePercent]));
                this._ratesLoaded = true;
            }),
            catchError(() => of([] as VatRateEntry[]))
        );
    }

    /** "Standard" - null until the product groups have been loaded (or if there is none). */
    getDefaultVatProductPostingGroupId(): number | null {
        return this._defaultVatProductGroupId;
    }

    /** The rate for a VAT group x VAT product group pair from the loaded setup; 0 if unset. */
    getRate(vatGroupId: number | null, vatProductGroupId: number | null): number {
        if (!vatGroupId || !vatProductGroupId) {
            return 0;
        }
        return this._rates.get(this._key(vatGroupId, vatProductGroupId)) ?? 0;
    }

    private _key(vatGroupId: number, vatProductGroupId: number): string {
        return vatGroupId + ':' + vatProductGroupId;
    }

    private _entries(): VatRateEntry[] {
        return Array.from(this._rates.entries()).map(([key, ratePercent]) => {
            const [vatGroupId, vatProductGroupId] = key.split(':').map(Number);
            return { vatGroupId, vatProductGroupId, ratePercent };
        });
    }
}
