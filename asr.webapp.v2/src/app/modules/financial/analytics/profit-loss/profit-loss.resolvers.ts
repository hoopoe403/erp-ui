import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import { ProfitLossService } from 'app/modules/financial/analytics/profit-loss/profit-loss.service';
import { ProfitLoss } from './profit-loss.types';

@Injectable({
    providedIn: 'root'
})
export class ProfitLossResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(private _service: ProfitLossService) {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Resolver
     *
     * @param route
     * @param state
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
        return forkJoin(
            this._service.getChartDataOnInit(new ProfitLoss),
            this._service.getFinanceData(),
            this._service.getCurrentProfitLoss(new ProfitLoss),
        );
    }
}
