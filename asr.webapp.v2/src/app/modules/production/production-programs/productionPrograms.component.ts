import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'productionPrograms',
    templateUrl: './productionPrograms.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductionProgramsComponent {
    /**
     * Constructor
     */
    constructor() {
    }
}
