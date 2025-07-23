import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector       : 'revenue',
    templateUrl    : './revenue.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RevenueComponent
{
    /**
     * Constructor
     */
    constructor()
    {
    }
}
