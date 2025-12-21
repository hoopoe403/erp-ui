import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, Renderer2, TemplateRef, ViewChild, ViewContainerRef, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TemplatePortal } from '@angular/cdk/portal';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { MatDrawerToggleResult } from '@angular/material/sidenav';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { Customer } from 'app/modules/configuration/customer/customer/customer.types';
import { CustomerListComponent } from 'app/modules/configuration/customer/customer/list/list.component';
import { CustomerService } from 'app/modules/configuration/customer/customer/customer.service';
import { FuseAlertService } from '@fuse/components/alert';
import { OpResult } from 'app/core/type/result/result.types';

@Component({
    selector: 'customer-details',
    templateUrl: './details.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerDetailsComponent implements OnInit, OnDestroy {
    @ViewChild('avatarFileInput') private _avatarFileInput: ElementRef;
    @ViewChild('tagsPanel') private _tagsPanel: TemplateRef<any>;
    @ViewChild('tagsPanelOrigin') private _tagsPanelOrigin: ElementRef;

    editMode: boolean = false;
    tagsEditMode: boolean = false;
    customer: Customer;
    customerForm: FormGroup;
    customers: Customer[];
    private _tagsPanelOverlayRef: OverlayRef;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    customerTypes: Array<{ key: number, value: string }> = [];
    organizations: Array<{ key: number, value: string }> = [];
    branches: Array<{ key: number, value: string }> = [];
    isLoading: boolean = false;
    _result: OpResult = new OpResult();
    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        private _customerListComponent: CustomerListComponent,
        private _customerService: CustomerService,
        private _formBuilder: FormBuilder,
        private _fuseAlertService: FuseAlertService
    ) {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Open the drawer
        this.getCustomerTypes();
        this.getOrganizations();
        this._customerListComponent.matDrawer.open();

        // Create the customer form
        this.customerForm = this._formBuilder.group({
            customerId: [''],
            customerName: ['', [Validators.required]],
            customerFamily: ['', [Validators.required]],
            customerCode: [''],
            budgetCredit: ['', [Validators.required]],
            phone: [''],
            companyName: ['', [Validators.required]],
            customerTypeId: ['', [Validators.required]],
            organizationId: ['', [Validators.required]],
            branchId: ['', [Validators.required]],
            address: [null],
            status: ['', [Validators.required]],
            notes: [null]
        });

        // Get the customers
        this._customerService.customers$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((customers: Customer[]) => {
                this.customers = customers;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the customer
        this._customerService.customer$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((customer: Customer) => {

                // Open the drawer in case it is closed
                this._customerListComponent.matDrawer.open();

                // Get the customer
                this.customer = customer;

                // Clear the emails and phoneNumbers form arrays
                //(this.customerForm.get('emails') as FormArray).clear();
                // (this.customerForm.get('phoneNumbers') as FormArray).clear();

                // Patch values to the form
                this.customerForm.patchValue(customer);

                // Setup the emails form array
                const emailFormGroups = [];



                // Add the email form groups to the emails form array
                emailFormGroups.forEach((emailFormGroup) => {
                    (this.customerForm.get('emails') as FormArray).push(emailFormGroup);
                });

                // Setup the phone numbers form array




                // Toggle the edit mode off
                this.toggleEditMode(false);

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the tags

    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();

        // Dispose the overlays if they are still on the DOM
        if (this._tagsPanelOverlayRef) {
            this._tagsPanelOverlayRef.dispose();
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Close the drawer
     */
    closeDrawer(): Promise<MatDrawerToggleResult> {
        return this._customerListComponent.matDrawer.close();
    }

    /**
     * Toggle edit mode
     *
     * @param editMode
     */
    toggleEditMode(editMode: boolean | null = null): void {
        if (editMode === null) {
            this.editMode = !this.editMode;
        }
        else {
            this.editMode = editMode;
        }

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Update the customer
     */
    updateCustomer(): void {
        // Get the customer object
        const customer = this.customerForm.getRawValue();

        // Go through the customer object and clear empty values
        //customer.emails = customer.emails.filter(email => email.email);

        //customer.phoneNumbers = customer.phoneNumbers.filter(phoneNumber => phoneNumber.phoneNumber);

        // Update the customer on the server
        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');
        this.isLoading = true;
        if (customer.customerId === -1) {
            this.create(customer);
        }

        else {
            this.edit(customer);
        }
    }
    private create(customer: any) {
        this._customerService.create(customer).subscribe(res => {
            this.isLoading = false;
            this._result.succeed = res.succeed;
            this._result.message = res.message;
            if (this._result.succeed) {
                this.showAlert('successMessage');
                customer.customerId = res.data;
                this._customerService.addToCustomerList(customer);
            }
            else
                this.showAlert('errorMessage');
            this._changeDetectorRef.detectChanges();
        });
    }

    private edit(customer: any) {
        this._customerService.edit(customer).subscribe(res => {
            this.isLoading = false;
            this._result.succeed = res.succeed;
            this._result.message = res.message;
            if (this._result.succeed) {
                this.showAlert('successMessage');
                const indx = this.customers.findIndex(x => x.customerId === customer.customerId);
                customer.budgetBalance = this.customers[indx].budgetBalance;
                customer.budgetTotal = customer.budgetBalance + customer.budgetCredit;
                customer.customerTypeName = this.customerTypes.filter(x => x.key === customer.customerTypeId)[0].value;
                this._customerService.editCustomerListItem(customer);
            }
            else
                this.showAlert('errorMessage');
            this._changeDetectorRef.detectChanges();
        });
    }
    private showAlert(name: string): void {
        this._fuseAlertService.show(name);
    }

    private dismissAlert(name: string): void {
        this._fuseAlertService.dismiss(name);
    }
    
    /**
     * Delete the customer
     */
    deleteCustomer(): void {
        // Open the confirmation dialog


    }

    uploadAvatar(fileList: FileList): void {
        // Return if canceled

    }

    /**
     * Remove the avatar
     */
    removeAvatar(): void {
        // Get the form control for 'avatar'

    }

    /**
     * Open tags panel
     */
    openTagsPanel(): void {
    }

    /**
     * Toggle the tags edit mode
     */
    toggleTagsEditMode(): void {
        this.tagsEditMode = !this.tagsEditMode;
    }

    /**
     * Filter tags
     *
     * @param event
     */
    filterTags(event): void {
        // Get the value

    }

    /**
     * Filter tags input key down event
     *
     * @param event
     */
    filterTagsInputKeyDown(event): void {
        // Return if the pressed key is not 'Enter'

    }

    /**
     * Create a new tag
     *
     * @param title
     */
    createTag(title: string): void {

    }

    /**
     * Update the tag title
     *
     * @param tag
     * @param event
     */
    updateTagTitle(tag: any, event): void {
        // Update the title on the tag

    }

    /**
     * Delete the tag
     *
     * @param tag
     */
    deleteTag(tag: any): void {
        // Delete the tag from the server

    }

    /**
     * Add tag to the customer
     *
     * @param tag
     */
    addTagToCustomer(tag: any): void {
        // Add the tag

    }

    /**
     * Remove tag from the customer
     *
     * @param tag
     */
    removeTagFromCustomer(tag: any): void {

    }

    /**
     * Toggle customer tag
     *
     * @param tag
     */
    toggleCustomerTag(tag: any): void {

    }

    /**
     * Should the create tag button be visible
     *
     * @param inputValue
     */
    shouldShowCreateTagButton(inputValue: string): boolean {
        return true;
    }

    /**
     * Add the email field
     */
    addEmailField(): void {
        // Create an empty email form group
        const emailFormGroup = this._formBuilder.group({
            email: [''],
            label: ['']
        });

        // Add the email form group to the emails form array
        (this.customerForm.get('emails') as FormArray).push(emailFormGroup);

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }
    changeOrganization(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        this.branches = [];
        this.getBranches(event.source.value);


    }
    private getCustomerTypes() {

        this._customerService.getDrpCustomerType().subscribe(res => {
            this.customerTypes = res.data;
        });

    }

    private getOrganizations() {
        this._customerService.getDrpOrganization().subscribe(res => {
            this.organizations = res.data;
        })
    }

    private getBranches(orgId: number) {

        this._customerService.getDrpBranch(orgId).subscribe(res => {
            this.branches = res.data;
            this.customerForm.controls['branchId'].setValue(this.customer.branchId);
        });

    }

    /**
     * Remove the email field
     *
     * @param index
     */
    removeEmailField(index: number): void {
        // Get form array for emails
        const emailsFormArray = this.customerForm.get('emails') as FormArray;

        // Remove the email field
        emailsFormArray.removeAt(index);

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Add an empty phone number field
     */
    addPhoneNumberField(): void {
        // Create an empty phone number form group
        const phoneNumberFormGroup = this._formBuilder.group({
            country: ['us'],
            phoneNumber: [''],
            label: ['']
        });

        // Add the phone number form group to the phoneNumbers form array
        (this.customerForm.get('phoneNumbers') as FormArray).push(phoneNumberFormGroup);

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Remove the phone number field
     *
     * @param index
     */
    removePhoneNumberField(index: number): void {
        // Get form array for phone numbers
        const phoneNumbersFormArray = this.customerForm.get('phoneNumbers') as FormArray;

        // Remove the phone number field
        phoneNumbersFormArray.removeAt(index);

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Get country info by iso code
     *
     * @param iso
     */


    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }

}
