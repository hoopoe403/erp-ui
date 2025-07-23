import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, NgZone, SimpleChanges, ViewEncapsulation, Output, EventEmitter } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidatorFn } from '@angular/forms';
import { Customer, CustomerDrp } from 'app/modules/configuration/customer/customer/customer.types';
import {  Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { OrderService } from '../../order.service';

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
    @Input() pageType: string;
    @Output() dataChanged = new EventEmitter<Customer>();
    customerControl: FormControl = new FormControl({ value: '', disabled: this.service.getIsActionDisabled() });
    filteredCustomers: Array<CustomerDrp> = new Array<CustomerDrp>();
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    /**
     * Constructor
     */
    constructor(
        private zone: NgZone,
        private _formBuilder: FormBuilder,
        private cdr: ChangeDetectorRef,
        private service: OrderService
    ) {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        this.customerControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(150),
                distinctUntilChanged()
            )
            .subscribe(() => {
                let customer: Customer = new Customer();
                customer.customerName = this.customerControl.value.toUpperCase();
                if (customer.customerName.length >= 3 && customer.customerName != this.service.getCustomerControlValue()) {
                    this.service.setCustomerControlValue(customer.customerName);
                    this.service.isLoading = true;
                    this.cdr.markForCheck();
                    this.cdr.detectChanges();
                    this.service.getCustomersWithFilter(customer).subscribe(res => {
                        this.filteredCustomers = res.data;
                        this.customerControl.setValidators(forbiddenNamesValidator(res.data));
                        this.service.isLoading = false;
                        this.cdr.markForCheck();
                        this.cdr.detectChanges();
                    });
                }
                else {
                    this.filteredCustomers = [];
                    this.cdr.markForCheck();
                    this.cdr.detectChanges();
                }


            });


        // Create the form
        this.customerForm = this._formBuilder.group({
            organization: [{ value: 1000010, disabled: true }],
            branch: this.pageType == 'new' ? '' : this.customerInfo.branchName,
            company: this.pageType == 'new' ? '' : this.customerInfo.companyName,
            address: this.pageType == 'new' ? '' : this.customerInfo.address,
            phone: this.pageType == 'new' ? '' : this.customerInfo.phone,
            country: ['iran'],
            type: this.pageType == 'new' ? '' : this.customerInfo.customerTypeName,
            discount: this.pageType == 'new' ? '' : this.customerInfo.discountPercent,
            budgetBalance: this.pageType == 'new' ? 0 : this.formatNumber(this.customerInfo.budgetBalance.toString()),
            budgetCredit: this.pageType == 'new' ? 0 : this.formatNumber(this.customerInfo.budgetCredit.toString()),
            budgetTotal: this.pageType == 'new' ? 0 : this.formatNumber(this.customerInfo.budgetTotal.toString())
        });
        if (this.customerInfo.customerId) {
            this.setCustomerInfoValues(this.customerInfo);
            let customerControlValue = (this.customerInfo.customerName + ' ' + this.customerInfo.customerFamily +
                (this.customerInfo.companyName == '' ? '' : '(' + this.customerInfo.companyName + ')') + '-' + this.customerInfo.customerCode);
            this.customerControl.setValue(customerControlValue);
        }
        this.cdr.detectChanges();
    }


    ngOnChanges(changes: SimpleChanges) {
        if ('customerData' in changes)
            this.customerInfo = changes.customerData.currentValue;

        else if ('pageType' in changes)
            this.pageType = changes.pageType.currentValue;
        // if (this.customerInfo.customerId)
        //   this.customerControl.setValue(this.customerInfo.customerName || ' ' || this.customerInfo.customerFamily || '-' || this.customerInfo.customerCode);

    }
    private formatNumber(value: string): string {
        const numericValue = parseFloat(value.replace(/,/g, ''));
        return numericValue.toLocaleString('en-US');
    }
    private setCustomerInfoValues(customerInfo: Customer) {
        this.customerForm.controls['branch'].setValue(customerInfo.branchName);
        this.customerForm.controls['company'].setValue(customerInfo.companyName);
        this.customerForm.controls['address'].setValue(customerInfo.address);
        this.customerForm.controls['phone'].setValue(customerInfo.phone);
        this.customerForm.controls['type'].setValue(customerInfo.customerTypeName);
        this.customerForm.controls['discount'].setValue(customerInfo.discountPercent);
        this.customerForm.controls['budgetBalance'].setValue(this.formatNumber(customerInfo.budgetBalance.toString()));
        this.customerForm.controls['budgetCredit'].setValue(this.formatNumber(customerInfo.budgetCredit.toString()));
        this.customerForm.controls['budgetTotal'].setValue(this.formatNumber(customerInfo.budgetTotal.toString()));
    }
    changeCustomer(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            this.customerInfo.customerId = this.getCustomerId(event.source.value);
            if (this.service.getSelectedCustomerId() != this.customerInfo.customerId) {
                this.getCustomerInfo(this.customerInfo.customerId);
                this.service.setSelectedCustomerId(this.customerInfo.customerId);
            }
        }


    }
    private getCustomerId(value: string): number {
        let indx: number;
        if (value === null)
            indx = -1;
        else
            indx = this.filteredCustomers.findIndex(x => x.customerNameFamily == value);
        return this.filteredCustomers[indx].customerId;
    }
    private getCustomerInfo(customerId: number): void {
        this.service.isLoading = true;
        this.service.getCustomerInfo(customerId).subscribe(res => {
            this.setCustomerInfoValues(res.data);
            this.service.isLoading = false;
            this.customerInfo = res.data;
            this.dataChanged.emit(this.customerInfo);
            this.cdr.detectChanges();
        });
    }
}
export function forbiddenNamesValidator(customers: CustomerDrp[]): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
        // below findIndex will check if control.value is equal to one of our options or not
        const index = customers.findIndex(customer => {
            return customer.customerNameFamily.toLowerCase().replace(/\s/g, "")
                == control.value.toLowerCase().replace(/\s/g, "");
        });
        return index < 0 ? { 'forbiddenNames': { value: control.value } } : null;
    };
}