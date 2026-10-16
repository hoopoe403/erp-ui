import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AccountChart, AccountChartFilter, AccountChartListResponse, AccountChartRequest } from './account-chart.types';
import { ApiHelperService } from '../../../../environments/api-helper.service';
import { Paging } from 'app/core/type/paging/paging.type';

/**
 * The Chart of Accounts pages, backed by the chart of accounts (`financial/accountChart`).
 * Plain REST: success returns the resource itself, failures are HTTP errors whose
 * body is an RFC 7807 problem (`error.detail` holds the readable message).
 */
@Injectable({
    providedIn: 'root'
})
export class AccountChartService {


    private url: string = 'financial/accountChart/';
    private _pagination: BehaviorSubject<Paging | null> = new BehaviorSubject(null);
    private _accountCharts: BehaviorSubject<AccountChart[] | null> = new BehaviorSubject(null);
    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient) {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    get pagination$(): Observable<Paging> {
        return this._pagination.asObservable();
    }

    get accountCharts$(): Observable<AccountChart[]> {
        return this._accountCharts.asObservable();
    }

    disposeAccountCharts$() {
        this._accountCharts.next([]);
    }

    disponsePaginator$() {
        this._pagination.next(null);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /** Filtered, paged read of the chart of accounts. Feeds `pagination$` and `accountCharts$`. */
    getAccountCharts(filter: AccountChartFilter): Observable<AccountChartListResponse> {
        return this._httpClient.post<AccountChartListResponse>(ApiHelperService.BASE_URL + this.url + 'findByObj', filter).pipe(
            tap((response) => {
                this._pagination.next(response.page);
                this._accountCharts.next(response.accountCharts);
            })
        );
    }

    /**
     * Every account, any status, in full-code order (parents before children) - for the tree.
     * One unpaged-sized page of `findByObj`; does not touch `pagination$` / `accountCharts$`.
     */
    getAllAccountCharts(): Observable<AccountChartListResponse> {
        const page = new Paging();
        page.flag = false;
        page.length = 0;
        page.pageNumber = 1;
        page.pageSize = 100000;
        page.sort = 'fullCode';
        page.order = 'asc';
        return this._httpClient.post<AccountChartListResponse>(ApiHelperService.BASE_URL + this.url + 'findByObj', { page });
    }

    /**
     * The account dropdown (same endpoint as goods): active accounts with no sub-accounts, decided by the
     * backend. Only id, code and name are filled.
     */
    getDropdownAccountCharts(): Observable<AccountChart[]> {
        return this._httpClient.get<AccountChart[]>(ApiHelperService.BASE_URL + this.url + 'drp/list');
    }

    getAccountChartStatuses(): Observable<any[]> {
        return this._httpClient.get<any[]>(ApiHelperService.BASE_URL + this.url + 'drp/statuses');
    }

    create(account: AccountChartRequest): Observable<AccountChart> {
        return this._httpClient.post<AccountChart>(ApiHelperService.BASE_URL + this.url + 'create', account);
    }

    edit(account: AccountChartRequest): Observable<AccountChart> {
        return this._httpClient.post<AccountChart>(ApiHelperService.BASE_URL + this.url + 'edit', account);
    }
}
