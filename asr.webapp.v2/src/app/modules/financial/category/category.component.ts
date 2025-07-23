import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'category',
    templateUrl: './category.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoryComponent {
    /**
     * Constructor
     */
    constructor() {
    }
}
