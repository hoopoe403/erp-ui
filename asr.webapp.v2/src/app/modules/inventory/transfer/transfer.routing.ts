import { Route } from '@angular/router';
import { TransferComponent } from './transfer.component';
import { TransferListComponent } from './list/list.component';

export const TransferRoutes: Route[] = [
    {
        path: '',
        component: TransferComponent,

        children: [
            {
                path: '',
                pathMatch: 'full',
                component: TransferListComponent,

            }
        ]
    }
];
