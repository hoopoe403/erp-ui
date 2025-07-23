import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'goods-subset',
    templateUrl: './goods-subset.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GoodsSubsetComponent {
    /**
     * Constructor
     */
    constructor() {
    }
}
