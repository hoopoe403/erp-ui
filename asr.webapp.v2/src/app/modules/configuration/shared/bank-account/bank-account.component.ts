import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BankAccount, Currency } from './bank-account.types';
import { BankAccountService } from './bank-account.service';
import { Bank } from '../../../financial/shared/financial.types';
import { FuseAlertService } from '@fuse/components/alert';
import { OpResult } from 'app/core/type/result/result.types';

@Component({
    selector: 'app-bank-account',
    templateUrl: './bank-account.component.html',
    styleUrls: ['./bank-account.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class BankAccountComponent implements OnInit, OnDestroy {
    // Input: receive bank accounts from parent component
    @Input() bankAccounts: BankAccount[] = [];
    
    // Output: emit changes to parent component
    @Output() bankAccountsChange = new EventEmitter<BankAccount[]>();
    
    bankAccountForm: FormGroup;
    banks: Bank[] = [];
    currencies: Currency[] = [];
    isLoading: boolean = false;
    _result: OpResult = new OpResult();
    editingIndex: number | null = null; // Track which account index is being edited
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _formBuilder: FormBuilder,
        private _bankAccountService: BankAccountService,
        private _fuseAlertService: FuseAlertService,
        private _cdr: ChangeDetectorRef
    ) {
        this.createForm();
    }

    ngOnInit(): void {
        // Load dropdowns
        this.loadBanks();
        this.loadCurrencies();
        
        // Initialize bankAccounts if null
        if (!this.bankAccounts) {
            this.bankAccounts = [];
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
            bankId: [null, Validators.required],
            branchCode: ['', Validators.required],
            branchName: ['', Validators.required],
            accountNumber: ['', Validators.required],
            swiftCode: [''],
            iban: [''],
            currencyId: [null, Validators.required]
        });
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
                this._cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error loading banks:', error);
                this.isLoading = false;
                this._cdr.detectChanges();
            }
        });
    }

    /**
     * Load currencies from backend
     */
    private loadCurrencies(): void {
        this._bankAccountService.getCurrencies().pipe(
            takeUntil(this._unsubscribeAll)
        ).subscribe({
            next: (response) => {
                this.currencies = response.data || [];
                this._cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error loading currencies:', error);
                // Fallback to mock data if API fails
                this._bankAccountService.getCurrenciesMock().subscribe(res => {
                    this.currencies = res.data || [];
                    this._cdr.detectChanges();
                });
            }
        });
    }

    /**
     * Add or update bank account in local list
     */
    saveAccount(): void {
        // Validate form
        if (this.bankAccountForm.invalid) {
            this.bankAccountForm.markAllAsTouched();
            return;
        }

        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');

        const formValue = this.bankAccountForm.value;
        const currency = this.getCurrency(formValue.currencyId);
        
        // Create bank account object matching backend model
        const bankAccount: BankAccount = {
            bankId: formValue.bankId,
            bankName: this.getBankName(formValue.bankId),
            branchCode: formValue.branchCode,
            branchName: formValue.branchName,
            accountNumber: formValue.accountNumber,
            swiftCode: formValue.swiftCode || '',
            iban: formValue.iban || '',
            currencyId: formValue.currencyId,
            currencyName: currency?.currencyName || '',
            currencyAbbreviation: currency?.currencyAbbreviation || ''
            // bankAccountId is omitted for new accounts - backend will assign ID
        };

        if (this.editingIndex !== null) {
            // Update existing account in list (preserve existing ID if any)
            bankAccount.bankAccountId = this.bankAccounts[this.editingIndex].bankAccountId;
            this.bankAccounts[this.editingIndex] = bankAccount;
            this._result.message = 'Bank account updated successfully';
        } else {
            // Add new account (ID is null, backend will assign)
            this.bankAccounts.push(bankAccount);
            this._result.message = 'Bank account added successfully';
        }

        // Emit changes to parent
        this.bankAccountsChange.emit([...this.bankAccounts]);

        this.showAlert('successMessage');
        this._result.succeed = true;
        
        // Clear form and reset editing state
        this.resetForm();
        this._cdr.detectChanges();
    }

    /**
     * Edit an existing account - load data into form
     */
    editAccount(index: number): void {
        const account = this.bankAccounts[index];
        this.editingIndex = index;
        this.bankAccountForm.patchValue({
            bankId: account.bankId,
            branchCode: account.branchCode,
            branchName: account.branchName,
            accountNumber: account.accountNumber,
            swiftCode: account.swiftCode || '',
            iban: account.iban || '',
            currencyId: account.currencyId
        });
        
        // Scroll to form
        setTimeout(() => {
            const formElement = document.querySelector('.bank-account-form');
            if (formElement) {
                formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
        
        this._cdr.detectChanges();
    }

    /**
     * Delete bank account from local list
     */
    deleteAccount(index: number): void {
        if (!confirm('Are you sure you want to delete this bank account?')) {
            return;
        }

        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');

        // Remove from local list
        this.bankAccounts.splice(index, 1);
        
        // If we were editing this account, reset form
        if (this.editingIndex === index) {
            this.resetForm();
        } else if (this.editingIndex !== null && this.editingIndex > index) {
            // Adjust editing index if we deleted an item before the one being edited
            this.editingIndex--;
        }
        
        // Emit changes to parent
        this.bankAccountsChange.emit([...this.bankAccounts]);
        
        this.showAlert('successMessage');
        this._result.message = 'Bank account removed';
        this._result.succeed = true;
        this._cdr.detectChanges();
    }

    /**
     * Cancel editing - reset form
     */
    cancelEdit(): void {
        this.resetForm();
    }

    /**
     * Reset form to initial state
     * If there are existing accounts, pre-fill with first account's data (except SWIFT & IBAN)
     * to make it easier for users to add multiple accounts
     */
    private resetForm(): void {
        this.bankAccountForm.reset();
        this.editingIndex = null;
        
        // If there are existing accounts, pre-fill form with first account's data
        // (except SWIFT Code and IBAN which are unique per account)
        if (this.bankAccounts && this.bankAccounts.length > 0) {
            const firstAccount = this.bankAccounts[0];
            this.bankAccountForm.patchValue({
                bankId: firstAccount.bankId,
                branchCode: firstAccount.branchCode,
                branchName: firstAccount.branchName,
                accountNumber: '', // Clear - user needs to enter new account number
                swiftCode: '', // Don't copy - unique per account
                iban: '', // Don't copy - unique per account
                currencyId: firstAccount.currencyId
            });
        } else {
            // No existing accounts - clear everything
            this.bankAccountForm.patchValue({
                bankId: null,
                branchCode: '',
                branchName: '',
                accountNumber: '',
                swiftCode: '',
                iban: '',
                currencyId: null
            });
        }
    }

    /**
     * Get bank name by ID
     */
    getBankName(bankId: number): string {
        const bank = this.banks.find(b => b.bankId === bankId);
        return bank ? bank.bankName : '';
    }

    /**
     * Get currency by ID
     */
    getCurrency(currencyId: number): Currency | undefined {
        return this.currencies.find(c => c.currencyId === currencyId);
    }

    /**
     * Get currency name by ID
     */
    getCurrencyName(currencyId: number): string {
        const currency = this.getCurrency(currencyId);
        return currency ? `${currency.currencyName} (${currency.currencyAbbreviation})` : '';
    }

    private showAlert(name: string): void {
        this._fuseAlertService.show(name);
    }

    private dismissAlert(name: string): void {
        this._fuseAlertService.dismiss(name);
    }
}
