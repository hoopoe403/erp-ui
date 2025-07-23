import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DATE_FORMATS, MatRippleModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import * as moment from 'moment';
import { FuseFindByKeyPipeModule } from '@fuse/pipes/find-by-key';
import { SharedModule } from 'app/shared/shared.module';
import { customerRoutes } from 'app/modules/configuration/customer/customer/customer.routing';
import { CustomerComponent } from 'app/modules/configuration/customer/customer/customer.component';
import { CustomerDetailsComponent } from 'app/modules/configuration/customer/customer/details/details.component';
import { CustomerListComponent } from 'app/modules/configuration/customer/customer/list/list.component';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CdkStepperModule } from '@angular/cdk/stepper';
import { CdkTableModule } from '@angular/cdk/table';
import { CdkTreeModule } from '@angular/cdk/tree';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { DecimalPipe } from '@angular/common';
import { ExcelService } from '../../../../shared/excel/excel.service';
import { FuseDrawerModule } from '@fuse/components/drawer';
import { FuseScrollbarModule } from '@fuse/directives/scrollbar/public-api';
import { BudgetDetailDialogComponent } from './dialog/dialog.component';
import { DialogService } from './dialog/dialog.service';
import { MatDialogModule } from '@angular/material/dialog';
import { FuseAlertModule } from "@fuse/components/alert";

@NgModule({
    declarations: [BudgetDetailDialogComponent,
        CustomerComponent,
        CustomerListComponent,
        CustomerDetailsComponent
    ],
    imports: [ScrollingModule, MatDialogModule,
        MatSortModule,
        FuseScrollbarModule,
        FuseDrawerModule,
        MatPaginatorModule,
        NgxSpinnerModule,
        InfiniteScrollModule,
        RouterModule.forChild(customerRoutes),
        MatButtonModule,
        MatCheckboxModule,
        MatDatepickerModule,
        MatDividerModule,
        MatFormFieldModule, FuseAlertModule,
        MatIconModule,
        MatInputModule,
        MatMenuModule,
        MatMomentDateModule,
        MatProgressBarModule,
        MatRadioModule,
        MatRippleModule,
        MatSelectModule,
        MatSidenavModule,
        MatTableModule,
        MatTooltipModule,
        FuseFindByKeyPipeModule,
        SharedModule
    ],
    exports: [CdkStepperModule,
        CdkTableModule,
        CdkTreeModule],
    providers: [DecimalPipe, ExcelService, DialogService,
        {
            provide: MAT_DATE_FORMATS,
            useValue: {
                parse: {
                    dateInput: moment.ISO_8601
                },
                display: {
                    dateInput: 'LL',
                    monthYearLabel: 'MMM YYYY',
                    dateA11yLabel: 'LL',
                    monthYearA11yLabel: 'MMMM YYYY'
                }
            }
        }
    ]
})
export class CustomerModule {
}
