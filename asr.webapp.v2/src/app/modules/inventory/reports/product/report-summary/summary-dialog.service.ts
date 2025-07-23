import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { merge } from 'lodash-es';
import { InventorySummaryDialogConfig } from './summary-dialog.types';
import { InventorySummaryDialogComponent } from './dialog/summary-dialog.component';

@Injectable()
export class SummaryDialogService {
    private _defaultConfig: InventorySummaryDialogConfig = {
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
        dismissible: {
            show: true,
            disabled: false,
        }
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

    open(config: InventorySummaryDialogConfig = {}): MatDialogRef<InventorySummaryDialogComponent> {
        // Merge the user config with the default config
        const userConfig = merge({}, this._defaultConfig, config);

        // Open the dialog
        return this._matDialog.open(InventorySummaryDialogComponent, {
            autoFocus: false,
            disableClose: !userConfig.dismissible,
            data: userConfig
        });
    }
}
