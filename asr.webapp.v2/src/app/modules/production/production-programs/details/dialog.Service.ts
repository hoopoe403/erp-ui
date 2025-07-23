import {Injectable} from '@angular/core'
import { ProductionProgramDialogConfig } from './dialog.types'
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ProductionProgramDialogComponent } from './dialog/dialog.component';
import { merge } from 'lodash';


@Injectable()

export class DialogService {
    private _defaultConfig : ProductionProgramDialogConfig = {
        productionProgramIdList : [],
        serial : '',
        icon : {
            show : true , 
            name: 'heroicons_outline:printer',
            color: 'primary'
        },
        actions :{
            cancel: {
                show: true,
                label: 'Cancel'
            },
            printSerial: {
                show: false,
                label: '',
                color: '',
            }
        },
        dismissible :{
            show : true
        }
    };

    constructor(
        private _matDialog : MatDialog
    ){}

    open(config : ProductionProgramDialogConfig = {}) : MatDialogRef<ProductionProgramDialogComponent>{
        const userConfig = merge({} , this._defaultConfig , config);

        return this._matDialog.open(ProductionProgramDialogComponent ,{
            autoFocus : false,
            disableClose : !userConfig.dismissible,
            data : userConfig
        });
    }
}