import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { merge } from 'lodash-es';
import { GoodsInventoryHistoryDialogConfig } from './dialog.types';
import { GoodsInventoryHistoryDialogComponent } from './dialog.component';


@Injectable()
export class HistoryDialogService {
    private _defaultConfig: GoodsInventoryHistoryDialogConfig = {
        warehouseInventoryId: 0,
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

    open(config: GoodsInventoryHistoryDialogConfig = {}): MatDialogRef<GoodsInventoryHistoryDialogComponent> {
        // Merge the user config with the default config
        const userConfig = merge({}, this._defaultConfig, config);

        // Open the dialog
        return this._matDialog.open(GoodsInventoryHistoryDialogComponent, {
            autoFocus: false,
            disableClose: !userConfig.dismissible,
            data: userConfig
        });
    }
}
