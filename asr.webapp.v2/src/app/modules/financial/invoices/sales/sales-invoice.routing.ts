import { Route } from '@angular/router';
import { SalesInvoiceComponent } from './sales-invoice.component';
import { SalesInvoiceListComponent } from './list/list.component';
import { SalesInvoiceDetailsComponent } from './details/details.component';
import { CanDeactivateSalesInvoiceDetails } from './sales-invoice.guards';

export const SalesInvoiceRoutes: Route[] = [
    {
        path: '',
        component: SalesInvoiceComponent,

        children: [
            {
                path: 'list',
                pathMatch: 'full',
                component: SalesInvoiceListComponent,

            },
            {
                path: 'details/:id',
                component: SalesInvoiceDetailsComponent,
                canDeactivate: [CanDeactivateSalesInvoiceDetails],
            },
            {
                path: 'details',
                component: SalesInvoiceDetailsComponent,
                canDeactivate: [CanDeactivateSalesInvoiceDetails],
            }
        ]
    }
];
