import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'factory-order',
    templateUrl: './factory-order.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FactoryOrderComponent {
    /**
     * Constructor
     */
    constructor() {
    }
}
