import { Route } from '@angular/router';
import { CustomerTypeComponent } from './customer-type.component';
import { CustomerTypeListComponent } from './list/list.component';
import { CustomerTypeDetailsComponent } from './details/details.component';

export const CustomerTypeRoutes: Route[] = [
    {
        path: '',
        component: CustomerTypeComponent,

        children: [
            {
                path: '',
                pathMatch: 'full',
                component: CustomerTypeListComponent,

            },
            {
                path: 'details/:id',
                component: CustomerTypeDetailsComponent,
            },
            {
                path: 'details',
                component: CustomerTypeDetailsComponent,
            }
        ]
    }
];
