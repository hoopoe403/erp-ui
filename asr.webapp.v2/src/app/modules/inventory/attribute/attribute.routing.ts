import { Route } from '@angular/router';
import { AttributeComponent } from './attribute.component';
import { AttributeDetailsComponent } from './details/details.component';
import { AttributeListComponent } from './list/list.component';

export const AttributeRoutes: Route[] = [
    {
        path: '',
        component: AttributeComponent,
        children: [
            {
                path: '',
                pathMatch: 'full',
                component: AttributeListComponent,
            },
            {
                path: 'details',
                pathMatch: 'full',
                component: AttributeDetailsComponent,
            },
            {
                path: 'details/:id',
                component: AttributeDetailsComponent,
            }
        ]
    }
];
