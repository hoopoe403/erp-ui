import { Injectable } from "@angular/core";
import {
  ActivatedRouteSnapshot,
  Resolve,
  Router,
  RouterStateSnapshot,
} from "@angular/router";
import { Paging } from "app/core/type/paging/paging.type";
import { Observable } from "rxjs";
import { ExpenseService } from "./expense.service";
import { Expense, ExpensePagination } from "./expense.types";

@Injectable({
  providedIn: "root",
})
export class ExpensesResolver implements Resolve<any> {
  /**
   * Constructor
   */
  constructor(private _ExpenseService: ExpenseService) {}

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
  ): Observable<{ pagination: ExpensePagination; expenses: Expense[] }> {
    let revenueInfo: Expense = new Expense();
    revenueInfo.page = new Paging();
    revenueInfo.page.flag = true;
    revenueInfo.page.length = 0;
    revenueInfo.page.order = "desc";
    revenueInfo.page.pageNumber = 1;
    revenueInfo.page.pageSize = 400;
    revenueInfo.page.sort = "";
    return this._ExpenseService.getExpenses(revenueInfo);
  }
}
