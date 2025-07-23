import { Route } from '@angular/router';
import { GoodsInventoryComponent } from './goods-inventory.component';
import { GoodsInventoryListComponent } from './list/list.component';
export const GoodsInventoryRoutes: Route[] = [
    {
        path: '',
        component: GoodsInventoryComponent,

        children: [
            {
                path: '',
                pathMatch: 'full',
                component: GoodsInventoryListComponent,

            },
        ]
    }
];
