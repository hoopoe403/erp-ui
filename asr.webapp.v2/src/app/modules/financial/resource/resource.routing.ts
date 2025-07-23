import { Route } from '@angular/router';
import { ResourceComponent } from './resource.component';
import { ResourceDetailsComponent } from './details/details.component';
import { ResourceListComponent } from './list/list.component';

export const ResourceRoutes: Route[] = [
    {
        path: '',
        component: ResourceComponent,

        children: [
            {
                path: 'list',
                pathMatch: 'full',
                component: ResourceListComponent,

            },
            {
                path: 'details',
                pathMatch: 'full',
                component: ResourceDetailsComponent,
            },
            {
                path: 'details/:id',
                component: ResourceDetailsComponent,
            }
        ]
    }
];
