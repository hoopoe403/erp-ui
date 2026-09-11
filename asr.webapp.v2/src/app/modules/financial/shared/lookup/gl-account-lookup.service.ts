import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { FinancialCategoryService } from '../../category/category.service';
import { MOCK_GL_ACCOUNTS, MockGlAccount } from '../mock-data';

@Injectable({
    providedIn: 'root'
})
export class GlAccountLookupService {

    constructor(private _categoryService: FinancialCategoryService) {
    }

    getGlAccounts(): Observable<MockGlAccount[]> {
        if (environment.useMockMasterData) {
            return of(MOCK_GL_ACCOUNTS);
        }
        return this._categoryService.getCategoryTree().pipe(
            map((res: any) => this._flattenLeafNodes(res && res.data ? res.data : []))
        );
    }

    /**
     * Flattens the chart-of-accounts tree (financial/category) down to leaf accounts
     * only — line items can only post to a leaf, not a rollup/parent node. Defensive
     * about field-name variants since the tree node shape is the generic
     * id/item/code/nature/children hierarchy used across this app's category menus.
     */
    private _flattenLeafNodes(nodes: any[]): MockGlAccount[] {
        const leaves: MockGlAccount[] = [];
        const walk = (list: any[]) => {
            (list || []).forEach((node) => {
                const children = node.children || [];
                if (children.length > 0) {
                    walk(children);
                } else {
                    leaves.push({
                        financialCategoryId: node.financialCategoryId ?? node.id,
                        financialCategoryCode: node.financialCategoryCode ?? node.code,
                        financialCategoryName: node.financialCategoryName ?? node.item ?? node.name,
                        nature: node.nature ?? 1
                    });
                }
            });
        };
        walk(nodes);
        return leaves;
    }
}
