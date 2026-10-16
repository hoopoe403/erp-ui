import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FuseAlertModule } from '@fuse/components/alert';
import { FuseDrawerModule } from '@fuse/components/drawer';
import { FuseScrollbarModule } from '@fuse/directives/scrollbar/public-api';
import { FuseConfirmationModule } from '@fuse/services/confirmation';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { NgxPrintModule } from 'ngx-print';
import { SharedModule } from 'app/shared/shared.module';
import { ProductRoutes } from './product.routing';
import { ProductComponent } from './product.component';
import { ProductListComponent } from './list/list.component';
import { ProductDetailsComponent } from './details/details.component';
import { VariantDialogComponent } from './variant-dialog/variant-dialog.component';
import { BrandDialogComponent } from './brand-dialog/brand-dialog.component';

@NgModule({
    declarations: [
        ProductComponent,
        ProductListComponent,
        ProductDetailsComponent,
        VariantDialogComponent,
        BrandDialogComponent
    ],
    imports: [
        RouterModule.forChild(ProductRoutes),
        NgxPrintModule,
        NgxMatSelectSearchModule,
        MatButtonModule,
        MatCheckboxModule,
        MatDialogModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatMenuModule,
        MatPaginatorModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatSlideToggleModule,
        MatSnackBarModule,
        MatSortModule,
        MatTabsModule,
        MatTooltipModule,
        FuseAlertModule,
        FuseDrawerModule,
        FuseScrollbarModule,
        FuseConfirmationModule,
        SharedModule
    ]
})
export class InventoryProductModule {
}
