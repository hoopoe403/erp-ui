import { Route } from '@angular/router';
import { TrialBalanceComponent } from './trial-balance.component';
import { TrialBalanceListComponent } from './list/list.component';
export const TrialBalanceRoutes: Route[] = [
    {
        path: '',
        component: TrialBalanceComponent,

        children: [
            {
                path: 'list',
                pathMatch: 'full',
                component: TrialBalanceListComponent,

            },
        ]
    }
];
