import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { merge } from 'lodash-es';
import { ProductInventoryDetailDialogConfig } from './product-inventory-detail-dialog.types';
import { ProductInventoryDetailDialogComponent } from './dialog/product-inventory-detail-dialog.component';

@Injectable()
export class ProductInventoryDetailDialogService {
    private _defaultConfig: ProductInventoryDetailDialogConfig = {
        requestId: 0,
        requestTypeId: 0,
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

    open(config: ProductInventoryDetailDialogConfig = {}): MatDialogRef<ProductInventoryDetailDialogComponent> {
        // Merge the user config with the default config
        const userConfig = merge({}, this._defaultConfig, config);

        // Open the dialog
        return this._matDialog.open(ProductInventoryDetailDialogComponent, {
            autoFocus: false,
            disableClose: !userConfig.dismissible,
            data: userConfig
        });
    }
}
