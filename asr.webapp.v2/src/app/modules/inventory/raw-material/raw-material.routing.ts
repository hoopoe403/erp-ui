import { Route } from '@angular/router';
import { RawMaterialComponent } from './raw-material.component';
import { RawMaterialDetailsComponent } from './details/details.component';
import { RawMaterialListComponent } from './list/list.component';

export const RawMaterialRoutes: Route[] = [
    {
        path: '',
        component: RawMaterialComponent,
        children: [
            {
                path: '',
                pathMatch: 'full',
                component: RawMaterialListComponent,
            },
            {
                path: 'details',
                pathMatch: 'full',
                component: RawMaterialDetailsComponent,
            },
            {
                path: 'details/:id',
                component: RawMaterialDetailsComponent,
            }
        ]
    }
];
