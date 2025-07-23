import { Route } from '@angular/router';
import { UserResolver } from 'app/modules/configuration/identity/user/user.resolvers';
import { UserComponent } from 'app/modules/configuration/identity/user/user.component';
import { UserListComponent } from 'app/modules/configuration/identity/user/list/list.component';
import { UserDetailsComponent } from 'app/modules/configuration/identity/user/details/details.component';

export const UserRoutes: Route[] = [
    {
        path: '',
        component: UserComponent,
        children: [
            {
                path: '',
                pathMatch: 'full',
                component: UserListComponent,
                resolve: {
                    tasks: UserResolver
                }

            }, {
                path: "details",
                pathMatch: "full",
                component: UserDetailsComponent,
            },
            {
                path: "details/:id",
                component: UserDetailsComponent,
            },
        ]
    }
];
