/**
 * Bank Account interface - matches backend model
 */
export interface BankAccount {
    bankAccountId?: number;
    bankId: number;
    bankName?: string;              // Optional - for display (can be looked up from dropdown)
    branchCode: string;
    branchName: string;
    accountNumber: string;
    currencyId: number;
    currencyName?: string;          // Optional - for display (can be looked up from dropdown)
    currencyAbbreviation?: string;  // Optional - for display
    swiftCode?: string;
    iban?: string;
    statusId: number;               // 1000001 = Active, 1000000 = Inactive
}

/** Status constants */
export const BANK_ACCOUNT_STATUS = {
    INACTIVE: 1000000,
    ACTIVE: 1000001
};

/**
 * Currency type interface
 */
export interface Currency {
    currencyId: number;
    currencyName: string;
    currencyAbbreviation: string;
}

/**
 * Hardcoded currencies (temporary - until backend provides endpoint)
 */
export const CURRENCIES: Currency[] = [
    { currencyId: 1, currencyName: 'Dollar', currencyAbbreviation: 'USD' },
    { currencyId: 2, currencyName: 'Euro', currencyAbbreviation: 'EUR' },
    { currencyId: 3, currencyName: 'Turkish Lira', currencyAbbreviation: 'TRY' }
];
