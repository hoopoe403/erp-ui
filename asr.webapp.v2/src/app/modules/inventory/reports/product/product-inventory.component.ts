import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'product-inventory',
    templateUrl: './product-inventory.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductInventoryComponent {
    /**
     * Constructor
     */
    constructor() {
    }
}
