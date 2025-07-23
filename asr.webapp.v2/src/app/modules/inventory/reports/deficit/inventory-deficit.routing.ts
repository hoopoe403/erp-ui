import { Route } from '@angular/router';
import { InventoryDeficitComponent } from './inventory-deficit.component';
import { InventoryDeficitListComponent } from './list/list.component';
export const InventoryDeficitRoutes: Route[] = [
    {
        path: '',
        component: InventoryDeficitComponent,

        children: [
            {
                path: '',
                pathMatch: 'full',
                component: InventoryDeficitListComponent,

            },
        ]
    }
];
