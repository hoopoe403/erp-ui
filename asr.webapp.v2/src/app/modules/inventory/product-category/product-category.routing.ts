import { Route } from '@angular/router';
import { ProductCategoryComponent } from './product-category.component';
import { ProductCategoryListComponent } from './list/list.component';
import { ProductCategoryTreeComponent } from './tree/tree.component';

export const ProductCategoryRoutes: Route[] = [
    {
        path: '',
        component: ProductCategoryComponent,
        children: [
            {
                path: '',
                pathMatch: 'full',
                component: ProductCategoryListComponent,
            },
            {
                path: 'tree',
                pathMatch: 'full',
                component: ProductCategoryTreeComponent,
            },
            {
                path: 'tree/:id',
                component: ProductCategoryTreeComponent,
            }
        ]
    }
];
