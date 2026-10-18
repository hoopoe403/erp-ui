import { Route } from '@angular/router';
import { RawMaterialCategoryComponent } from './raw-material-category.component';
import { RawMaterialCategoryListComponent } from './list/list.component';
import { RawMaterialCategoryTreeComponent } from './tree/tree.component';

export const RawMaterialCategoryRoutes: Route[] = [
    {
        path: '',
        component: RawMaterialCategoryComponent,
        children: [
            {
                path: '',
                pathMatch: 'full',
                component: RawMaterialCategoryListComponent,
            },
            {
                path: 'tree',
                pathMatch: 'full',
                component: RawMaterialCategoryTreeComponent,
            },
            {
                path: 'tree/:id',
                component: RawMaterialCategoryTreeComponent,
            }
        ]
    }
];
