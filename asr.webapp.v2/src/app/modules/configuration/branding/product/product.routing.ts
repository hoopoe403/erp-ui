import { Route } from '@angular/router';
import { ProductComponent } from './product.component';
import { ProductListComponent } from './list/list.component';
import { ProductSubsetComponent } from './subset/subset.component';
export const ProductRoutes: Route[] = [
    {
        path: '',
        component: ProductComponent,

        children: [
            {
                path: '',
                pathMatch: 'full',
                component: ProductListComponent,

            },
            {
                path: 'subset/:id',
                component: ProductSubsetComponent,
            }
        ]
    }
];
