import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { merge } from 'lodash-es';
import { CashChequeDialogConfig } from './dialog.types';
import { CashChequeDialogComponent } from './dialog/dialog.component';
import { ChequeTransactionDialogConfig } from './dialog.types';
import { ChequeTransactionDialogComponent } from './history/dialog.component';
import { ChequeDialogComponent } from './cheque/cheque.component';

@Injectable()
export class DialogService {
    private _defaultConfig: CashChequeDialogConfig = {
        chequeId: 0,
        title: 'Confirm action',
        requestType: '',
        message: 'Are you sure you want to confirm this action?',
        icon: {
            show: true,
            name: 'heroicons_outline:information-circle',
            color: 'info'
        },
        actions: {
            cash: {
                show: true,
                label: 'Cash',
                color: 'warn'
            },
            cancel: {
                show: true,
                label: 'Cancel'
            }
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

    open(config: CashChequeDialogConfig = {}): MatDialogRef<CashChequeDialogComponent> {
        // Merge the user config with the default config
        const userConfig = merge({}, this._defaultConfig, config);

        // Open the dialog
        return this._matDialog.open(CashChequeDialogComponent, {
            autoFocus: false,
            disableClose: !userConfig.dismissible,
            data: userConfig
        });
    }
}

@Injectable()
export class HistoryDialogService {
    private _defaultConfig: ChequeTransactionDialogConfig = {
        chequeId: 0,
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

    open(config: ChequeTransactionDialogConfig = {}): MatDialogRef<ChequeTransactionDialogComponent> {
        // Merge the user config with the default config
        const userConfig = merge({}, this._defaultConfig, config);

        // Open the dialog
        return this._matDialog.open(ChequeTransactionDialogComponent, {
            autoFocus: false,
            disableClose: !userConfig.dismissible,
            data: userConfig
        });
    }
}
@Injectable()
export class ChequeInfoDialogService {
    private _defaultConfig: ChequeTransactionDialogConfig = {
        chequeId: 0,
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

    open(config: ChequeTransactionDialogConfig = {}): MatDialogRef<ChequeDialogComponent> {
        // Merge the user config with the default config
        const userConfig = merge({}, this._defaultConfig, config);

        // Open the dialog
        return this._matDialog.open(ChequeDialogComponent, {
            autoFocus: false,
            disableClose: !userConfig.dismissible,
            data: userConfig
        });
    }
}