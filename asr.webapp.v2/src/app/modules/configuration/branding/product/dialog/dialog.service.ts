import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { merge } from 'lodash-es';
import { ProductSubsetDialogConfig } from './dialog.types';
import { ProductSubsetDialogComponent } from './dialog.component';

@Injectable()
export class DialogService {
    private _defaultConfig: ProductSubsetDialogConfig = {
        importType: '0',
        title: 'Confirm action',
        message: 'Are you sure you want to confirm this action?',
        icon: {
            show: true,
            name: 'heroicons_outline:information-circle',
            color: 'info'
        },
        dismissible: {
            show: true,
            disabled: true,
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

    open(config: ProductSubsetDialogConfig = {}): MatDialogRef<ProductSubsetDialogComponent> {
        // Merge the user config with the default config
        const userConfig = merge({}, this._defaultConfig, config);

        // Open the dialog
        return this._matDialog.open(ProductSubsetDialogComponent, {
            autoFocus: false,
            disableClose: !userConfig.dismissible,
            data: userConfig
        });
    }
}
