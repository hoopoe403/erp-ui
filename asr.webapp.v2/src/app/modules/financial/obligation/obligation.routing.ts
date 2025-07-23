import { Route } from '@angular/router';
import { ObligationComponent } from './obligation.component';
import { ObligationListComponent } from './list/list.component';
import { ObligationDetailsComponent } from './details/details.component';

export const ObligationRoutes: Route[] = [
    {
        path: '',
        component: ObligationComponent,

        children: [
            {
                path: '',
                pathMatch: 'full',
                component: ObligationListComponent,

            },
            {
                path: 'details/:id',
                component: ObligationDetailsComponent,
            },
            {
                path: 'details',
                component: ObligationDetailsComponent,
            }
        ]
    }
];
