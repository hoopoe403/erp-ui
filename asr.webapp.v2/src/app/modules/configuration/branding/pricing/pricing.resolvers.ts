import { Injectable } from "@angular/core";
import {
  ActivatedRouteSnapshot,
  Resolve,
  Router,
  RouterStateSnapshot,
} from "@angular/router";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { PricingService } from "app/modules/configuration/branding/pricing/pricing.service";
import { Pricing } from "app/modules/configuration/branding/pricing/pricing.types";
import { Paging } from "app/core/type/paging/paging.type";

@Injectable({
  providedIn: "root",
})
export class PricingResolver implements Resolve<any> {
  /**
   * Constructor
   */
  constructor(private _pricingService: PricingService) { }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Resolver
   *
   * @param route
   * @param state
   */
  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<Pricing[]> {
    let pagination: Paging = new Paging();
    pagination.flag = true;
    pagination.length = 0;
    pagination.order = "asc";
    pagination.pageNumber = 0;
    pagination.pageSize = 400;
    pagination.sort = "";
    let obj: Pricing = new Pricing();
    obj.page = pagination;
    this.loadUserColumns();
    return this._pricingService.getPrices(obj);
  }
  private loadUserColumns() {

    this._pricingService.loadUserColumns().subscribe(res => {
    });

  }

}
