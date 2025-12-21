import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ItemListComponent } from './item-list.component';

@NgModule({
    declarations: [
        ItemListComponent
    ],
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule
    ],
    exports: [
        ItemListComponent
    ]
})
export class ItemListModule { }
