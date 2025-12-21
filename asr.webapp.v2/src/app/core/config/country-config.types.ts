/**
 * Country Configuration Types
 * These types define the structure of country-specific configurations
 * including validation rules, formats, and currency settings.
 * 
 * Note: Country config is SEPARATE from language. 
 * A user can be in Turkey (country config) but use English (language).
 */

// Field validation configuration
export interface FieldValidationConfig {
    pattern?: string;           // Regex pattern for validation
    minLength?: number;         // Minimum length
    maxLength?: number;         // Maximum length
    length?: number;            // Exact length (e.g., IBAN)
    lengths?: number[];         // Allowed lengths (e.g., SWIFT can be 8 or 11)
    prefix?: string;            // Required prefix (e.g., "TR" for Turkish IBAN)
    required?: boolean;         // Is field required
    errorMessages: {
        required?: string;
        pattern?: string;
        length?: string;
        minLength?: string;
        maxLength?: string;
    };
    hint?: string;              // UI hint text
    placeholder?: string;       // Input placeholder
}

// Bank account validation config
export interface BankAccountValidationConfig {
    accountNumber: FieldValidationConfig;
    iban: FieldValidationConfig;
    swiftCode: FieldValidationConfig;
    branchCode: FieldValidationConfig;
}

// Phone validation config
export interface PhoneValidationConfig {
    pattern: string;
    errorMessages: {
        pattern: string;
    };
    hint: string;
    placeholder: string;
}

// Tax number validation config
export interface TaxValidationConfig {
    pattern: string;
    errorMessages: {
        pattern: string;
    };
    hint: string;
}

// All validation configs for a country
export interface CountryValidationConfig {
    bankAccount: BankAccountValidationConfig;
    phone?: PhoneValidationConfig;
    taxNumber?: TaxValidationConfig;
}

// Currency configuration
export interface CurrencyConfig {
    code: string;       // ISO code: USD, EUR, TRY, etc.
    symbol: string;     // Symbol: $, €, ₺, etc.
    name: string;       // Full name
}

// Number format configuration
export interface NumberFormatConfig {
    decimalSeparator: string;   // "," or "."
    thousandSeparator: string;  // ".", ",", " "
}

// Date/Number format configuration
export interface FormatsConfig {
    date: string;           // e.g., "DD.MM.YYYY"
    dateTime: string;       // e.g., "DD.MM.YYYY HH:mm"
    number: NumberFormatConfig;
}

// Complete country configuration
export interface CountryConfig {
    code: string;                       // ISO 2-letter code: TR, DE, PL
    name: string;                       // Display name
    currency: CurrencyConfig;           // Default currency
    validation: CountryValidationConfig;
    formats: FormatsConfig;
}

// Root configuration file structure
export interface CountryConfigFile {
    countries: {
        [countryCode: string]: CountryConfig;
    };
    defaultCountry: string;
}

// List of available countries (for dropdowns)
export interface CountryOption {
    code: string;
    name: string;
}

