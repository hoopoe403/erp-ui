import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'warehouse',
    templateUrl: './warehouse.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class WarehouseComponent {
    /**
     * Constructor
     */
    constructor() {
    }
}
