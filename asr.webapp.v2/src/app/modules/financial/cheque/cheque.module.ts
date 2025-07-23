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
import { ChequeRoutes } from './cheque.routing';
import { ChequeComponent } from './cheque.component';
import { ChequeListComponent } from './list/list.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from "@angular/material/menu";
import { FuseAlertModule } from '@fuse/components/alert';
import { FuseScrollbarModule } from '@fuse/directives/scrollbar/public-api';
import { FuseDrawerModule } from '@fuse/components/drawer';
import { NgxPrintModule } from 'ngx-print';
import { NgxJDatePickerModule } from 'ngx-jdatepicker';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatTreeModule } from "@angular/material/tree";
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { DecimalPipe } from '@angular/common';
import { ExcelService } from '../../../shared/excel/excel.service';
import { CashChequeDialogComponent } from './details/dialog/dialog.component';
import { ChequeTransactionDialogComponent } from './details/history/dialog.component';
import { ChequeDialogComponent } from './details/cheque/cheque.component';
import { DialogService } from './details/dialog.service';
import { HistoryDialogService } from './details/dialog.service';
import { ChequeInfoDialogService } from './details/dialog.service';
import { NumberToPersianPipe } from './number-to-persian.pipe';
import { PersianMonthNamePipe } from './persian-month-name.pipe';
import { MatDialogModule } from '@angular/material/dialog';
import { OverlayModule } from '@angular/cdk/overlay';
@NgModule({
    declarations: [
        ChequeComponent,
        ChequeListComponent,
        CashChequeDialogComponent,
        ChequeTransactionDialogComponent,
        ChequeDialogComponent,
        NumberToPersianPipe,
        PersianMonthNamePipe
    ],
    imports: [
        OverlayModule,
        MatDialogModule,
        MatSnackBarModule,
        MatCheckboxModule,
        MatTreeModule,
        NgxMatSelectSearchModule,
        NgxJDatePickerModule,
        NgxPrintModule,
        RouterModule.forChild(ChequeRoutes),
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
        FuseAlertModule,
        FuseScrollbarModule,
        FuseDrawerModule
    ],

    providers: [
        DecimalPipe, ExcelService, DialogService, HistoryDialogService, ChequeInfoDialogService
    ]
})
export class ChequeModule {
}
