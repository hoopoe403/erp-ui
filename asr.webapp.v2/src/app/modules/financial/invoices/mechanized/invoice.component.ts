import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'invoice',
    templateUrl: './invoice.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceComponent {
    /**
     * Constructor
     */
    constructor() {
    }
}
