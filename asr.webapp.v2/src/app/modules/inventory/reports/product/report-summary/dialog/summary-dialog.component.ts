import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { InventorySummaryDialogConfig } from '../summary-dialog.types';
import { ProductInventoryService } from '../../product-inventory.service';
import { ProductInventory } from '../../product-inventory.types';

@Component({
    selector: 'inventory-summary-dialog',
    templateUrl: './summary-dialog.component.html',
    encapsulation: ViewEncapsulation.None
})
export class InventorySummaryDialogComponent implements OnInit {
    /**
     * Constructor
     */

    isLoading: boolean;
    inventoryInfo: ProductInventory;
    inventorySummary: ProductInventory;
    numberOfDistinctProducts: number;
    numberOfRecords: number;
    constructor(private service: ProductInventoryService,
        @Inject(MAT_DIALOG_DATA) public data: InventorySummaryDialogConfig,
        public matDialogRef: MatDialogRef<InventorySummaryDialogComponent>
    ) {
        this.inventoryInfo = data.inventoryInfo;
        this.numberOfDistinctProducts = 0;
        this.numberOfRecords = data.numberOfRecords;
        this.inventorySummary = new ProductInventory();
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
        this.getNumberOfDistinctProducts();
        this.getAccumulativeSummary();
    }
    private getNumberOfDistinctProducts() {
        this.service.getNumberOfDistinctProducts(this.inventoryInfo).subscribe(res => {
            this.numberOfDistinctProducts = res;
            //this.isLoading = false;
        });;
    }
    private getAccumulativeSummary() {
        this.service.getAccumulativeSummary(this.inventoryInfo).subscribe(res => {
            this.inventorySummary = res.data[0];
            // this.isLoading = false;
        });
    }
    getSummmaryTextColor(type: string): string {
        let classValue: string;
        let targetValue: number;
        switch (type) {
            case 'a':
                targetValue = this.inventorySummary.stock -
                    this.inventorySummary.initialStock;
                /*  */
                break;
            case 'b':
                targetValue = this.inventorySummary.stock -
                    this.inventorySummary.preReserve - this.inventorySummary.reserve -
                    this.inventorySummary.initialStock;
                break;
            case 'c':
                targetValue = this.inventorySummary.totalPrice -
                    this.inventorySummary.totalInitialPrice;
                break;
            case 'd':
                targetValue = this.inventorySummary.totalRemainedPrice -
                    this.inventorySummary.totalInitialPrice;
                break;
        }
        if (targetValue < 0)
            classValue = 'text-red-500';
        else if (targetValue > 0)
            classValue = 'text-green-500';
        else
            classValue = 'text-blue-500';

        return classValue;

    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

}
