import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSortModule } from "@angular/material/sort";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatTreeModule } from '@angular/material/tree';
import { FuseAlertModule } from '@fuse/components/alert';
import { FuseScrollbarModule } from '@fuse/directives/scrollbar/public-api';
import { FuseDrawerModule } from '@fuse/components/drawer';
import { NgxPrintModule } from 'ngx-print';
import { SharedModule } from 'app/shared/shared.module';
import { RawMaterialCategoryRoutes } from './raw-material-category.routing';
import { RawMaterialCategoryComponent } from './raw-material-category.component';
import { RawMaterialCategoryListComponent } from './list/list.component';
import { RawMaterialCategoryTreeComponent } from './tree/tree.component';
import { RawMaterialCategoryDialogComponent } from './tree/category-dialog/category-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FuseConfirmationModule } from '@fuse/services/confirmation';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

@NgModule({
    declarations: [
        RawMaterialCategoryComponent,
        RawMaterialCategoryListComponent,
        RawMaterialCategoryTreeComponent,
        RawMaterialCategoryDialogComponent
    ],
    imports: [
        RouterModule.forChild(RawMaterialCategoryRoutes),
        NgxPrintModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressBarModule,
        MatSelectModule,
        MatTooltipModule,
        MatSortModule,
        MatPaginatorModule,
        MatMenuModule,
        MatTreeModule,
        MatDialogModule,
        MatProgressSpinnerModule,
        FuseConfirmationModule,
        NgxMatSelectSearchModule,
        FuseAlertModule,
        FuseScrollbarModule,
        FuseDrawerModule,
        SharedModule
    ]
})
export class RawMaterialCategoryModule {
}
