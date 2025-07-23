import { Route } from '@angular/router';
import { PricingResolver } from 'app/modules/configuration/branding/pricing/pricing.resolvers';
import { PricingComponent } from 'app/modules/configuration/branding/pricing/pricing.component';
import { PricingListComponent } from 'app/modules/configuration/branding/pricing/list/list.component';

export const PricingRoutes: Route[] = [
    {
        path: '',
        component: PricingComponent,
        children: [
            {
                path: '',
                component: PricingListComponent,
                resolve: {
                    tasks: PricingResolver
                }
            }
        ]
    }
];
