import { Route } from '@angular/router';
import { ProductionProgramsComponent } from './productionPrograms.component';
import { ProductionProgramsListComponent } from './list/list.component';
export const ProductionProgramsRoutes: Route[] = [
    {
        path: '',
        component: ProductionProgramsComponent,

        children: [
            {
                path: '',
                pathMatch: 'full',
                component: ProductionProgramsListComponent,

            },
        ]
    }
];
