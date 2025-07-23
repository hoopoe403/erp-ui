
import { NgModule } from "@angular/core";
import { BrandComponent } from "./brand.component";
import { RouterModule } from '@angular/router';import { BrandRoutes } from "./brand.routing";
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from "@angular/material/table";
import { MatSortModule } from "@angular/material/sort";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FuseFindByKeyPipeModule } from '@fuse/pipes/find-by-key';
import { SharedModule } from 'app/shared/shared.module';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { FuseAlertModule } from '@fuse/components/alert';
import { FuseScrollbarModule } from '@fuse/directives/scrollbar/public-api';
import { FuseDrawerModule } from '@fuse/components/drawer';
import { NgxPrintModule } from 'ngx-print';
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { NgxJDatePickerModule } from 'ngx-jdatepicker';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatTreeModule } from "@angular/material/tree";
import { MatCheckboxModule } from '@angular/material/checkbox';
import { BrandListComponent } from "./list/list.component";
import { BrandDetailsComponent } from "./details/details.component";
import { BrandDialogComponent } from "./dialogDetail/dialog.component";
import { MatDialogModule } from '@angular/material/dialog';
import { MenuItemListComponent } from "./menu-item-list/menu-item-list.component";

@NgModule({
    declarations : [
        BrandComponent,
        BrandListComponent,
        BrandDialogComponent,
        BrandDetailsComponent,
        MenuItemListComponent
    ],
    imports : [
        RouterModule.forChild(BrandRoutes),
        MatCheckboxModule,
        MatTreeModule,
        MatDialogModule,
        NgxMatSelectSearchModule,
        NgxJDatePickerModule,
        NgxPrintModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressBarModule,
        MatSelectModule,
        MatSidenavModule,
        MatSlideToggleModule,
        MatTooltipModule,
        FuseFindByKeyPipeModule,
        SharedModule,
        MatTabsModule,
        MatTableModule,
        MatSortModule,
        MatPaginatorModule,
        MatMenuModule,
        FuseAlertModule,
        FuseScrollbarModule,
        FuseDrawerModule,
        MatAutocompleteModule
    ]
})

export class BrandModule {
}