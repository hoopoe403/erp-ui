import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'cheque',
    templateUrl: './cheque.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChequeComponent {
    /**
     * Constructor
     */
    constructor() {
    }
}
