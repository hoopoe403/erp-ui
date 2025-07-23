import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'transfer',
    templateUrl: './transfer.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransferComponent {
    /**
     * Constructor
     */
    constructor() {
    }
}
