import { Route } from '@angular/router';
import { PaymentPostingSetupComponent } from './payment-posting-setup.component';
import { PaymentPostingSetupDetailsComponent } from './details/details.component';
import { PaymentPostingSetupListComponent } from './list/list.component';

export const PaymentPostingSetupRoutes: Route[] = [
    {
        path: '',
        component: PaymentPostingSetupComponent,
        children: [
            { path: '', pathMatch: 'full', redirectTo: 'list' },
            { path: 'list', pathMatch: 'full', component: PaymentPostingSetupListComponent },
            { path: 'details/:id', component: PaymentPostingSetupDetailsComponent },
            { path: 'details', pathMatch: 'full', component: PaymentPostingSetupDetailsComponent }
        ]
    }
];
