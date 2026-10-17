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
import { FuseScrollbarModule } from "@fuse/directives/scrollbar/public-api";
import { MatTabsModule } from "@angular/material/tabs";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatSnackBarModule } from "@angular/material/snack-bar";

import { NgxPrintModule } from "ngx-print";
import { MatFormFieldModule } from "@angular/material/form-field";

import { vendorsRoutes } from "./vendor.routing";
import { VendorsComponent } from "./vendors.component";
import { VendorsDetailsComponent } from "./details/details.component";
import { VendorsListComponent } from "./list/list.component";
import { BankAccountModule } from '../shared/bank-account/bank-account.module';

@NgModule({
  declarations: [
    VendorsComponent,
    VendorsDetailsComponent,
    VendorsListComponent,
  ],
  imports: [
    RouterModule.forChild(vendorsRoutes),
    CommonModule,
    BankAccountModule,
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
    FuseScrollbarModule,
    SharedModule,
    MatTabsModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
})
export class VendorModule {}
