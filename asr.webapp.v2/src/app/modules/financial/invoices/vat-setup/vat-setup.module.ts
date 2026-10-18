import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FuseAlertModule } from '@fuse/components/alert';
import { SharedModule } from 'app/shared/shared.module';
import { LookupSelectModule } from 'app/modules/financial/shared/lookup-select/lookup-select.module';
import { VatSetupRoutes } from './vat-setup.routing';
import { VatSetupComponent } from './vat-setup.component';
import { VatSetupListComponent } from './list/list.component';
import { VatSetupDetailsComponent } from './details/details.component';

/** VAT Setup: the VAT rate of each VAT group x VAT product group pair, and the GL accounts its VAT posts to. */
@NgModule({
    declarations: [
        VatSetupComponent,
        VatSetupListComponent,
        VatSetupDetailsComponent
    ],
    imports: [
        RouterModule.forChild(VatSetupRoutes),
        MatButtonModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressBarModule,
        MatSelectModule,
        MatTooltipModule,
        FuseAlertModule,
        SharedModule,
        LookupSelectModule
    ]
})
export class VatSetupModule {
}
