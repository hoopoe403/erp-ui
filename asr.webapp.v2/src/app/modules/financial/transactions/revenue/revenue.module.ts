import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from "@angular/material/table";
import { MatSortModule } from "@angular/material/sort";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FuseFindByKeyPipeModule } from '@fuse/pipes/find-by-key';
import { SharedModule } from 'app/shared/shared.module';
import { RevenueRoutes } from './revenue.routing';
import { RevenueComponent } from './revenue.component';
import { RevenueDetailsComponent } from './details/details.component';
import { RevenueListComponent } from './list/list.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from "@angular/material/menu";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { FuseAlertModule } from '@fuse/components/alert';
import { FuseScrollbarModule } from '@fuse/directives/scrollbar/public-api';
import { FuseDrawerModule } from '@fuse/components/drawer';
import { NgxPrintModule } from 'ngx-print';
import { MatTreeModule } from "@angular/material/tree";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { NgxJDatePickerModule } from 'ngx-jdatepicker';
import { NumberToPersianPipe } from './number-to-persian.pipe';
import { PersianMonthNamePipe } from './persian-month-name.pipe';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MenuBottonComponent } from './details/menu-botton/menu-botton.component';
import { DecimalPipe } from '@angular/common';
import { ExcelService } from '../../../../shared/excel/excel.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';
@NgModule({
    declarations: [
        RevenueComponent,
        RevenueDetailsComponent,
        RevenueListComponent,
        NumberToPersianPipe,
        PersianMonthNamePipe,
        MenuBottonComponent
    ],
    imports: [
        MatSnackBarModule,
        NgxMatSelectSearchModule,
        NgxJDatePickerModule,
        NgxPrintModule,
        RouterModule.forChild(RevenueRoutes),
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressBarModule,
        MatSelectModule,
        MatSidenavModule,
        MatSlideToggleModule,
        MatTooltipModule,
        FuseFindByKeyPipeModule,
        SharedModule,
        MatTabsModule,
        MatTableModule,
        MatSortModule,
        MatPaginatorModule,
        MatMenuModule,
        MatCheckboxModule,
        FuseAlertModule,
        FuseScrollbarModule,
        FuseDrawerModule,
        MatTreeModule,
        MatAutocompleteModule
    ],
    providers: [
        ExcelService, DecimalPipe
    ]
})
export class RevenueModule {
}
