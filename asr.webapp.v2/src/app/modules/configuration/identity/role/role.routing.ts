import { Route } from '@angular/router';
import { RoleResolver } from 'app/modules/configuration/identity/role/role.resolvers';
import { RoleComponent } from 'app/modules/configuration/identity/role/role.component';
import { RoleListComponent } from 'app/modules/configuration/identity/role/list/list.component';
import { RoleDetailsComponent } from 'app/modules/configuration/identity/role/details/details.component';

export const RoleRoutes: Route[] = [
    {
        path: '',
        component: RoleComponent,
        children: [
            {
                path: '',
                pathMatch: 'full',
                component: RoleListComponent,
                resolve: {
                    tasks: RoleResolver
                }

            }, {
                path: "details",
                pathMatch: "full",
                component: RoleDetailsComponent,
            },
            {
                path: "details/:id",
                component: RoleDetailsComponent,
            },
        ]
    }
];
