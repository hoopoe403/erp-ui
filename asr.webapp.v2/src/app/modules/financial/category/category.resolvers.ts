import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from '@angular/router';
import { Paging } from 'app/core/type/paging/paging.type';
import { Observable } from 'rxjs';
import { FinancialCategoryService } from './category.service';
import { FinancialCategory, FinancialCategoryPagination } from './category.types';


@Injectable({
    providedIn: 'root'
})
export class CategoriesResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(private _CategoryService: FinancialCategoryService) {
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
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<{ pagination: FinancialCategoryPagination; expenses: FinancialCategory[] }> {
        let categoryInfo: FinancialCategory = new FinancialCategory();
        categoryInfo.page = new Paging();
        categoryInfo.page.flag = true;
        categoryInfo.page.length = 0;
        categoryInfo.page.order = 'desc';
        categoryInfo.page.pageNumber = 1;
        categoryInfo.page.pageSize = 100;
        categoryInfo.page.sort = '';
        return this._CategoryService.getCategories(categoryInfo);
    }
}


