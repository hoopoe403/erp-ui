import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'role',
    templateUrl: './role.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoleComponent {
    /**
     * Constructor
     */
    constructor() {
    }
}
