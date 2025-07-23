import { Route } from '@angular/router';
import { ProductInventoryComponent } from './product-inventory.component';
import { ProductInventoryListComponent } from './list/list.component';
export const ProductInventoryRoutes: Route[] = [
    {
        path: '',
        component: ProductInventoryComponent,

        children: [
            {
                path: '',
                pathMatch: 'full',
                component: ProductInventoryListComponent,

            },
        ]
    }
];
