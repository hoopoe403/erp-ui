import { Route } from '@angular/router';
import { ProductComponent } from './product.component';
import { ProductDetailsComponent } from './details/details.component';
import { ProductListComponent } from './list/list.component';

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
                path: 'details',
                pathMatch: 'full',
                component: ProductDetailsComponent,
            },
            {
                path: 'details/:id',
                component: ProductDetailsComponent,
            }
        ]
    }
];
