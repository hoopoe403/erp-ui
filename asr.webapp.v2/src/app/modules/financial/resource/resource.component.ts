import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'resource',
    templateUrl: './resource.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResourceComponent {
    /**
     * Constructor
     */
    constructor() {
    }
}
