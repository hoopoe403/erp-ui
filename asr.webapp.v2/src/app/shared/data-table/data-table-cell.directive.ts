import { Directive, Input, TemplateRef } from '@angular/core';

/**
 * Custom content for one column's cells: `<ng-template dataTableCell="status" let-row>...</ng-template>`.
 * `dataTableCell="actions"` (no matching column) fills the trailing actions column.
 */
@Directive({
    selector: 'ng-template[dataTableCell]'
})
export class DataTableCellDirective {
    @Input('dataTableCell') key: string;

    constructor(public template: TemplateRef<any>) {
    }
}
