import { Route } from '@angular/router';
import { PurchaseInvoiceComponent } from './purchase-invoice.component';
import { PurchaseInvoiceListComponent } from './list/list.component';
import { PurchaseInvoiceDetailsComponent } from './details/details.component';

export const PurchaseInvoiceRoutes: Route[] = [
    {
        path: '',
        component: PurchaseInvoiceComponent,

        children: [
            {
                path: 'list',
                pathMatch: 'full',
                component: PurchaseInvoiceListComponent,

            },
            {
                path: 'details/:id',
                component: PurchaseInvoiceDetailsComponent,
            },
            {
                path: 'details',
                component: PurchaseInvoiceDetailsComponent,
            }
        ]
    }
];
