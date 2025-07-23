import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'trial-balance',
    templateUrl: './trial-balance.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrialBalanceComponent {
    /**
     * Constructor
     */
    constructor() {
    }
}
