import { Route } from '@angular/router';
import { GoodsSubsetComponent } from './goods-subset.component';
import { GoodsSubsetListComponent } from './list/list.component';
export const GoodsSubsetRoutes: Route[] = [
    {
        path: '',
        component: GoodsSubsetComponent,

        children: [
            {
                path: '',
                pathMatch: 'full',
                component: GoodsSubsetListComponent,

            },
        ]
    }
];
