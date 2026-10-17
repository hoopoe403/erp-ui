import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Owner } from 'app/modules/configuration/owner/owner.types';
import { PurchaseInvoiceService } from '../../invoices/purchase/purchase-invoice.service';
import { VENDOR_OWNER_TYPE_ID } from '../financial-constants';
import { VendorService } from 'app/modules/configuration/vendor/vendor.service';
import { Vendor } from 'app/modules/configuration/vendor/vendor.types';
import { Paging } from 'app/core/type/paging/paging.type';

/**
 * Vendor (supplier, TBL_VENDOR - formerly "Contractor" in this UI). Always loads
 * real data — vendors are never mocked, unlike the other lookups in this folder.
 */
@Injectable({
    providedIn: 'root'
})
export class VendorLookupService {

    constructor(
        private _purchaseInvoiceService: PurchaseInvoiceService,
        private _vendorService: VendorService
    ) {
    }

    /**
     * The invoice's vendor picker needs a real, human-recognizable code, but the
     * lightweight owners list (obj/owners/{typeId} — the endpoint that actually
     * supplies the id sent as the invoice's creditorId) doesn't return one, only
     * ownerId/ownerName. The Vendor list has the real vendorCode, so fetch both and
     * merge the code in by id - a vendor owner's ownerId is its VENDOR_ID.
     * An owner with no matching vendor just keeps its id as code; this merge never
     * changes which id is used as creditorId.
     */
    getVendors(): Observable<Owner[]> {
        return forkJoin([
            this._purchaseInvoiceService.getCreditors(VENDOR_OWNER_TYPE_ID).pipe(
                map((res: any) => (res && res.data ? res.data : []) as Owner[])
            ),
            this._getAllVendors()
        ]).pipe(
            map(([owners, vendors]: [Owner[], Vendor[]]) => {
                const vendorById = new Map<number, Vendor>(vendors.map((v) => [v.vendorId, v]));
                return owners.map((owner) => {
                    const vendor = vendorById.get(owner.ownerId);
                    return {
                        ...owner,
                        // Falls back to the raw owner id (always present, and unique)
                        // rather than an empty string, so duplicate vendor names are
                        // always distinguishable even when the id match above misses.
                        ownerCode: vendor?.vendorCode || (owner as any).ownerCode || String(owner.ownerId),
                        currencyAbbreviation: vendor?.currencyAbbreviation ?? null
                    };
                });
            })
        );
    }

    private _getAllVendors(): Observable<Vendor[]> {
        const paging = new Paging();
        paging.flag = true;
        paging.length = 0;
        paging.order = 'asc';
        paging.pageNumber = 1;
        paging.pageSize = 1000;
        paging.sort = '';
        return this._vendorService.getVendors({ statusIdList: [1000001], page: paging }).pipe(
            map((res) => (res && res.vendors ? res.vendors : [])),
            catchError(() => of([] as Vendor[]))
        );
    }
}
