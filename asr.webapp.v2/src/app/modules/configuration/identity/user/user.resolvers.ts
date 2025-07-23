import { Injectable } from "@angular/core";
import {
  ActivatedRouteSnapshot,
  Resolve,
  Router,
  RouterStateSnapshot,
} from "@angular/router";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { UserService } from "app/modules/configuration/identity/user/user.service";
import { User } from "app/modules/configuration/identity/user/user.types";
import { Paging } from "app/core/type/paging/paging.type";

@Injectable({
  providedIn: "root",
})
export class UserResolver implements Resolve<any> {
  /**
   * Constructor
   */
  constructor(private _userService: UserService) { }

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
  ): Observable<User[]> {
    let pagination: Paging = new Paging();
    pagination.flag = true;
    pagination.length = 0;
    pagination.order = "asc";
    pagination.pageNumber = 0;
    pagination.pageSize = 400;
    pagination.sort = "";
    let obj: User = new User();
    obj.page = pagination;
    obj.statusIdList = [];
    obj.statusIdList.push(1000001);
    return this._userService.getUsers(obj);
  }
}
