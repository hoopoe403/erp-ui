import { Route } from '@angular/router';
import { PurchaseInvoiceComponent } from './purchase-invoice.component';
import { PurchaseInvoiceListComponent } from './list/list.component';
import { PurchaseInvoiceDetailsComponent } from './details/details.component';
import { CanDeactivatePurchaseInvoiceDetails } from './purchase-invoice.guards';

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
                canDeactivate: [CanDeactivatePurchaseInvoiceDetails],
            },
            {
                path: 'details',
                component: PurchaseInvoiceDetailsComponent,
                canDeactivate: [CanDeactivatePurchaseInvoiceDetails],
            }
        ]
    }
];
