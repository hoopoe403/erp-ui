import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'order',
    templateUrl: './order.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderComponent {
    /**
     * Constructor
     */
    constructor() {
    }
}
