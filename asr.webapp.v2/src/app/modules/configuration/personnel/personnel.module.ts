import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { SharedModule } from "app/shared/shared.module";
import { PersonnelComponent } from "./personnel.component";
import { PersonnelListComponent } from "./list/list.component";
import { PersonnelDetailsComponent } from "./details/details.component";

import { RouterModule } from "@angular/router";
import { PersonnelRoutes } from "./personnel.routing";

import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatIconModule } from "@angular/material/icon";
import { MatFormFieldModule } from "@angular/material/form-field";
import { NgxPrintModule } from "ngx-print";
import { MatButtonModule } from "@angular/material/button";
import { MatInputModule } from "@angular/material/input";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatMenuModule } from "@angular/material/menu";
import { FuseDrawerModule } from "@fuse/components/drawer";
import { FuseAlertModule } from "@fuse/components/alert";
import { MatSelectModule } from "@angular/material/select";
import { MatTabsModule } from "@angular/material/tabs";
import { MatSortModule } from "@angular/material/sort";

@NgModule({
  declarations: [
    PersonnelComponent,
    PersonnelListComponent,
    PersonnelDetailsComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(PersonnelRoutes),
    SharedModule,
    MatProgressBarModule,
    MatIconModule,
    MatFormFieldModule,
    NgxPrintModule,
    MatButtonModule,
    MatInputModule,
    MatPaginatorModule,
    MatMenuModule,
    FuseDrawerModule,
    FuseAlertModule,
    MatSelectModule,
    MatTabsModule,
    MatSortModule,
  ],
})
export class PersonnelModule { }
