import { Route } from "@angular/router";
import { PersonnelComponent } from "./personnel.component";
import { PersonnelListComponent } from "./list/list.component";
import { PersonnelDetailsComponent } from "./details/details.component";

export const PersonnelRoutes: Route[] = [
  {
    path: "",
    component: PersonnelComponent,
    children: [
      {
        path: "",
        pathMatch: "full",
        component: PersonnelListComponent
      },
      {
        path: "register",
        pathMatch: "full",
        component: PersonnelDetailsComponent,
      },
      {
        path: ":id",
        component: PersonnelDetailsComponent
      },
    ],
  },
];
