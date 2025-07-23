import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Customer } from 'app/modules/configuration/customer/customer/customer.types';

@Component({
    selector: 'details-customer',
    templateUrl: './customer.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetailsCustomerComponent implements OnInit {
    customerForm: FormGroup;
    customerInfo: Customer;
    @Input() customerData: any;
    /**
     * Constructor
     */
    constructor(
        private _formBuilder: FormBuilder,
        private cdr: ChangeDetectorRef,
    ) {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the form
        this.customerForm = this._formBuilder.group({
            name: this.customerInfo.customerName || ' ' || this.customerInfo.customerFamily,
            branch: this.customerInfo.branchName,
            company: this.customerInfo.companyName,
            address: this.customerInfo.address,
            phone: this.customerInfo.phone,
            country: ['iran'],
            discount: this.customerInfo.discountPercent,
            budgetBalance: this.formatNumber(this.customerInfo.budgetBalance.toString()),
            budgetCredit: this.formatNumber(this.customerInfo.budgetCredit.toString()),
            budgetTotal: this.formatNumber(this.customerInfo.budgetTotal.toString())
        });
        this.cdr.detectChanges();
    }

    ngOnChanges(changes: SimpleChanges) {
        if ('customerData' in changes) {
            this.customerInfo = changes.customerData.currentValue;
        }
    }
    private formatNumber(value: string): string {
        const numericValue = parseFloat(value.replace(/,/g, ''));
        return numericValue.toLocaleString('en-US');
    }
}
