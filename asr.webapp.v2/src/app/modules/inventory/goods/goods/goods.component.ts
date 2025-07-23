import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector       : 'goods',
    templateUrl    : './goods.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GoodsComponent
{
    /**
     * Constructor
     */
    constructor()
    {
    }
}
