import { Injectable } from "@angular/core";
import {
  ActivatedRouteSnapshot,
  Resolve,
  Router,
  RouterStateSnapshot,
} from "@angular/router";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { RoleService } from "app/modules/configuration/identity/role/role.service";
import { Role } from "app/modules/configuration/identity/role/role.types";
import { Paging } from "app/core/type/paging/paging.type";

@Injectable({
  providedIn: "root",
})
export class RoleResolver implements Resolve<any> {
  /**
   * Constructor
   */
  constructor(private _roleService: RoleService) { }

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
  ): Observable<Role[]> {
    let pagination: Paging = new Paging();
    pagination.flag = true;
    pagination.length = 0;
    pagination.order = "asc";
    pagination.pageNumber = 0;
    pagination.pageSize = 400;
    pagination.sort = "";
    let obj: Role = new Role();
    obj.page = pagination;
    obj.statusIdList = [];
    obj.statusIdList.push(1000001);
    return this._roleService.getRoles(obj);
  }
}
