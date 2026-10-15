import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSortModule } from "@angular/material/sort";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { FuseAlertModule } from '@fuse/components/alert';
import { FuseScrollbarModule } from '@fuse/directives/scrollbar/public-api';
import { FuseDrawerModule } from '@fuse/components/drawer';
import { NgxPrintModule } from 'ngx-print';
import { SharedModule } from 'app/shared/shared.module';
import { AttributeRoutes } from './attribute.routing';
import { AttributeComponent } from './attribute.component';
import { AttributeDetailsComponent } from './details/details.component';
import { AttributeListComponent } from './list/list.component';

@NgModule({
    declarations: [
        AttributeComponent,
        AttributeDetailsComponent,
        AttributeListComponent
    ],
    imports: [
        RouterModule.forChild(AttributeRoutes),
        NgxPrintModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressBarModule,
        MatSelectModule,
        MatTooltipModule,
        MatTabsModule,
        MatSortModule,
        MatPaginatorModule,
        MatMenuModule,
        MatSnackBarModule,
        FuseAlertModule,
        FuseScrollbarModule,
        FuseDrawerModule,
        SharedModule
    ]
})
export class AttributeModule {
}
