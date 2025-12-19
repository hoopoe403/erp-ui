/**
 * Bank Account interface - matches backend model
 */
export interface BankAccount {
    bankAccountId?: number;
    bankId: number;
    bankName?: string;
    bankLogoUrl?: string;
    ownerId?: number;
    ownerName?: string;
    ownerTypeId?: number;
    ownerTypeName?: string;
    branchCode: string;
    branchName: string;
    accountNumber: string;
    currencyId: number;
    currencyName?: string;
    currencyAbbreviation?: string;
    swiftCode?: string;
    iban?: string;
    status?: number;
    statusDescription?: string;
    statusColor?: string;
    statusIdList?: number[];
}

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
