import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'software-task',
    templateUrl: './software-task.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SoftwareTaskComponent {
    /**
     * Constructor
     */
    constructor() {
    }
}
