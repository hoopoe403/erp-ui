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
import { OrderRoutes } from './order.routing';
import { OrderComponent } from './order.component';
import { OrderListComponent } from './list/list.component';
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
import { OrderDetailsComponent } from 'app/modules/sales/order/details/details.component';
import { DetailsCustomerComponent } from 'app/modules/sales/order/details/customer/customer.component';
import { DetailsChangeHistoryComponent } from 'app/modules/sales/order/details/change-history/change-history.component';
import { DetailsPreviewComponent } from 'app/modules/sales/order/details/preview/preview.component';
import { DetailsProductsComponent } from 'app/modules/sales/order/details/products/products.component';
import { MatRadioModule } from '@angular/material/radio';
import { NumberFormatDirective } from './formater.component';
@NgModule({
    declarations: [
        OrderDetailsComponent,
        DetailsCustomerComponent,
        DetailsChangeHistoryComponent,
        DetailsPreviewComponent,
        DetailsProductsComponent,
        OrderComponent,
        OrderListComponent,
        NumberFormatDirective,
    ],
    imports: [MatRadioModule,
        MatCheckboxModule,
        MatTreeModule,
        NgxMatSelectSearchModule,
        NgxJDatePickerModule,
        NgxPrintModule,
        RouterModule.forChild(OrderRoutes),
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
    providers: [DecimalPipe
    ]
})
export class OrderModule {
}
