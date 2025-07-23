import { Route } from '@angular/router';
import { DocumentComponent } from './document.component';
import { DocumentListComponent } from './list/list.component';
export const DocumentRoutes: Route[] = [
    {
        path: '',
        component: DocumentComponent,

        children: [
            {
                path: 'list',
                pathMatch: 'full',
                component: DocumentListComponent,

            },
        ]
    }
];
