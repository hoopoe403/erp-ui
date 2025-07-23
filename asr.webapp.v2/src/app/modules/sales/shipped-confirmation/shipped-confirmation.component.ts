import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'shipped-confirmation',
    templateUrl: './shipped-confirmation.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShippedConfirmationComponent {
    /**
     * Constructor
     */
    constructor() {
    }
}
