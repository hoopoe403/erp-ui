import { ChangeDetectorRef, Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PaymentDialogConfig} from '../dialog.types';
import { CustomerOrder } from 'app/modules/sales/order/order.types';
import { DocumentService } from '../../document.service';
import { Customer } from 'app/modules/configuration/customer/customer/customer.types';
import { FuseAlertService } from '@fuse/components/alert';
import { OpResult } from 'app/core/type/result/result.types';

@Component({
    selector: 'fuse-confirmation-dialog',
    templateUrl: './dialog.component.html',
    encapsulation: ViewEncapsulation.None
})
export class PaymentDialogComponent implements OnInit {
    /**
     * Constructor
     */
    requestId: number;
    customerOrderInfo: CustomerOrder;
    customerInfo: Customer;
    isDataLoading: boolean;
    isLoading: boolean;
    _result: OpResult = new OpResult();
    confirmResult: boolean = false;
    constructor(private service: DocumentService,
        private cdr: ChangeDetectorRef,
        @Inject(MAT_DIALOG_DATA) public data: PaymentDialogConfig,
        public matDialogRef: MatDialogRef<PaymentDialogComponent>
    ) {
        this.requestId = data.requestId;
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
        this.isDataLoading = true;
        this.getCustomerOrderInfo();

    }

    private getCustomerOrderInfo() {
        this.service.getOrder(this.requestId).subscribe(res => {
            this.customerOrderInfo = res.data;
            this.getCustomerInfo(this.customerOrderInfo.customerId);

        });
    }


    private getCustomerInfo(customerId: number) {
        this.service.getCustomerInfo(customerId).subscribe(res => {
            this.customerInfo = res.data;
            this.isDataLoading = false;
        });;
    }


    closeDialog() {
        this.matDialogRef.close(this.confirmResult);
    }
    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

}
