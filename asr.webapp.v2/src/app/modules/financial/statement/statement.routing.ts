import { Route } from '@angular/router';
import { StatementComponent } from './statement.component';
import { StatementListComponent } from './list/list.component';
export const StatementRoutes: Route[] = [
    {
        path: '',
        component: StatementComponent,

        children: [
            {
                path: 'list',
                pathMatch: 'full',
                component: StatementListComponent,

            },
        ]
    }
];
