import { Route } from '@angular/router';
import { RevenueComponent } from './revenue.component';
import { RevenueDetailsComponent } from './details/details.component';
import { RevenueListComponent } from './list/list.component';
export const RevenueRoutes: Route[] = [
    {
        path: '',
        component: RevenueComponent,

        children: [
            {
                path: 'list',
                pathMatch: 'full',
                component: RevenueListComponent,
            },
            {
                path: 'details/:id',
                component: RevenueDetailsComponent,
            },
            {
                path: 'details',
                pathMatch: 'full',
                component: RevenueDetailsComponent,
            }
        ]
    }
];
