import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'productionPrograms',
    templateUrl: './ProductionPrograms.component.html',
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
