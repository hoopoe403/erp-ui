import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'customer-type',
    templateUrl: './customer-type.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerTypeComponent {
    /**
     * Constructor
     */
    constructor() {
    }
}
