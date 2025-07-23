import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'product-subset',
    templateUrl: './product-subset.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductSubsetComponent {
    /**
     * Constructor
     */
    constructor() {
    }
}
