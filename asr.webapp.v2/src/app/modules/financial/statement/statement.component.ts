import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'statement',
    templateUrl: './statement.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatementComponent {
    /**
     * Constructor
     */
    constructor() {
    }
}
