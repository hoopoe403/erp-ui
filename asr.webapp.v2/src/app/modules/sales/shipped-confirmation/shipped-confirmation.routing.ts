import { Route } from '@angular/router';
import { ShippedConfirmationComponent } from './shipped-confirmation.component';
import { ShippedListComponent } from './list/list.component';
import { ShipedConfirmationDetailsComponent } from './details/details.component';

export const ShippedConfirmationRoutes: Route[] = [
    {
        path: '',
        component: ShippedConfirmationComponent,

        children: [
            {
                path: 'list',
                pathMatch: 'full',
                component: ShippedListComponent,

            },

            {
                path: 'details/:id',
                pathMatch: 'full',
                component: ShipedConfirmationDetailsComponent,
            }
        ]
    }
];
