import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { StatementDialogConfig } from '../dialog.types';
import { StatementService } from '../../statement.service';
import { Revenue } from 'app/modules/financial/transactions/revenue/revenue.types';
import { Expense } from 'app/modules/financial/transactions/expense/expense.types';
import { Cheque } from 'app/modules/financial/cheque/cheque.types';



@Component({
    selector: 'fuse-confirmation-dialog',
    templateUrl: './dialog.component.html',
    encapsulation: ViewEncapsulation.None
})
export class StatementDialogComponent implements OnInit {
    /**
     * constractor
     */
    requestId: number;
    requestTypeId: number;
    requestDetailId: number;
    chequeId: number;
    revenueInfo: Revenue;
    expenseInfo: Expense;
    chequeInfo: Cheque;
    isLoading: boolean;

    constructor(private service: StatementService,
        @Inject(MAT_DIALOG_DATA) public data: StatementDialogConfig,
        public matDialogRef: MatDialogRef<StatementDialogComponent>
    ) {
        this.requestId = data.requestId;
        this.requestTypeId = data.requestTypeId;
        this.requestDetailId = data.requestDetailId;
        this.chequeId = data.chequeId;
        this.revenueInfo = new Revenue;
        this.expenseInfo = new Expense;
        this.chequeInfo = new Cheque;
    }
    ngOnInit(): void {
        this.loadData();
    }

    private loadData() {
        this.isLoading = true;
        if (this.requestTypeId === 1000525)
            this.getRevenueInfo();
        else if (this.requestTypeId === 1000526)
            this.getExpenseInfo();
        else if (this.requestTypeId === 1000529)
            this.getChequeInfo();
    }

    private getRevenueInfo() {
        this.service.getRevenue(this.requestId).subscribe(res => {
            this.revenueInfo = res.data;
            this.isLoading = false;
        });
    }

    private getExpenseInfo() {
        this.service.getExpense(this.requestId).subscribe(res => {
            this.expenseInfo = res.data;
            this.isLoading = false;
        });
    }

    private getChequeInfo() {
        this.service.getChequeInfo(this.chequeId).subscribe(res => {
            this.chequeInfo = res.data;
            this.isLoading = false;
        });
    }

}


