import { ChangeDetectorRef, Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FinancialDocumentDetailDialogConfig } from '../dialog.types';
import { Invoice } from 'app/modules/financial/invoices/mechanized/invoice.types';
import { Expense } from 'app/modules/financial/transactions/expense/expense.types';
import { Revenue } from 'app/modules/financial/transactions/revenue/revenue.types';
import { CustomerOrder } from 'app/modules/sales/order/order.types';
import { DocumentService } from '../../document.service';
import { Customer } from 'app/modules/configuration/customer/customer/customer.types';
import { FinancialDocumentDetail } from '../../document.types';
import { FuseAlertService } from '@fuse/components/alert';
import { OpResult } from 'app/core/type/result/result.types';
import { ManualInvoice } from 'app/modules/financial/invoices/manual/manual-invoice.types';
import { Cheque } from 'app/modules/financial/cheque/cheque.types';

@Component({
    selector: 'fuse-confirmation-dialog',
    templateUrl: './dialog.component.html',
    encapsulation: ViewEncapsulation.None
})
export class FinancialDocumentDetailDialogComponent implements OnInit {
    /**
     * Constructor
     */
    requestId: number;
    requestTypeId: number;
    revenueInfo: Revenue;
    expenseInfo: Expense;
    invoiceInfo: Invoice;
    chequeInfo: Cheque;
    manualInvoiceInfo: ManualInvoice;
    customerOrderInfo: CustomerOrder;
    customerInfo: Customer
    financialDocumentDetailInfo: FinancialDocumentDetail;
    isDataLoading: boolean;
    isLoading: boolean;
    _result: OpResult = new OpResult();
    confirmResult: boolean = false;
    constructor(private service: DocumentService,
        private _fuseAlertService: FuseAlertService,
        private cdr: ChangeDetectorRef,
        @Inject(MAT_DIALOG_DATA) public data: FinancialDocumentDetailDialogConfig,
        public matDialogRef: MatDialogRef<FinancialDocumentDetailDialogComponent>
    ) {
        this.requestId = data.requestId;
        this.requestTypeId = data.requestTypeId;
        this.revenueInfo = new Revenue;
        this.expenseInfo = new Expense;
        this.invoiceInfo = new Invoice;
        this.customerOrderInfo = new CustomerOrder;
        this.customerInfo = new Customer;
        this.chequeInfo = new Cheque;
        this.financialDocumentDetailInfo = new FinancialDocumentDetail();
        this.financialDocumentDetailInfo.financialDocumentDetailId = data.financialDocumentDetailId;
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
        this.isDataLoading = true;
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
            this.isDataLoading = false;
        });
    }
    private getExpenseInfo() {
        this.service.getExpense(this.requestId).subscribe(res => {
            this.expenseInfo = res.data;
            this.isDataLoading = false;
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
            this.isDataLoading = false;
        });
    }
    private getManualInvoiceInfo() {
        this.service.getManualInvoice(this.requestId).subscribe(res => {
            this.manualInvoiceInfo = res.data;
            var re = / /gi;
            this.manualInvoiceInfo.financialCategoryName = this.manualInvoiceInfo.financialCategoryName.replace(re, " > ");
            this.isDataLoading = false;
        });
    }
    private getChequeInfo() {
        this.service.getChequeInfo(this.requestId).subscribe(res => {
            this.chequeInfo = res.data;
            this.isDataLoading = false;
        });
    }
    private getCustomerInfo(customerId: number) {
        this.service.getCustomerInfo(customerId).subscribe(res => {
            this.customerInfo = res.data;
            this.isDataLoading = false;
        });;
    }


    confirm() {
        this.isLoading = true;
        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');
        this.service.confirm(this.financialDocumentDetailInfo).subscribe(res => {
            this.isLoading = false;
            this._result.succeed = res.succeed;
            this._result.message = res.message;
            this.confirmResult = this._result.succeed;
            if (this._result.succeed)
                this.showAlert('successMessage');
            else
                this.showAlert('errorMessage');
            this.cdr.detectChanges();
        });
    }
    private showAlert(name: string): void {
        this._fuseAlertService.show(name);
    }

    private dismissAlert(name: string): void {
        this._fuseAlertService.dismiss(name);
    }
    closeDialog() {
        this.matDialogRef.close(this.confirmResult);
    }
    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

}
