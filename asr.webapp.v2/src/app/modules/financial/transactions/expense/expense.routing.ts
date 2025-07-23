import { Route } from '@angular/router';
import { ExpenseComponent } from './expense.component';
import { ExpenseDetailsComponent } from './details/details.component';
import { ExpenseListComponent } from './list/list.component';
import { ExpensesResolver } from './expense.resolvers';
export const ExpenseRoutes: Route[] = [
    {
        path: '',
        component: ExpenseComponent,

        children: [
            {
                path: 'list',
                pathMatch: 'full',
                component: ExpenseListComponent,
                resolve: {
                    expenses: ExpensesResolver
                }
            },
            {
                path: 'details/:id',
                component: ExpenseDetailsComponent,
            },
            {
                path: 'details',
                pathMatch: 'full',
                component: ExpenseDetailsComponent,
            }
        ]
    }
];
