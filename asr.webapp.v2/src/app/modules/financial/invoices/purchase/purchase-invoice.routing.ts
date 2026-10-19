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
                data: { listView: 'OPEN' },
            },
            // Posted Invoices - backend menu row under Invoice links to /invoice/posted. Same list, no ADD.
            {
                path: 'posted',
                pathMatch: 'full',
                component: PurchaseInvoiceListComponent,
                data: { listView: 'POSTED' },
            },
            // Invoices to Approve - an approver's inbox (/invoice/approvals): Pending Approval invoices assigned
            // to the current user. Same list, no Status column, no ADD.
            {
                path: 'approvals',
                pathMatch: 'full',
                component: PurchaseInvoiceListComponent,
                data: { listView: 'TO_APPROVE' },
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
