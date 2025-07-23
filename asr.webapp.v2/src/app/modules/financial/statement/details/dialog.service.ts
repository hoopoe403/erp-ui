import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { merge } from 'lodash-es';
import { StatementDialogConfig } from './dialog.types';
import { StatementDialogComponent } from './dialog/dialog.component';

@Injectable()
export class DialogService {
    private _defaultConfig: StatementDialogConfig = {
        requestId: 0,
        requestTypeId: 0,
        chequeId:0,
        title: 'Confirm action',
        message: 'Are you sure you want to confirm this action?',
        icon: {
            show: true,
            name: 'heroicons_outline:information-circle',
            color: 'info'
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
        dismissible:  true
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

    open(config: StatementDialogConfig = {}): MatDialogRef<StatementDialogComponent> {
        // Merge the user config with the default config
        const userConfig = merge({}, this._defaultConfig, config);

        // Open the dialog
        return this._matDialog.open(StatementDialogComponent, {
            autoFocus: false,
            disableClose: !userConfig.dismissible,
            data: userConfig
        });
    }
}
