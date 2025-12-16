import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BankAccount, BankAccountType } from './bank-account.types';
import { BankAccountService } from './bank-account.service';
import { Bank, BankAccountType as FinancialBankAccountType } from '../../../financial/shared/financial.types';
import { FuseAlertService } from '@fuse/components/alert';
import { OpResult } from 'app/core/type/result/result.types';

@Component({
    selector: 'app-bank-account',
    templateUrl: './bank-account.component.html',
    styleUrls: ['./bank-account.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class BankAccountComponent implements OnInit, OnDestroy, OnChanges {
    @Input() ownerId: number; // Customer ID or Contractor ID
    @Input() ownerTypeId: number; // 1: Customer, 2: Contractor (or your type IDs)
    
    bankAccountForm: FormGroup;
    bankAccounts: BankAccount[] = [];
    banks: Bank[] = [];
    bankAccountTypes: FinancialBankAccountType[] = [];
    isLoading: boolean = false;
    _result: OpResult = new OpResult();
    editingAccountId: number | null = null; // Track which account is being edited
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    // Mock account types (temporary until backend is ready)
    private mockAccountTypes: FinancialBankAccountType[] = [
        { 
            bankAccountTypeId: 1, 
            bankAccountTypeCode: 'CHECKING', 
            bankAccountTypeName: 'Checking Account', 
            status: 1,
            statusDescription: 'Active',
            statusColor: 'green'
        },
        { 
            bankAccountTypeId: 2, 
            bankAccountTypeCode: 'SAVINGS', 
            bankAccountTypeName: 'Savings Account', 
            status: 1,
            statusDescription: 'Active',
            statusColor: 'green'
        },
        { 
            bankAccountTypeId: 3, 
            bankAccountTypeCode: 'CURRENT', 
            bankAccountTypeName: 'Current Account', 
            status: 1,
            statusDescription: 'Active',
            statusColor: 'green'
        },
        { 
            bankAccountTypeId: 4, 
            bankAccountTypeCode: 'DEPOSIT', 
            bankAccountTypeName: 'Deposit Account', 
            status: 1,
            statusDescription: 'Active',
            statusColor: 'green'
        }
    ];

    constructor(
        private _formBuilder: FormBuilder,
        private _bankAccountService: BankAccountService,
        private _fuseAlertService: FuseAlertService,
        private _cdr: ChangeDetectorRef
    ) {
        this.createForm();
    }

    ngOnInit(): void {
        // Always load banks and account types (they don't depend on ownerId)
        this.loadBanks();
        this.loadBankAccountTypes();
        
        // Initialize based on ownerId
        this.initializeData();
    }

    ngOnChanges(changes: SimpleChanges): void {
        // If ownerId changes from null/undefined to a value, load existing accounts
        if (changes['ownerId'] && !changes['ownerId'].firstChange) {
            const previousOwnerId = changes['ownerId'].previousValue;
            const currentOwnerId = changes['ownerId'].currentValue;
            
            // If ownerId was null/undefined and now has a value, load accounts
            if (!previousOwnerId && currentOwnerId && this.ownerTypeId) {
                this.loadBankAccounts();
            }
        }
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    /**
     * Create the form
     */
    private createForm(): void {
        this.bankAccountForm = this._formBuilder.group({
            bankAccountId: [null],
            bankId: [null, Validators.required],
            branchCode: ['', Validators.required],
            branchName: ['', Validators.required],
            accountNumber: ['', Validators.required],
            swiftCode: [''],
            iban: [''],
            accountTypeId: [null, Validators.required]
        });
    }

    /**
     * Initialize data based on ownerId
     */
    private initializeData(): void {
        // Only load existing accounts if ownerId exists
        if (this.ownerId && this.ownerTypeId) {
            this.loadBankAccounts();
        }
    }

    /**
     * Load banks from backend
     */
    private loadBanks(): void {
        this.isLoading = true;
        this._bankAccountService.getBanks().pipe(
            takeUntil(this._unsubscribeAll)
        ).subscribe({
            next: (response) => {
                this.banks = response.data || [];
                this.isLoading = false;
                this._cdr.markForCheck();
            },
            error: (error) => {
                console.error('Error loading banks:', error);
                this.isLoading = false;
                this._cdr.markForCheck();
            }
        });
    }

    /**
     * Load bank account types from backend
     */
    private loadBankAccountTypes(): void {
        this._bankAccountService.getBankAccountTypes().pipe(
            takeUntil(this._unsubscribeAll)
        ).subscribe({
            next: (response) => {
                this.bankAccountTypes = response.data || this.mockAccountTypes; // Use mock if backend fails
                this._cdr.markForCheck();
            },
            error: (error) => {
                console.error('Error loading bank account types, using mock data:', error);
                // Use mock data if backend fails
                this.bankAccountTypes = this.mockAccountTypes;
                this._cdr.markForCheck();
            }
        });
    }

    /**
     * Load existing bank accounts
     */
    private loadBankAccounts(): void {
        if (!this.ownerId || !this.ownerTypeId) {
            return;
        }

        this.isLoading = true;
        this._bankAccountService.getBankAccounts(this.ownerId, this.ownerTypeId).pipe(
            takeUntil(this._unsubscribeAll)
        ).subscribe({
            next: (response) => {
                this.bankAccounts = response.data || [];
                this.isLoading = false;
                this._cdr.markForCheck();
            },
            error: (error) => {
                console.error('Error loading bank accounts:', error);
                this.isLoading = false;
                this._cdr.markForCheck();
            }
        });
    }

    /**
     * Save or update bank account
     */
    saveAccount(): void {
        // Validate form
        if (this.bankAccountForm.invalid) {
            this.bankAccountForm.markAllAsTouched();
            return;
        }

        this.isLoading = true;
        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');

        const formValue = this.bankAccountForm.value;
        
        // TEMPORARY: For testing, use mock ownerId if not provided
        const testOwnerId = this.ownerId || 999; // Mock ID for testing
        const testOwnerTypeId = this.ownerTypeId || 1; // Default to Customer type

        // For now, just add to local list without backend call (for testing)
        // TODO: Uncomment backend call when ready
        /*
        const bankAccount = new BankAccount();
        bankAccount.bankAccountId = formValue.bankAccountId;
        bankAccount.ownerId = testOwnerId;
        bankAccount.ownerTypeId = testOwnerTypeId;
        bankAccount.bankId = formValue.bankId;
        bankAccount.branchCode = formValue.branchCode;
        bankAccount.branchName = formValue.branchName;
        bankAccount.accountNumber = formValue.accountNumber;
        bankAccount.swiftCode = formValue.swiftCode || '';
        bankAccount.iban = formValue.iban || '';
        bankAccount.accountTypeId = formValue.accountTypeId;

        const saveObservable = bankAccount.bankAccountId
            ? this._bankAccountService.update(bankAccount)
            : this._bankAccountService.create(bankAccount);

        saveObservable.pipe(takeUntil(this._unsubscribeAll)).subscribe({
            next: (response) => {
                if (response.succeed) {
                    this.showAlert('successMessage');
                    this._result.message = response.message;
                    this._result.succeed = true;
                    
                    // Clear form and reset editing state
                    this.resetForm();
                    
                    // Reload accounts to get updated list
                    this.loadBankAccounts();
                } else {
                    this.showAlert('errorMessage');
                    this._result.message = response.message;
                    this._result.succeed = false;
                }
                this.isLoading = false;
                this._cdr.markForCheck();
            },
            error: (error) => {
                console.error('Error saving bank account:', error);
                this.showAlert('errorMessage');
                this._result.message = 'Error saving bank account';
                this._result.succeed = false;
                this.isLoading = false;
                this._cdr.markForCheck();
            }
        });
        */

        // TEMPORARY: Add to local list for testing (without backend)
        const newAccount = new BankAccount();
        newAccount.bankAccountId = formValue.bankAccountId || Date.now(); // Use timestamp as temporary ID
        newAccount.ownerId = testOwnerId;
        newAccount.ownerTypeId = testOwnerTypeId;
        newAccount.bankId = formValue.bankId;
        newAccount.bankCode = '';
        newAccount.bankName = this.getBankName(formValue.bankId);
        newAccount.branchCode = formValue.branchCode;
        newAccount.branchName = formValue.branchName;
        newAccount.accountNumber = formValue.accountNumber;
        newAccount.swiftCode = formValue.swiftCode || '';
        newAccount.iban = formValue.iban || '';
        newAccount.accountTypeId = formValue.accountTypeId;
        newAccount.accountTypeCode = '';
        newAccount.accountTypeName = this.getAccountTypeName(formValue.accountTypeId);
        newAccount.status = 1;
        newAccount.statusDescription = 'Active';
        newAccount.statusColor = 'green';
        // BaseModel properties (required)
        newAccount.clientIP = '';
        newAccount.registerUserID = 0;
        newAccount.registerUserName = '';
        newAccount.localChangeDate = '';
        newAccount.localChangeTime = '';
        newAccount.chaneDate = '';
        newAccount.page = null;

        if (formValue.bankAccountId) {
            // Update existing account in list
            const index = this.bankAccounts.findIndex(a => a.bankAccountId === formValue.bankAccountId);
            if (index !== -1) {
                this.bankAccounts[index] = newAccount;
                this._result.message = 'Bank account updated successfully';
            }
        } else {
            // Add new account to list
            this.bankAccounts.push(newAccount);
            this._result.message = 'Bank account added successfully';
        }

        this.showAlert('successMessage');
        this._result.succeed = true;
        
        // Clear form and reset editing state
        this.resetForm();
        
        this.isLoading = false;
        this._cdr.markForCheck();
    }

    /**
     * Edit an existing account - load data into form
     */
    editAccount(account: BankAccount): void {
        this.editingAccountId = account.bankAccountId;
        this.bankAccountForm.patchValue({
            bankAccountId: account.bankAccountId,
            bankId: account.bankId,
            branchCode: account.branchCode,
            branchName: account.branchName,
            accountNumber: account.accountNumber,
            swiftCode: account.swiftCode || '',
            iban: account.iban || '',
            accountTypeId: account.accountTypeId
        });
        
        // Scroll to form
        setTimeout(() => {
            const formElement = document.querySelector('.bank-account-form');
            if (formElement) {
                formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
        
        this._cdr.markForCheck();
    }

    /**
     * Delete bank account
     */
    deleteAccount(bankAccountId: number): void {
        if (!confirm('Are you sure you want to delete this bank account?')) {
            return;
        }

        // TEMPORARY: For testing, just remove from local list
        // TODO: Uncomment backend call when ready
        /*
        this.isLoading = true;
        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');

        this._bankAccountService.delete(bankAccountId).pipe(
            takeUntil(this._unsubscribeAll)
        ).subscribe({
            next: (response) => {
                if (response.succeed) {
                    // Remove from list
                    const index = this.bankAccounts.findIndex(a => a.bankAccountId === bankAccountId);
                    if (index !== -1) {
                        this.bankAccounts.splice(index, 1);
                    }
                    
                    // If we were editing this account, reset form
                    if (this.editingAccountId === bankAccountId) {
                        this.resetForm();
                    }
                    
                    this.showAlert('successMessage');
                    this._result.message = response.message;
                    this._result.succeed = true;
                } else {
                    this.showAlert('errorMessage');
                    this._result.message = response.message;
                    this._result.succeed = false;
                }
                this.isLoading = false;
                this._cdr.markForCheck();
            },
            error: (error) => {
                console.error('Error deleting bank account:', error);
                this.showAlert('errorMessage');
                this._result.message = 'Error deleting bank account';
                this._result.succeed = false;
                this.isLoading = false;
                this._cdr.markForCheck();
            }
        });
        */

        // TEMPORARY: Remove from local list for testing
        const index = this.bankAccounts.findIndex(a => a.bankAccountId === bankAccountId);
        if (index !== -1) {
            this.bankAccounts.splice(index, 1);
        }
        
        // If we were editing this account, reset form
        if (this.editingAccountId === bankAccountId) {
            this.resetForm();
        }
        
        this.showAlert('successMessage');
        this._result.message = 'Bank account deleted successfully';
        this._result.succeed = true;
        this._cdr.markForCheck();
    }

    /**
     * Cancel editing - reset form
     */
    cancelEdit(): void {
        this.resetForm();
    }

    /**
     * Reset form to initial state
     */
    private resetForm(): void {
        this.bankAccountForm.reset();
        this.editingAccountId = null;
        this.bankAccountForm.patchValue({
            bankAccountId: null,
            bankId: null,
            branchCode: '',
            branchName: '',
            accountNumber: '',
            swiftCode: '',
            iban: '',
            accountTypeId: null
        });
    }

    /**
     * Get bank name by ID
     */
    getBankName(bankId: number): string {
        const bank = this.banks.find(b => b.bankId === bankId);
        return bank ? bank.bankName : '';
    }

    /**
     * Get account type name by ID
     */
    getAccountTypeName(accountTypeId: number): string {
        const type = this.bankAccountTypes.find(t => t.bankAccountTypeId === accountTypeId);
        return type ? type.bankAccountTypeName : '';
    }

    private showAlert(name: string): void {
        this._fuseAlertService.show(name);
    }

    private dismissAlert(name: string): void {
        this._fuseAlertService.dismiss(name);
    }
}

