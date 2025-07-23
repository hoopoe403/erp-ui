import { Route } from '@angular/router';
import { FactoryOrderComponent } from './factory-order.component';
import { FactoryOrderListComponent } from './list/list.component';
import { FactoryOrderDetailsComponent } from './details/details.component';
import {ContractorFactoryOrderComponent} from './contractor-factory-order/contractorFactoryOrder.component'

export const FactoryOrderRoutes: Route[] = [
    {
        path: '',
        component: FactoryOrderComponent,

        children: [
            {
                path: '',
                pathMatch: 'full',
                component: FactoryOrderListComponent,

            }, {
                path: "details",
                pathMatch: "full",
                component: FactoryOrderDetailsComponent,
            },
            {
                path: "details/:id",
                component: FactoryOrderDetailsComponent,
            },
            {
                path: "contractorOrder/:id/:purchaserId",
                component: ContractorFactoryOrderComponent,
            },
        ]
    }
];