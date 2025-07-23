import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgApexchartsModule } from 'ng-apexcharts';
import { SharedModule } from 'app/shared/shared.module';
import { ProfitLossComponent } from 'app/modules/financial/analytics/profit-loss/profit-loss.component';
import { ProfitLossRoutes } from 'app/modules/financial/analytics/profit-loss/profit-loss.routing';
import { DecimalPipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ExcelService } from '../../../../../app/shared/excel-v2/excel.service';
@NgModule({
    declarations: [
        ProfitLossComponent
    ],
    imports: [
        MatSelectModule,
        RouterModule.forChild(ProfitLossRoutes),
        MatFormFieldModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatDividerModule,
        MatIconModule,
        MatMenuModule,
        MatProgressBarModule,
        MatSortModule,
        MatTableModule,
        MatTooltipModule,
        NgApexchartsModule,
        SharedModule
    ],
    providers: [DecimalPipe, ExcelService
    ]
})
export class ProfitLossModule {
}
