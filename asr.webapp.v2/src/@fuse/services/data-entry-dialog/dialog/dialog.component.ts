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
        // Sort form controls by index to ensure correct order
        const sortedControls = [...this.data.formControls].sort((a, b) => a.index - b.index);
        
        sortedControls.forEach(contorl => {
            // For select fields, value might be a number, so ensure it's properly set
            const initialValue = contorl.value !== null && contorl.value !== undefined ? contorl.value : '';
            const formControl = new FormControl(initialValue, Validators.required);
            this.formControls.push(formControl);
            if (contorl.disabled) {
                formControl.disable();
            }
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
    getPlaceHolder(index: number): string {
        const indx = this.data.formControls.findIndex(x => x.index === index);
        return this.data.formControls[indx].placeHolder;
    }
    getOptions(index: number): Array<{ value: any, label: string }> {
        const indx = this.data.formControls.findIndex(x => x.index === index);
        return this.data.formControls[indx].options || [];
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
