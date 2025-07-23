import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'obligation',
    templateUrl: './obligation.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ObligationComponent {
    /**
     * Constructor
     */
    constructor() {
    }
}
