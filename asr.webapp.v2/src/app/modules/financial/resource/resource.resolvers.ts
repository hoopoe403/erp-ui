import { Injectable } from "@angular/core";
import {
  ActivatedRouteSnapshot,
  Resolve,
  Router,
  RouterStateSnapshot,
} from "@angular/router";
import { Paging } from "app/core/type/paging/paging.type";
import { Observable } from "rxjs";
import { FinancialResourceService } from "./resource.service";
import { FinancialResource } from "./resource.types";

@Injectable({
  providedIn: "root",
})
export class FinancialResourceResolver implements Resolve<any> {
  /**
   * Constructor
   */
  constructor(private _service: FinancialResourceService) {}

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
  ): Observable<{ pagination: Paging; resources: FinancialResource[] }> {
    let resourceInfo: FinancialResource = new FinancialResource();
    resourceInfo.page = new Paging();
    resourceInfo.page.flag = true;
    resourceInfo.page.length = 0;
    resourceInfo.page.order = "desc";
    resourceInfo.page.pageNumber = 1;
    resourceInfo.page.pageSize = 400;
    resourceInfo.page.sort = "";
    return this._service.getResources(resourceInfo);
  }
}
