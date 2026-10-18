import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'raw-material-category',
    templateUrl: './raw-material-category.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RawMaterialCategoryComponent {
    constructor() {
    }
}
