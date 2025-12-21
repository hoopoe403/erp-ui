import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BankAccount, Currency, BANK_ACCOUNT_STATUS } from './bank-account.types';
import { BankAccountService } from './bank-account.service';
import { Bank } from '../../../financial/shared/financial.types';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CountryConfigService } from 'app/core/config/country-config.service';
import { BankAccountValidationConfig } from 'app/core/config/country-config.types';
import { DynamicValidatorFactory } from 'app/core/validators/dynamic-validator.factory';
import { ItemListConfig } from '../item-list/item-list.types';

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
    editingIndex: number | null = null;
    
    // Validation config from country settings
    validationConfig: BankAccountValidationConfig | null = null;
    
    // Item list configuration
    listConfig: ItemListConfig = {
        title: 'Bank Accounts List',
        emptyMessage: 'No bank accounts added yet. Fill the form above and click "Add Account" to add one.',
        columns: [
            { key: 'bankName', label: 'Bank' },
            { key: 'currencyAbbreviation', label: 'Currency' },
            { key: 'branchCode', label: 'Branch Code' },
            { key: 'branchName', label: 'Branch Name' },
            { key: 'accountNumber', label: 'Account Number' },
            { key: 'swiftCode', label: 'SWIFT Code', fallback: '-' },
            { key: 'iban', label: 'IBAN', fallback: '-' },
            { 
                key: 'statusId', 
                label: 'Status', 
                type: 'badge', 
                align: 'center',
                badgeConfig: { 
                    activeValue: BANK_ACCOUNT_STATUS.ACTIVE, 
                    activeLabel: 'Active', 
                    inactiveLabel: 'Inactive' 
                }
            }
        ],
        actions: [
            { icon: 'edit', tooltip: 'Edit', color: 'primary', action: 'edit' },
            { icon: 'delete', tooltip: 'Delete', color: 'warn', action: 'delete' }
        ]
    };
    
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _formBuilder: FormBuilder,
        private _bankAccountService: BankAccountService,
        private _fuseConfirmationService: FuseConfirmationService,
        private _snackBar: MatSnackBar,
        private _cdr: ChangeDetectorRef,
        private _countryConfigService: CountryConfigService
    ) {
        // Initialize form immediately in constructor to avoid undefined errors
        this.createForm();
    }

    ngOnInit(): void {
        // Initialize bankAccounts if null
        if (!this.bankAccounts) {
            this.bankAccounts = [];
        }

        // Load country config - if not loaded yet, load it first
        this._countryConfigService.loadConfig()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: () => {
                    this.loadCountryConfig();
                    this.rebuildForm();
                    this._cdr.detectChanges();
                },
                error: () => {
                    // Config failed to load, form is already created with defaults
                    this._cdr.detectChanges();
                }
            });
        
        // Load dropdowns
        this.loadBanks();
        this.loadCurrencies();

        // Subscribe to country changes to rebuild form
        this._countryConfigService.currentCountry$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((country) => {
                if (country) {
                    this.loadCountryConfig();
                    this.rebuildForm();
                }
            });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    /**
     * Load validation config from country service
     */
    private loadCountryConfig(): void {
        this.validationConfig = this._countryConfigService.bankAccountValidation;
    }

    /**
     * Create the form with dynamic validators
     */
    private createForm(): void {
        const config = this.validationConfig;
        
        this.bankAccountForm = this._formBuilder.group({
            bankId: [null, Validators.required],
            branchCode: ['', config?.branchCode 
                ? [Validators.required, DynamicValidatorFactory.createValidator(config.branchCode)]
                : Validators.required
            ],
            branchName: ['', Validators.required],
            accountNumber: ['', config?.accountNumber 
                ? [Validators.required, DynamicValidatorFactory.createValidator(config.accountNumber)]
                : Validators.required
            ],
            swiftCode: ['', config?.swiftCode 
                ? DynamicValidatorFactory.createValidator(config.swiftCode)
                : []
            ],
            iban: ['', config?.iban 
                ? DynamicValidatorFactory.createValidator(config.iban)
                : []
            ],
            currencyId: [null, Validators.required],
            isActive: [true]
        });
        
        // Mark form as pristine and untouched to prevent showing errors on empty fields
        this.bankAccountForm.markAsPristine();
        this.bankAccountForm.markAsUntouched();
    }

    /**
     * Rebuild form when country changes
     */
    private rebuildForm(): void {
        const currentValues = this.bankAccountForm?.value;
        this.createForm();
        
        // Only patch non-empty values to avoid triggering validation errors on empty fields
        if (currentValues) {
            const valuesToPatch: any = {};
            Object.keys(currentValues).forEach(key => {
                const value = currentValues[key];
                if (value !== null && value !== undefined && value !== '') {
                    valuesToPatch[key] = value;
                }
            });
            if (Object.keys(valuesToPatch).length > 0) {
                this.bankAccountForm.patchValue(valuesToPatch);
            }
        }
        
        this._cdr.detectChanges();
    }

    /**
     * Get validation config for a field
     */
    getFieldConfig(fieldName: 'accountNumber' | 'iban' | 'swiftCode' | 'branchCode') {
        return this.validationConfig?.[fieldName];
    }

    /**
     * Get error message for a field
     */
    getFieldError(fieldName: string): string {
        const control = this.bankAccountForm.get(fieldName);
        if (!control || !control.errors) {
            return '';
        }

        const config = this.getFieldConfig(fieldName as any);
        if (config) {
            return DynamicValidatorFactory.getErrorMessage(control, config);
        }

        // Fallback for fields without config
        if (control.errors['required']) {
            return 'This field is required';
        }
        
        return 'Invalid value';
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
        if (this.bankAccountForm.invalid) {
            this.bankAccountForm.markAllAsTouched();
            return;
        }

        const formValue = this.bankAccountForm.value;
        const currency = this.getCurrency(formValue.currencyId);
        
        const bankAccount: BankAccount = {
            bankId: formValue.bankId,
            bankName: this.getBankName(formValue.bankId),
            branchCode: formValue.branchCode,
            branchName: formValue.branchName,
            accountNumber: formValue.accountNumber,
            swiftCode: formValue.swiftCode?.toUpperCase() || '',
            iban: formValue.iban?.toUpperCase() || '',
            currencyId: formValue.currencyId,
            currencyName: currency?.currencyName || '',
            currencyAbbreviation: currency?.currencyAbbreviation || '',
            statusId: formValue.isActive ? BANK_ACCOUNT_STATUS.ACTIVE : BANK_ACCOUNT_STATUS.INACTIVE
        };

        let message: string;
        if (this.editingIndex !== null) {
            bankAccount.bankAccountId = this.bankAccounts[this.editingIndex].bankAccountId;
            this.bankAccounts[this.editingIndex] = bankAccount;
            message = 'Bank account updated successfully';
        } else {
            this.bankAccounts.push(bankAccount);
            message = 'Bank account added successfully';
        }

        this.bankAccountsChange.emit([...this.bankAccounts]);
        this._snackBar.open(message, null, { duration: 3000 });
        this.resetForm();
        this._cdr.detectChanges();
    }

    /**
     * Edit an existing account
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
            currencyId: account.currencyId,
            isActive: account.statusId === BANK_ACCOUNT_STATUS.ACTIVE
        });
        
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
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete Bank Account',
            message: 'Are you sure you want to delete this bank account? This action cannot be undone!',
            actions: {
                confirm: {
                    label: 'Delete'
                }
            }
        });

        confirmation.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                this.bankAccounts.splice(index, 1);
                
                if (this.editingIndex === index) {
                    this.resetForm();
                } else if (this.editingIndex !== null && this.editingIndex > index) {
                    this.editingIndex--;
                }
                
                this.bankAccountsChange.emit([...this.bankAccounts]);
                this._snackBar.open('Bank account deleted successfully', null, { duration: 3000 });
                this._cdr.detectChanges();
            }
        });
    }

    /**
     * Cancel editing
     */
    cancelEdit(): void {
        this.resetForm();
    }

    /**
     * Reset form to initial state
     */
    private resetForm(): void {
        this.bankAccountForm.reset();
        this.editingIndex = null;
        
        if (this.bankAccounts && this.bankAccounts.length > 0) {
            const firstAccount = this.bankAccounts[0];
            this.bankAccountForm.patchValue({
                bankId: firstAccount.bankId,
                branchCode: firstAccount.branchCode,
                branchName: firstAccount.branchName,
                accountNumber: firstAccount.accountNumber,
                currencyId: null,
                swiftCode: '',
                iban: '',
                isActive: true
            });
        } else {
            this.bankAccountForm.patchValue({
                bankId: null,
                branchCode: '',
                branchName: '',
                accountNumber: '',
                currencyId: null,
                swiftCode: '',
                iban: '',
                isActive: true
            });
        }
    }

    /**
     * Check if bank account is active
     */
    isAccountActive(account: BankAccount): boolean {
        return account.statusId === BANK_ACCOUNT_STATUS.ACTIVE;
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

    /**
     * Get current country name for display
     */
    get currentCountryName(): string {
        return this._countryConfigService.currentCountry?.name || 'Turkey';
    }
}
