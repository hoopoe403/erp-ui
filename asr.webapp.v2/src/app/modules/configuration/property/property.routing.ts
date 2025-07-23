import { Route } from '@angular/router';
import { PropertyComponent } from './property.component';
import { PropertyDetailsComponent } from './details/details.component';
import { PropertyListComponent } from './list/list.component';

export const PropertyRoutes: Route[] = [
    {
        path: "",
        component: PropertyComponent,
        children: [
            {
                path: "",
                pathMatch: "full",
                component: PropertyListComponent
            },
            {
                path: "register",
                pathMatch: "full",
                component: PropertyDetailsComponent,
            },
            {
                path: ":id",
                component: PropertyDetailsComponent
            },
        ],
    },
];
