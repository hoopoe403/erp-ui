import { Route } from '@angular/router';
import { ProfitLossComponent } from 'app/modules/financial/analytics/profit-loss/profit-loss.component';
import { ProfitLossResolver } from 'app/modules/financial/analytics/profit-loss/profit-loss.resolvers';

export const ProfitLossRoutes: Route[] = [
    {
        path: '',
        component: ProfitLossComponent,
        resolve: {
            data: ProfitLossResolver
        }
    }
];
