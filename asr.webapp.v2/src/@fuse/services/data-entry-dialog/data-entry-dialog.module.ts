import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { FuseDataEntryDialogService } from '@fuse/services/data-entry-dialog/data-entry-dialog.service';
import { FuseDataEntryDialogComponent } from '@fuse/services/data-entry-dialog/dialog/dialog.component';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
@NgModule({
    declarations: [
        FuseDataEntryDialogComponent
    ],
    imports: [
        MatButtonModule,
        MatDialogModule,
        MatIconModule,
        CommonModule,
        MatFormFieldModule,
        MatCheckboxModule,
        MatInputModule,
        MatSelectModule,
        FormsModule,
        ReactiveFormsModule,

    ],
    providers: [
        FuseDataEntryDialogService
    ]
})
export class FuseDataEntryDialogModule {
    /**
     * Constructor
     */
    constructor(private _fuseDataEntryDialogService: FuseDataEntryDialogService) {
    }
}
