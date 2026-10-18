import { Route } from '@angular/router';
import { VatSetupComponent } from './vat-setup.component';
import { VatSetupDetailsComponent } from './details/details.component';
import { VatSetupListComponent } from './list/list.component';

export const VatSetupRoutes: Route[] = [
    {
        path: '',
        component: VatSetupComponent,
        children: [
            { path: '', pathMatch: 'full', redirectTo: 'list' },
            { path: 'list', pathMatch: 'full', component: VatSetupListComponent },
            { path: 'details/:id', component: VatSetupDetailsComponent },
            { path: 'details', pathMatch: 'full', component: VatSetupDetailsComponent }
        ]
    }
];
