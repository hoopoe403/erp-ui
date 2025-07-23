import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'goods-inventory',
    templateUrl: './goods-inventory.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GoodsInventoryComponent {
    /**
     * Constructor
     */
    constructor() {
    }
}
