import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'sales-invoice',
    templateUrl: './sales-invoice.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SalesInvoiceComponent {
    /**
     * Constructor
     */
    constructor() {
    }
}
