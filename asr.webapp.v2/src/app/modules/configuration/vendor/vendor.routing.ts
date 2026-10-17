import { Route } from "@angular/router";
import { VendorsComponent } from "./vendors.component";
import { VendorsListComponent } from "./list/list.component";
import { VendorsDetailsComponent } from "./details/details.component";

export const vendorsRoutes: Route[] = [
  {
    path: "",
    component: VendorsComponent,
    children: [
      {
        path: "",
        pathMatch: "full",
        component: VendorsListComponent,
      },
      {
        path: "register",
        pathMatch: "full",
        component: VendorsDetailsComponent,
      },
      {
        path: ":id",
        component: VendorsDetailsComponent,
      },
    ],
  },
];
