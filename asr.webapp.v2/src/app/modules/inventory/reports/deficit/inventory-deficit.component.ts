import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'inventory-deficit',
    templateUrl: './inventory-deficit.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InventoryDeficitComponent {
    /**
     * Constructor
     */
    constructor() {
    }
}
