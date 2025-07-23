import { Route } from '@angular/router';
import { SoftwareTaskComponent } from './software-task.component';
import { SoftwareTaskListComponent } from './list/list.component';
import { SoftwareTaskDetailsComponent } from './details/details.component';
export const SoftwareTaskRoutes: Route[] = [
    {
        path: '',
        component: SoftwareTaskComponent,

        children: [
            {
                path: '',
                pathMatch: 'full',
                component: SoftwareTaskListComponent,

            },
            {
                path: 'details',
                pathMatch: 'full',
                component: SoftwareTaskDetailsComponent,
            },
            {
                path: 'details/:id',
                component: SoftwareTaskDetailsComponent,
            }
        ]
    }
];
