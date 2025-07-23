import { Route } from '@angular/router';
import { WarehouseComponent } from './warehouse.component';
import { WarehouseDetailsComponent } from './details/details.component';
import { WarehouseListComponent } from './list/list.component';
import { Component } from '@fullcalendar/core';

export const WarehouseRoutes: Route[] = [
    {
        path: '',
        component: WarehouseComponent,

        children: [
            {
                path: '',
                pathMatch: 'full',
                component: WarehouseListComponent,

            },
            {
                path: 'details',
                pathMatch: 'full',
                component: WarehouseDetailsComponent,
            },
            {
                path: 'details/:id',
                component: WarehouseDetailsComponent,
            }
        ]
    }
];
