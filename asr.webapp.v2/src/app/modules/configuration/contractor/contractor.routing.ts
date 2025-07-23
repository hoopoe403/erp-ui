import { Route } from "@angular/router";
import { ContractorsComponent } from "./contractors.component";
import { ContractorsListComponent } from "./list/list.component";
import { ContractorsDetailsComponent } from "./details/details.component";

export const contractorsRoutes: Route[] = [
  {
    path: "",
    component: ContractorsComponent,
    children: [
      {
        path: "",
        pathMatch: "full",
        component: ContractorsListComponent,
      },
      {
        path: "register",
        pathMatch: "full",
        component: ContractorsDetailsComponent,
      },
      {
        path: ":id",
        component: ContractorsDetailsComponent,
      },
    ],
  },
];
