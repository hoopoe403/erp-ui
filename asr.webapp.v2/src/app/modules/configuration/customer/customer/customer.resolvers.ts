import { Injectable } from "@angular/core";
import {
  ActivatedRouteSnapshot,
  Resolve,
  Router,
  RouterStateSnapshot,
} from "@angular/router";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { CustomerService } from "app/modules/configuration/customer/customer/customer.service";
import { Customer } from "app/modules/configuration/customer/customer/customer.types";
import { Paging } from "app/core/type/paging/paging.type";

@Injectable({
  providedIn: "root",
})
export class CustomersResolver implements Resolve<any> {
  /**
   * Constructor
   */
  constructor(private _customersService: CustomerService) {}

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
  ): Observable<Customer[]> {
    let pagination: Paging = new Paging();
    pagination.flag = true;
    pagination.length = 0;
    pagination.order = "asc";
    pagination.pageNumber = 0;
    pagination.pageSize = 400;
    pagination.sort = "";
    let obj: Customer = new Customer();
    obj.status = 1;
    obj.page = pagination;
    return this._customersService.getCustomers(obj);
  }
}

@Injectable({
  providedIn: "root",
})
export class CustomersCustomerResolver implements Resolve<any> {
  /**
   * Constructor
   */
  constructor(
    private _customerService: CustomerService,
    private _router: Router
  ) {}

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
  ): Observable<Customer> {
    return this._customerService
      .getCustomerById(Number(route.paramMap.get("id")))
      .pipe(
        // Error here means the requested customer is not available
        catchError((error) => {
          // Log the error
          console.error(error);

          // Get the parent url
          const parentUrl = state.url.split("/").slice(0, -1).join("/");

          // Navigate to there
          this._router.navigateByUrl(parentUrl);

          // Throw an error
          return throwError(error);
        })
      );
  }
}
