import { Route } from '@angular/router';
import { OrganizationComponent } from './organization.component';
import { OrganizationListComponent } from './list/list.component';
import { OrganizationDetailsComponent } from 'app/modules/configuration/organization/organization/details/details.component';
import { OrganizationResolver } from 'app/modules/configuration/organization/organization/organization.resolvers';

export const organizationRoutes: Route[] = [
    {
        path: '',
        component: OrganizationComponent,
        children: [
            {
                path: '',
                pathMatch: 'full',
                component: OrganizationListComponent,
                resolve: {
                    data: OrganizationResolver
                }
            },
            {
                path: ':id',
                component: OrganizationDetailsComponent,
            },
            {
                path: '',
                component: OrganizationDetailsComponent,
            }
        ]
    }
];
