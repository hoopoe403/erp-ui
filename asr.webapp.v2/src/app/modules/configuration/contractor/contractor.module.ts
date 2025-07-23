import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";

import { SharedModule } from "app/shared/shared.module";

import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatInputModule } from "@angular/material/input";
import { MatSortModule } from "@angular/material/sort";
import { MatMenuModule } from "@angular/material/menu";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatSelectModule } from "@angular/material/select";
import { FuseDrawerModule } from "@fuse/components/drawer";
import { FuseAlertModule } from "@fuse/components/alert";
import { MatTabsModule } from "@angular/material/tabs";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatTooltipModule } from "@angular/material/tooltip";

import { NgxPrintModule } from "ngx-print";
import { MatFormFieldModule } from "@angular/material/form-field";

import { contractorsRoutes } from "./contractor.routing";
import { ContractorsComponent } from "./contractors.component";
import { ContractorsDetailsComponent } from "./details/details.component";
import { ContractorsListComponent } from "./list/list.component";

@NgModule({
  declarations: [
    ContractorsComponent,
    ContractorsDetailsComponent,
    ContractorsListComponent,
  ],
  imports: [
    RouterModule.forChild(contractorsRoutes),
    CommonModule,
    MatIconModule,
    MatButtonModule,
    NgxPrintModule,
    MatFormFieldModule,
    MatInputModule,
    MatSortModule,
    MatPaginatorModule,
    MatMenuModule,
    MatSelectModule,
    FuseDrawerModule,
    FuseAlertModule,
    SharedModule,
    MatTabsModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
})
export class ContractorModule {}
