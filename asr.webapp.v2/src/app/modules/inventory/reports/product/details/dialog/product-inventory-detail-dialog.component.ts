import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ProductInventoryDetailDialogConfig } from '../product-inventory-detail-dialog.types';
import { CustomerOrder } from 'app/modules/sales/order/order.types';
import { ProductInventoryService } from '../../product-inventory.service';
import { Customer } from 'app/modules/configuration/customer/customer/customer.types';
import { Transfer } from 'app/modules/inventory/transfer/transfer.types';
import { DepotRequest } from 'app/modules/production/depot/request/DepotRequest.types';

@Component({
    selector: 'product-iventory-detail-dialog',
    templateUrl: './product-inventory-detail-dialog.component.html',
    encapsulation: ViewEncapsulation.None
})
export class ProductInventoryDetailDialogComponent implements OnInit {
    /**
     * Constructor
     */
    requestId: number;
    requestDetailId: number;
    requestTypeId: number;
    depotInfo: DepotRequest;
    customerOrderInfo: CustomerOrder;
    customerInfo: Customer;
    transferInfo: Transfer;
    isLoading: boolean;
    constructor(private service: ProductInventoryService,
        @Inject(MAT_DIALOG_DATA) public data: ProductInventoryDetailDialogConfig,
        public matDialogRef: MatDialogRef<ProductInventoryDetailDialogComponent>
    ) {
        this.requestId = data.requestId;
        this.requestDetailId = data.requestDetailId;
        this.requestTypeId = data.requestTypeId;
        this.transferInfo = new Transfer();
        this.customerOrderInfo = new CustomerOrder;
        this.customerInfo = new Customer;
        this.depotInfo = new DepotRequest();
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
        if (this.requestTypeId == 1000521)
            this.getCustomerOrderInfo();
        if (this.requestTypeId == 1000522)
            this.getDepotInfo();
        else if (this.requestTypeId == 1000523)
            this.getTransferInfo();
    }



    private getCustomerOrderInfo() {
        this.service.getCustomerOrder(this.requestId).subscribe(res => {
            this.customerOrderInfo = res.data;
            this.getCustomerInfo(this.customerOrderInfo.customerId);

        });
    }


    private getCustomerInfo(customerId: number) {
        this.service.getCustomerInfo(customerId).subscribe(res => {
            this.customerInfo = res.data;
            this.isLoading = false;
        });;
    }

    private getTransferInfo() {
        this.service.getTransferInfo(this.requestDetailId).subscribe(res => {
            this.transferInfo = res.data;
            this.isLoading = false;
        });;
    }
    private getDepotInfo() {
        this.service.getDepotInfo(this.requestId).subscribe(res => {
            this.depotInfo = res.data;
            this.isLoading = false;
        });;
    }
    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

}
