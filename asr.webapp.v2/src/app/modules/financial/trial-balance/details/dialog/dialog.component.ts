import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TrialBalanceDetailDialogConfig } from '../dialog.types';
import { Invoice } from 'app/modules/financial/invoices/mechanized/invoice.types';
import { Expense } from 'app/modules/financial/transactions/expense/expense.types';
import { Revenue } from 'app/modules/financial/transactions/revenue/revenue.types';
import { CustomerOrder } from 'app/modules/sales/order/order.types';
import { TrialBalanceService } from '../../trial-balance.service';
import { Customer } from 'app/modules/configuration/customer/customer/customer.types';
import { Cheque } from 'app/modules/financial/cheque/cheque.types';
import { ManualInvoice } from 'app/modules/financial/invoices/manual/manual-invoice.types';

@Component({
    selector: 'fuse-confirmation-dialog',
    templateUrl: './dialog.component.html',
    encapsulation: ViewEncapsulation.None
})
export class TrialBalanceDetailDialogComponent implements OnInit {
    /**
     * Constructor
     */
    requestId: number;
    requestDetailId: number;
    requestTypeId: number;
    revenueInfo: Revenue;
    expenseInfo: Expense;
    invoiceInfo: Invoice;
    chequeInfo: Cheque;
    manualInvoiceInfo: ManualInvoice;
    customerOrderInfo: CustomerOrder;
    customerInfo: Customer
    isLoading: boolean;
    constructor(private service: TrialBalanceService,
        @Inject(MAT_DIALOG_DATA) public data: TrialBalanceDetailDialogConfig,
        public matDialogRef: MatDialogRef<TrialBalanceDetailDialogComponent>
    ) {
        this.requestId = data.requestId;
        this.requestDetailId = data.requestDetailId;
        this.requestTypeId = data.requestTypeId;
        this.revenueInfo = new Revenue;
        this.expenseInfo = new Expense;
        this.invoiceInfo = new Invoice;
        this.customerOrderInfo = new CustomerOrder;
        this.customerInfo = new Customer;
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
        if (this.requestTypeId === 1000525)
            this.getRevenueInfo();
        else if (this.requestTypeId === 1000526)
            this.getExpenseInfo();
        else if (this.requestTypeId === 1000521)
            this.getCustomerOrderInfo();
        else if (this.requestTypeId === 1000527)
            this.getInvoiceInfo();
        else if (this.requestTypeId === 1000528)
            this.getManualInvoiceInfo();
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

    private getCustomerOrderInfo() {
        this.service.getCustomerOrder(this.requestId).subscribe(res => {
            this.customerOrderInfo = res.data;
            this.getCustomerInfo(this.customerOrderInfo.customerId);

        });
    }

    private getInvoiceInfo() {
        this.service.getInvoice(this.requestId).subscribe(res => {
            this.invoiceInfo = res.data;
            this.isLoading = false;
        });
    }
    private getManualInvoiceInfo() {
        this.service.getManualInvoice(this.requestId).subscribe(res => {
            this.manualInvoiceInfo = res.data;
            var re = / /gi;
            this.manualInvoiceInfo.financialCategoryName = this.manualInvoiceInfo.financialCategoryName.replace(re, " > ");
            this.isLoading = false;
        });
    }
    private getChequeInfo() {
        this.service.getChequeInfo(this.requestDetailId).subscribe(res => {
            this.chequeInfo = res.data;
            this.isLoading = false;
        });
    }
    private getCustomerInfo(customerId: number) {
        this.service.getCustomerInfo(customerId).subscribe(res => {
            this.customerInfo = res.data;
            this.isLoading = false;
        });;
    }
    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

}
