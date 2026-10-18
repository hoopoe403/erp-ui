import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FuseAlertModule } from '@fuse/components/alert';
import { SharedModule } from 'app/shared/shared.module';
import { LookupSelectModule } from 'app/modules/financial/shared/lookup-select/lookup-select.module';
import { PaymentPostingSetupRoutes } from './payment-posting-setup.routing';
import { PaymentPostingSetupComponent } from './payment-posting-setup.component';
import { PaymentPostingSetupListComponent } from './list/list.component';
import { PaymentPostingSetupDetailsComponent } from './details/details.component';

/**
 * Creditor Posting Setup (/creditor-posting-setup) and Debtor Posting Setup (/debtor-posting-setup): one module,
 * loaded on both routes; the route's `invoiceSide` data says which side a page shows.
 */
@NgModule({
    declarations: [
        PaymentPostingSetupComponent,
        PaymentPostingSetupListComponent,
        PaymentPostingSetupDetailsComponent
    ],
    imports: [
        RouterModule.forChild(PaymentPostingSetupRoutes),
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatProgressBarModule,
        MatSelectModule,
        MatTooltipModule,
        FuseAlertModule,
        SharedModule,
        LookupSelectModule
    ]
})
export class PaymentPostingSetupModule {
}
