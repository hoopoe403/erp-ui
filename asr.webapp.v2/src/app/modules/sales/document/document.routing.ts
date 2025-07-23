import { Route } from '@angular/router';
import { DocumentComponent } from './document.component';
import { DocumentListComponent } from './list/list.component';
import { PaymentComponent } from './payment/payment.component';
import { DocumentDetailsComponent } from './details/details.component';

export const DocumentRoutes: Route[] = [
    {
        path: '',
        component: DocumentComponent,

        children: [
            {
                path: '',
                pathMatch: 'full',
                component: DocumentListComponent,

            },

            {
                path: 'payment',
                pathMatch: 'full',
                component: PaymentComponent,
            },
            {
                path: 'details',
                pathMatch: 'full',
                component: DocumentDetailsComponent,
            }
        ]
    }
];
