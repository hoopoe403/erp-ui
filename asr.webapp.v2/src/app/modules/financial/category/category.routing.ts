import { Route } from '@angular/router';
import { CategoryComponent } from './category.component';
import { CategoriesResolver } from './category.resolvers';
import { CategroyDetailsComponent } from './details/details.component';
import { CategoryListComponent } from './list/list.component';

export const CategoryRoutes: Route[] = [
    {
        path: '',
        component: CategoryComponent,

        children: [
            {
                path: 'list',
                pathMatch: 'full',
                component: CategoryListComponent,
              
            },
            {
                path: 'details',
                pathMatch: 'full',
                component: CategroyDetailsComponent,
            }
        ]
    }
];
