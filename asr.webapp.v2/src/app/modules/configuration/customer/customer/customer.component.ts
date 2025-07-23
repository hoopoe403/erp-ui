import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector       : 'customer',
    templateUrl    : './customer.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerComponent
{
    /**
     * Constructor
     */
    constructor()
    {
    }
}
