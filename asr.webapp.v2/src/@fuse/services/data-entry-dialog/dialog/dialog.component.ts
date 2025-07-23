import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FuseDataEntryDialogConfig, FuseDataEntryDialogFormControls } from '@fuse/services/data-entry-dialog/data-entry-dialog.types';

@Component({
    selector: 'fuse-data-entry-dialog',
    templateUrl: './dialog.component.html',
    encapsulation: ViewEncapsulation.None
})
export class FuseDataEntryDialogComponent implements OnInit {
    //frmDataEntry: FormGroup;
    frmDataEntry = new FormGroup({
        formControls: new FormArray([
        ]),
    });
    get formControls(): FormArray {
        return this.frmDataEntry.get('formControls') as FormArray;
    }

    /**
     * Constructor
     */
    constructor(
        @Inject(MAT_DIALOG_DATA) public data: FuseDataEntryDialogConfig,
        public matDialogRef: MatDialogRef<FuseDataEntryDialogComponent>
    ) {
        // this.frmDataEntry = new FormGroup({});
        this.data.formControls.forEach(contorl => {
            this.formControls.push(new FormControl(contorl.value, Validators.required));
            if (contorl.disabled)
                this.formControls.controls[contorl.index].disable();
        });

    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {

    }
    getType(index: number): string {
        const indx = this.data.formControls.findIndex(x => x.index === index);
        return this.data.formControls[indx].type;
    }
    getLabel(index: number): string {
        const indx = this.data.formControls.findIndex(x => x.index === index);
        return this.data.formControls[indx].label;
    }
    registerDialog() {
        this.data.formControls.forEach(element => {
            element.value = this.formControls.controls[element.index].value;
        });

    }
    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

}
