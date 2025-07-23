import { ChangeDetectionStrategy, Component, ViewEncapsulation } from "@angular/core";

@Component({
    selector : "brand",
    templateUrl : "./brand.component.html",
    encapsulation : ViewEncapsulation.None,
    changeDetection : ChangeDetectionStrategy.OnPush
})

export class BrandComponent {
     /**
     * Constructor
     */
     constructor() {
    }
}