import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FuseAlertModule } from '@fuse/components/alert';
import { FuseDrawerModule } from '@fuse/components/drawer';
import { FuseScrollbarModule } from '@fuse/directives/scrollbar/public-api';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { NgxPrintModule } from 'ngx-print';
import { SharedModule } from 'app/shared/shared.module';
import { LookupSelectModule } from 'app/modules/financial/shared/lookup-select/lookup-select.module';
import { RawMaterialRoutes } from './raw-material.routing';
import { RawMaterialComponent } from './raw-material.component';
import { RawMaterialListComponent } from './list/list.component';
import { RawMaterialDetailsComponent } from './details/details.component';

@NgModule({
    declarations: [
        RawMaterialComponent,
        RawMaterialListComponent,
        RawMaterialDetailsComponent
    ],
    imports: [
        RouterModule.forChild(RawMaterialRoutes),
        NgxPrintModule,
        NgxMatSelectSearchModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatMenuModule,
        MatPaginatorModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatSnackBarModule,
        MatSortModule,
        MatTooltipModule,
        FuseAlertModule,
        FuseDrawerModule,
        FuseScrollbarModule,
        LookupSelectModule,
        SharedModule
    ]
})
export class RawMaterialModule {
}
