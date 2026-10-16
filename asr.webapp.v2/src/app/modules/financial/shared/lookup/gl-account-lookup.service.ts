import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AccountChartService } from '../../account-chart/account-chart.service';
import { AccountChart } from '../../account-chart/account-chart.types';
import { MockGlAccount } from '../mock-data';

@Injectable({
    providedIn: 'root'
})
export class GlAccountLookupService {

    constructor(private _accountChartService: AccountChartService) {
    }

    /**
     * Always the real account dropdown (financial/accountChart/drp/list) - the same data as goods,
     * regardless of `useMockMasterData`, which only applies to master data that has no real API yet.
     */
    getGlAccounts(): Observable<MockGlAccount[]> {
        return this._accountChartService.getDropdownAccountCharts().pipe(
            map((accounts) => this._toGlAccounts(accounts || []))
        );
    }

    /**
     * The backend dropdown (financial/accountChart/drp/list) already returns only active leaf
     * accounts. The id is the account chart id, which is what the purchase
     * invoice backend validates a line's account against.
     */
    private _toGlAccounts(accounts: AccountChart[]): MockGlAccount[] {
        return accounts
            .map((a) => ({
                financialCategoryId: a.accountChartId,
                financialCategoryCode: a.accountChartCode,
                financialCategoryName: a.accountChartName,
                nature: 1
            }));
    }
}
