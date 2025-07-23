import { Route } from '@angular/router';
import { OrderComponent } from './order.component';
import { OrderListComponent } from './list/list.component';
import { OrderDetailsComponent } from './details/details.component';

export const OrderRoutes: Route[] = [
    {
        path: '',
        component: OrderComponent,

        children: [
            {
                path: '',
                pathMatch: 'full',
                component: OrderListComponent,

            },
            {
                path: 'details',
                pathMatch: 'full',
                component: OrderDetailsComponent,
            }
        ]
    }
];
