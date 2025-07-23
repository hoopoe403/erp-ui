import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { merge } from 'lodash-es';
import { FuseDataEntryDialogComponent } from '@fuse/services/data-entry-dialog/dialog/dialog.component';
import { FuseDataEntryDialogConfig } from '@fuse/services/data-entry-dialog/data-entry-dialog.types';

@Injectable()
export class FuseDataEntryDialogService {
    private _defaultConfig: FuseDataEntryDialogConfig = {
        title: 'Confirm action',
        message: 'Are you sure you want to confirm this action?',
        formControls: [{
            formControlName: '', index: 0, label: '', placeHolder: '',
            type: '', disabled: false, value: ''
        }],
        icon: {
            show: true,
            name: 'heroicons_outline:exclamation',
            color: 'warn'
        },
        actions: {
            confirm: {
                show: true,
                label: 'Confirm',
                color: 'warn'
            },
            cancel: {
                show: true,
                label: 'Cancel'
            }
        },
        dismissible: false
    };

    /**
     * Constructor
     */
    constructor(
        private _matDialog: MatDialog
    ) {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    open(config: FuseDataEntryDialogConfig = {}): MatDialogRef<FuseDataEntryDialogComponent> {
        // Merge the user config with the default config
        const userConfig = merge({}, this._defaultConfig, config);

        // Open the dialog
        return this._matDialog.open(FuseDataEntryDialogComponent, {
            autoFocus: false,
            disableClose: !userConfig.dismissible,
            data: userConfig
        });
    }
}
