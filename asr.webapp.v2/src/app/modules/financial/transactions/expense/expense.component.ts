import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector       : 'expense',
    templateUrl    : './expense.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExpenseComponent
{
    /**
     * Constructor
     */
    constructor()
    {
    }
}
