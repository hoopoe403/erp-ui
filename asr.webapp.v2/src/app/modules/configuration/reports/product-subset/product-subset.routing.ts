import { Route } from '@angular/router';
import { ProductSubsetComponent } from './product-subset.component';
import { ProductSubsetListComponent } from './list/list.component';
export const ProductSubsetRoutes: Route[] = [
    {
        path: '',
        component: ProductSubsetComponent,

        children: [
            {
                path: '',
                pathMatch: 'full',
                component: ProductSubsetListComponent,

            },
        ]
    }
];
