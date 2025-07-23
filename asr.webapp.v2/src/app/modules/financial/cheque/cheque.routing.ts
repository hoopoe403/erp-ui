import { Route } from '@angular/router';
import { ChequeComponent } from './cheque.component';
import { ChequeListComponent } from './list/list.component';
export const ChequeRoutes: Route[] = [
    {
        path: '',
        component: ChequeComponent,

        children: [
            {
                path: 'list',
                pathMatch: 'full',
                component: ChequeListComponent,

            },
        ]
    }
];
