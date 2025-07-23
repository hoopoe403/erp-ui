import { Route } from '@angular/router';
import { ManualInvoiceComponent } from './manual-invoice.component';
import { ManualInvoiceListComponent } from './list/list.component';
import { ManualInvoiceDetailsComponent } from './details/details.component';

export const ManualInvoiceRoutes: Route[] = [
    {
        path: '',
        component: ManualInvoiceComponent,

        children: [
            {
                path: 'list',
                pathMatch: 'full',
                component: ManualInvoiceListComponent,

            },
            {
                path: 'details/:id',
                component: ManualInvoiceDetailsComponent,
            },
            {
                path: 'details',
                component: ManualInvoiceDetailsComponent,
            }
        ]
    }
];
