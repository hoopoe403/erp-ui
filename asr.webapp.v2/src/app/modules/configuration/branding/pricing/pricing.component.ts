import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'pricing',
    templateUrl: './pricing.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PricingComponent {
    /**
     * Constructor
     */
    constructor() {
    }
}
