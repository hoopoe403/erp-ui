import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'purchase-invoice',
    templateUrl: './purchase-invoice.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PurchaseInvoiceComponent {
    /**
     * Constructor
     */
    constructor() {
    }
}
