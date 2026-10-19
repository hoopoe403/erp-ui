import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSortModule } from '@angular/material/sort';
import { DataTableComponent } from './data-table.component';
import { DataTableCellDirective } from './data-table-cell.directive';

@NgModule({
    declarations: [DataTableComponent, DataTableCellDirective],
    imports: [CommonModule, RouterModule, MatSortModule],
    exports: [DataTableComponent, DataTableCellDirective]
})
export class DataTableModule {
}
