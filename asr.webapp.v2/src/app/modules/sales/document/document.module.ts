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
import { DocumentRoutes } from './document.routing';
import { DocumentComponent } from './document.component';
import { DocumentListComponent } from './list/list.component';
import { PaymentComponent } from './payment/payment.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from "@angular/material/menu";
import { FuseAlertModule } from '@fuse/components/alert';
import { FuseScrollbarModule } from '@fuse/directives/scrollbar/public-api';
import { FuseDrawerModule } from '@fuse/components/drawer';
import { NgxPrintModule } from 'ngx-print';
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { NgxJDatePickerModule } from 'ngx-jdatepicker';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatTreeModule } from "@angular/material/tree";
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DecimalPipe } from '@angular/common';
import { PaymentDialogComponent } from './payment/dialog/dialog.component';
import { DialogService } from './payment/dialog.service';
import { DocumentDetailsComponent } from 'app/modules/sales/document/details/details.component';
import { DetailsCustomerComponent } from 'app/modules/sales/document/details/customer/customer.component';
import { DetailsChangeHistoryComponent } from 'app/modules/sales/document/details/change-history/change-history.component';
import { DetailsProductListComponent } from 'app/modules/sales/document/details/product-list/product-list.component';
import { DetailsInvoiceComponent } from 'app/modules/sales/document/details/invoice/invoice.component';
import { MatRadioModule } from '@angular/material/radio';
import { ExcelService } from 'app/shared/excel/excel.service';
@NgModule({
    declarations: [
        DocumentDetailsComponent,
        DetailsCustomerComponent,
        DetailsChangeHistoryComponent,
        DetailsProductListComponent,
        DetailsInvoiceComponent,
        DocumentComponent,
        DocumentListComponent,
        PaymentComponent,
        PaymentDialogComponent
    ],
    imports: [MatRadioModule,
        MatCheckboxModule,
        MatTreeModule,
        NgxMatSelectSearchModule,
        NgxJDatePickerModule,
        NgxPrintModule,
        RouterModule.forChild(DocumentRoutes),
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
        FuseDrawerModule,
        MatAutocompleteModule
    ],
    providers: [
        DialogService, DecimalPipe, ExcelService
    ]
})
export class DocumentModule {
}
