import { Route } from '@angular/router';
import { ManualInvoiceComponent } from './manual-invoice.component';
import { ManualInvoiceListComponent } from './list/list.component';

export const ManualInvoiceRoutes: Route[] = [
    {
        path: '',
        component: ManualInvoiceComponent,

        children: [
            {
                path: '',
                pathMatch: 'full',
                component: ManualInvoiceListComponent,

            },
        ]
    }
];
