/**
 * Bank Account interface
 */
export interface BankAccount {
    bankAccountId?: number;
    bankId: number;
    bankName?: string; // For display purposes
    branchCode: string;
    branchName: string;
    accountNumber: string;
    swiftCode?: string;
    iban?: string;
    accountTypeId: number;
    accountTypeName?: string; // For display purposes
}

/**
 * Account Type interface (Currency type: Dollar, Euro, Turkish Lira)
 */
export interface AccountType {
    accountTypeId: number;
    accountTypeName: string;
    accountTypeCode: string;
}

/**
 * Hardcoded account types (currencies)
 */
export const ACCOUNT_TYPES: AccountType[] = [
    { accountTypeId: 1, accountTypeName: 'Dollar', accountTypeCode: 'USD' },
    { accountTypeId: 2, accountTypeName: 'Euro', accountTypeCode: 'EUR' },
    { accountTypeId: 3, accountTypeName: 'Turkish Lira', accountTypeCode: 'TRY' }
];
