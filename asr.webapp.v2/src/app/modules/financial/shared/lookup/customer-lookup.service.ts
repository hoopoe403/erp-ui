import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CustomerService } from 'app/modules/configuration/customer/customer/customer.service';
import { Customer } from 'app/modules/configuration/customer/customer/customer.types';
import { Paging } from 'app/core/type/paging/paging.type';

/**
 * Customer picker for Sales Invoice. Unlike Vendor (Purchase Invoice's
 * counterpart - see vendor-lookup.service.ts), Customer is already a full,
 * real, Oracle-backed entity with its own code/name directly on it, so this
 * needs no owners-list-plus-Contractor merge - a single call to the existing
 * `CustomerService` is enough. Always loads real data, never mocked.
 */
@Injectable({
    providedIn: 'root'
})
export class CustomerLookupService {

    constructor(private _customerService: CustomerService) {
    }

    getCustomers(): Observable<Customer[]> {
        const filter: any = {};
        const paging = new Paging();
        paging.flag = true;
        paging.length = 0;
        paging.order = 'asc';
        paging.pageNumber = 1;
        paging.pageSize = 1000;
        paging.sort = '';
        filter.page = paging;
        filter.status = 1000001; // Active
        return this._customerService.getCustomers(filter).pipe(
            map((res: any) => (res && res.data && res.data.customers ? res.data.customers : []) as Customer[]),
            catchError(() => of([] as Customer[]))
        );
    }
}
