import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { FuseConfirmationModule } from '@fuse/services/confirmation';
import { ItemListModule } from '../item-list/item-list.module';
import { UnitPropertiesDialogComponent } from './unit-properties-dialog.component';
import { UnitEditorComponent } from './unit-editor.component';

@NgModule({
    declarations: [
        UnitEditorComponent,
        UnitPropertiesDialogComponent
    ],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatCheckboxModule,
        MatDialogModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
        MatSnackBarModule,
        FuseConfirmationModule,
        ItemListModule
    ],
    exports: [
        UnitEditorComponent,
        UnitPropertiesDialogComponent
    ]
})
export class UnitPropertiesDialogModule { }
