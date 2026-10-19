import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ContentChildren, Input, QueryList } from '@angular/core';
import { DataTableCellDirective } from './data-table-cell.directive';
import { DataTableColumn } from './data-table.types';

/** Key of the optional trailing column filled by `<ng-template dataTableCell="actions">`. */
export const DATA_TABLE_ACTIONS = 'actions';

/**
 * A list table whose first column stays in place while the other columns scroll sideways. The header row
 * stays on top while the rows scroll. When `rowLink` is set, the first column's text links to the row's record.
 *
 * Sorting uses Angular Material: put `matSort` on the host (`<data-table matSort ...>`), so the page reads
 * it with `@ViewChild(MatSort)` exactly as before.
 */
@Component({
    selector: 'data-table',
    templateUrl: './data-table.component.html',
    styleUrls: ['./data-table.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTableComponent<T = any> {
    @Input() columns: DataTableColumn<T>[] = [];
    @Input() rows: T[] = [];
    /** Router link for a row's record, put on the first column's text; relative links resolve against the page. */
    @Input() rowLink: (row: T) => any[] | string;
    @Input() trackBy: (index: number, row: T) => any = (index: number): any => index;
    @Input() actionsHeader = 'More';

    @ContentChildren(DataTableCellDirective) private _cells: QueryList<DataTableCellDirective>;

    /** True while scrolled sideways - only then does the frozen first column show its edge. */
    scrolled = false;

    constructor(private _changeDetectorRef: ChangeDetectorRef) {
    }

    onScroll(event: Event): void {
        const scrolled = (event.target as HTMLElement).scrollLeft > 0;
        if (scrolled !== this.scrolled) {
            this.scrolled = scrolled;
            this._changeDetectorRef.markForCheck();
        }
    }

    cellTemplate(key: string): DataTableCellDirective['template'] | null {
        const cell = this._cells?.find(c => c.key === key);
        return cell ? cell.template : null;
    }

    get hasActions(): boolean {
        return !!this.cellTemplate(DATA_TABLE_ACTIONS);
    }

    text(row: T, column: DataTableColumn<T>): any {
        const value = column.value ? column.value(row) : row[column.key];
        return value === null || value === undefined || value === '' ? '-' : value;
    }
}
