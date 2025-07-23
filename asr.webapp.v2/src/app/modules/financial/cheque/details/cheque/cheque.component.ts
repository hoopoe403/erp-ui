import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ChequeTransactionDialogConfig } from '../dialog.types';
import { ChequeService } from '../../cheque.service';
import { Cheque } from 'app/modules/financial/cheque/cheque.types';

@Component({
    selector: 'fuse-confirmation-dialog',
    templateUrl: './cheuqe.component.html',
    encapsulation: ViewEncapsulation.None
})
export class ChequeDialogComponent implements OnInit {
    /**
     * Constructor
     */
    chequeId: number;

    chequeInfo: Cheque;

    isLoading: boolean;
    constructor(private service: ChequeService,
        @Inject(MAT_DIALOG_DATA) public data: ChequeTransactionDialogConfig,
        public matDialogRef: MatDialogRef<ChequeDialogComponent>
    ) {
        this.chequeId = data.chequeId;
        this.chequeInfo = new Cheque;

    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        this.loadData();

    }

    private loadData() {
        this.isLoading = true;

        this.getChequeInfo();
    }




    private getChequeInfo() {
        this.service.getCheque(this.chequeId.toString()).subscribe(res => {
            this.chequeInfo = res.data;
            this.isLoading = false;
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

}
