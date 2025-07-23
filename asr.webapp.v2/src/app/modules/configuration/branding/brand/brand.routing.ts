import { Component } from "@angular/core";
import { Route } from "@angular/router";
import { BrandComponent } from "./brand.component";
import { BrandListComponent } from "./list/list.component";
import { BrandDetailsComponent } from "./details/details.component";

export const BrandRoutes: Route[] = [
    {
        path: '',
        component: BrandComponent,

        children: [
            {
                path: '',
                pathMatch: 'full',
                component: BrandListComponent
            }, {
                path: "details",
                pathMatch: "full",
                component: BrandDetailsComponent,
            }, {
                path: "details/:id",
                component: BrandDetailsComponent,
            }
        ]
    }
]