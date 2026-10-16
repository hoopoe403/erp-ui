import { Route } from '@angular/router';
import { AccountChartComponent } from './account-chart.component';
import { AccountChartDetailsComponent } from './details/details.component';
import { AccountChartListComponent } from './list/list.component';

export const AccountChartRoutes: Route[] = [
    {
        path: '',
        component: AccountChartComponent,

        children: [
            {
                path: 'list',
                pathMatch: 'full',
                component: AccountChartListComponent,
              
            },
            {
                path: 'details',
                pathMatch: 'full',
                component: AccountChartDetailsComponent,
            }
        ]
    }
];
