import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'factory-order-predictions',
    templateUrl: './factory-order-predictions.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FactoryOrderPredictionsComponent {
    /**
     * Constructor
     */
    constructor() {
    }
}
