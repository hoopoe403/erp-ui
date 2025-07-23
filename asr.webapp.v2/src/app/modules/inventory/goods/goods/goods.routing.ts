import { Route } from '@angular/router';
import { GoodsComponent } from './goods.component';
import { GoodsListComponent } from './list/list.component';
import { GoodsDetailsComponent } from 'app/modules/inventory/goods/goods/details/details.component';
export const goodsRoutes: Route[] = [
    {
        path: '',
        component: GoodsComponent,
        children: [
            {
                path: '',
                pathMatch: 'full',
                component: GoodsListComponent
            },
            {
                path: 'details/:id',
                component: GoodsDetailsComponent,
            },
            {
                path: 'details',
                component: GoodsDetailsComponent,
            }
        ]
    }
];
