import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'account-chart',
    templateUrl: './account-chart.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountChartComponent {
    /**
     * Constructor
     */
    constructor() {
    }
}
