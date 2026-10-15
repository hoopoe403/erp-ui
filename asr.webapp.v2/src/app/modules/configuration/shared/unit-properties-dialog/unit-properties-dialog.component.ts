import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UnitPropertiesDialogConfig, UnitPropertiesDialogResult, UnitRow } from './unit-properties-dialog.types';

/**
 * Dialog around {@link UnitEditorComponent}: edit the units, then Save returns them to the opener.
 */
@Component({
    selector: 'unit-properties-dialog',
    templateUrl: './unit-properties-dialog.component.html'
})
export class UnitPropertiesDialogComponent {
    units: UnitRow[];

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: UnitPropertiesDialogConfig,
        public dialogRef: MatDialogRef<UnitPropertiesDialogComponent>,
        private _snackBar: MatSnackBar
    ) {
        this.units = data.units || [];
    }

    save(): void {
        if (this.units.length === 0) {
            this._snackBar.open('Please add at least one unit', undefined, { duration: 2000 });
            return;
        }

        if (!this.units.some(u => u.isPrimary)) {
            this._snackBar.open('Please set a primary unit', undefined, { duration: 2000 });
            return;
        }

        const result: UnitPropertiesDialogResult = { saved: true, units: this.units };
        this.dialogRef.close(result);
    }

    cancel(): void {
        const result: UnitPropertiesDialogResult = { saved: false };
        this.dialogRef.close(result);
    }
}
