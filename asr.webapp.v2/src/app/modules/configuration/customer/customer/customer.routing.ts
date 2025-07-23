import { Route } from '@angular/router';
import { CanDeactivateCustomerDetails } from 'app/modules/configuration/customer/customer/customer.guards';
import { CustomersCustomerResolver, CustomersResolver } from 'app/modules/configuration/customer/customer/customer.resolvers';
import { CustomerComponent } from 'app/modules/configuration/customer/customer/customer.component';
import { CustomerListComponent } from 'app/modules/configuration/customer/customer/list/list.component';
import { CustomerDetailsComponent } from 'app/modules/configuration/customer/customer/details/details.component';

export const customerRoutes: Route[] = [
    {
        path: '',
        component: CustomerComponent,
        children: [
            {
                path: '',
                component: CustomerListComponent,
                resolve: {
                    tasks: CustomersResolver
                },
                children: [
                    {
                        path: ':id',
                        component: CustomerDetailsComponent,
                        resolve: {
                            task: CustomersCustomerResolver
                        },
                        canDeactivate: [CanDeactivateCustomerDetails]
                    }
                ]
            }
        ]
    }
];
