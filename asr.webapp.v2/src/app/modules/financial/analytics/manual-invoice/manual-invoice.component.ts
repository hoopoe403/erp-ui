import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'manual-invoice',
    templateUrl: './manual-invoice.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManualInvoiceComponent {
    /**
     * Constructor
     */
    constructor() {
    }
}
