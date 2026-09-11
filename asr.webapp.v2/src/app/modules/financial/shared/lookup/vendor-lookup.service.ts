import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Owner } from 'app/modules/configuration/owner/owner.types';
import { PurchaseInvoiceService } from '../../invoices/purchase/purchase-invoice.service';
import { VENDOR_OWNER_TYPE_ID } from '../financial-constants';
import { ContractorService } from 'app/modules/configuration/contractor/contractor.service';
import { Contractor } from 'app/modules/configuration/contractor/contractor.type';
import { Paging } from 'app/core/type/paging/paging.type';

/**
 * Vendor = Contractor (this system's Supplier entity, see CLAUDE.md). Always loads
 * real data — vendors are never mocked, unlike the other lookups in this folder.
 */
@Injectable({
    providedIn: 'root'
})
export class VendorLookupService {

    constructor(
        private _purchaseInvoiceService: PurchaseInvoiceService,
        private _contractorService: ContractorService
    ) {
    }

    /**
     * The invoice's vendor picker needs a real, human-recognizable code, but the
     * lightweight owners list (obj/owners/{typeId} — the endpoint that actually
     * supplies the id sent as the invoice's creditorId) doesn't return one, only
     * ownerId/ownerName. The full Contractor list has the real contractorCode, so
     * fetch both and merge the code in by matching id.
     *
     * ASSUMPTION: Owner.ownerId equals Contractor.contractorId (unverified — see the
     * purchase-invoice plan). If a given owner's id doesn't resolve to a contractor,
     * its code is just left unset (the picker falls back to showing the name alone);
     * this merge never changes which id is actually used as creditorId, so it can't
     * make invoice submission any less correct than before, only less complete.
     */
    getVendors(): Observable<Owner[]> {
        return forkJoin([
            this._purchaseInvoiceService.getCreditors(VENDOR_OWNER_TYPE_ID).pipe(
                map((res: any) => (res && res.data ? res.data : []) as Owner[])
            ),
            this._getAllContractors()
        ]).pipe(
            map(([owners, contractors]: [Owner[], Contractor[]]) => {
                const contractorById = new Map<number, Contractor>(
                    contractors.map((c) => [c.contractorId, c])
                );
                return owners.map((owner) => {
                    const contractor = contractorById.get(owner.ownerId);
                    return {
                        ...owner,
                        // Falls back to the raw owner id (always present, and unique)
                        // rather than an empty string, so duplicate vendor names are
                        // always distinguishable even when the id match above misses.
                        ownerCode: contractor?.contractorCode || (owner as any).ownerCode || String(owner.ownerId),
                        currencyAbbreviation: contractor?.currencyAbbreviation ?? null
                    };
                });
            })
        );
    }

    private _getAllContractors(): Observable<Contractor[]> {
        const contractorInfo = new Contractor();
        const paging = new Paging();
        paging.flag = true;
        paging.length = 0;
        paging.order = 'asc';
        paging.pageNumber = 1;
        paging.pageSize = 1000;
        paging.sort = '';
        contractorInfo.page = paging;
        contractorInfo.status = 1000001; // Active
        return this._contractorService.getContractorsOnInit(contractorInfo).pipe(
            map((res: any) => (res && res.data && res.data.contractors ? res.data.contractors : []) as Contractor[]),
            catchError(() => of([] as Contractor[]))
        );
    }
}
