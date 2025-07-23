import { Route } from '@angular/router';
import { InvoiceComponent } from './invoice.component';
import { InvoiceListComponent } from './list/list.component';
import { InvoiceDetailsComponent } from './details/details.component';

export const InvoiceRoutes: Route[] = [
    {
        path: '',
        component: InvoiceComponent,

        children: [
            {
                path: 'list',
                pathMatch: 'full',
                component: InvoiceListComponent,

            },
            {
                path: 'details/:id',
                component: InvoiceDetailsComponent,
            },
            {
                path: 'details',
                component: InvoiceDetailsComponent,
            }
        ]
    }
];
