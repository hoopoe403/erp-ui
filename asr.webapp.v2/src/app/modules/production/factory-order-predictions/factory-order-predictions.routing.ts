import { Route } from '@angular/router';
import { FactoryOrderPredictionsComponent } from './factory-order-predictions.component';
import { FactoryOrderPredictionsListComponent } from './list/list.component';
export const FactoryOrderPredictionsRoutes: Route[] = [
    {
        path: '',
        component: FactoryOrderPredictionsComponent,

        children: [
            {
                path: '',
                pathMatch: 'full',
                component: FactoryOrderPredictionsListComponent,

            },
        ]
    }
];
