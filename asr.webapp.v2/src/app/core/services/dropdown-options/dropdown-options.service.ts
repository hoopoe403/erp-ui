import { Injectable } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';

/**
 * Interface for dropdown option configuration
 */
export interface DropdownOptionConfig {
    value: any;
    translationKey: string; // Translation key path (e.g., 'financial.debit')
}

/**
 * Interface for dropdown option with translated label
 */
export interface DropdownOption {
    value: any;
    label: string;
}

/**
 * Dropdown Options Service
 * 
 * This service provides translated dropdown options that automatically
 * update when the language changes. It supports multiple dropdown types
 * and can be easily extended for new dropdowns.
 */
@Injectable({
    providedIn: 'root'
})
export class DropdownOptionsService {
    
    /**
     * Configuration for different dropdown types
     * Add new dropdown configurations here
     */
    private dropdownConfigs: { [key: string]: DropdownOptionConfig[] } = {
        // Account Nature dropdown options
        'accountNature': [
            { value: 1, translationKey: 'financial.debit' },
            { value: 2, translationKey: 'financial.credit' },
            { value: 3, translationKey: 'financial.both' }
        ]
        // Add more dropdown configurations here as needed
        // Example:
        // 'status': [
        //     { value: 1, translationKey: 'common.active' },
        //     { value: 0, translationKey: 'common.inactive' }
        // ]
    };

    /**
     * Cache for translated options to avoid repeated translations
     */
    private optionsCache: { [key: string]: BehaviorSubject<DropdownOption[]> } = {};

    /**
     * Constructor
     */
    constructor(
        private _translocoService: TranslocoService
    ) {
        // Initialize cache for all dropdown types
        Object.keys(this.dropdownConfigs).forEach(key => {
            this.optionsCache[key] = new BehaviorSubject<DropdownOption[]>([]);
        });

        // Subscribe to language changes and update all dropdowns
        this._translocoService.langChanges$.pipe(
            distinctUntilChanged()
        ).subscribe(() => {
            this.updateAllDropdowns();
        });

        // Initial load
        this.updateAllDropdowns();
    }

    /**
     * Get dropdown options for a specific dropdown type
     * Returns an Observable that emits translated options and updates on language change
     * 
     * @param dropdownType - The type of dropdown (e.g., 'accountNature')
     * @returns Observable of dropdown options with translated labels
     */
    getDropdownOptions(dropdownType: string): Observable<DropdownOption[]> {
        if (!this.dropdownConfigs[dropdownType]) {
            console.warn(`Dropdown type '${dropdownType}' not found. Available types:`, Object.keys(this.dropdownConfigs));
            return new BehaviorSubject<DropdownOption[]>([]).asObservable();
        }

        if (!this.optionsCache[dropdownType]) {
            this.optionsCache[dropdownType] = new BehaviorSubject<DropdownOption[]>([]);
        }

        return this.optionsCache[dropdownType].asObservable();
    }

    /**
     * Get dropdown options synchronously (current language only)
     * Use this when you need immediate values without Observable
     * 
     * @param dropdownType - The type of dropdown
     * @returns Array of dropdown options with translated labels
     */
    getDropdownOptionsSync(dropdownType: string): DropdownOption[] {
        if (!this.dropdownConfigs[dropdownType]) {
            console.warn(`Dropdown type '${dropdownType}' not found.`);
            return [];
        }

        const config = this.dropdownConfigs[dropdownType];
        return config.map(option => ({
            value: option.value,
            label: this._translocoService.translate(option.translationKey)
        }));
    }

    /**
     * Update all dropdown options when language changes
     */
    private updateAllDropdowns(): void {
        Object.keys(this.dropdownConfigs).forEach(dropdownType => {
            this.updateDropdown(dropdownType);
        });
    }

    /**
     * Update a specific dropdown's options
     * 
     * @param dropdownType - The type of dropdown to update
     */
    private updateDropdown(dropdownType: string): void {
        const config = this.dropdownConfigs[dropdownType];
        
        // Create observables for each translation
        const translationObservables = config.map(option =>
            this._translocoService.selectTranslate(option.translationKey).pipe(
                map(translation => ({
                    value: option.value,
                    label: translation || option.translationKey // Fallback to key if translation missing
                }))
            )
        );

        // Combine all translations and emit when all are ready
        combineLatest(translationObservables).subscribe(options => {
            if (this.optionsCache[dropdownType]) {
                this.optionsCache[dropdownType].next(options);
            }
        });
    }

    /**
     * Register a new dropdown type dynamically
     * Useful for dropdowns that are configured at runtime
     * 
     * @param dropdownType - Unique identifier for the dropdown type
     * @param config - Array of option configurations
     */
    registerDropdownType(dropdownType: string, config: DropdownOptionConfig[]): void {
        this.dropdownConfigs[dropdownType] = config;
        this.optionsCache[dropdownType] = new BehaviorSubject<DropdownOption[]>([]);
        this.updateDropdown(dropdownType);
    }

    /**
     * Get the current active language
     * 
     * @returns Current language code (e.g., 'en', 'tr')
     */
    getCurrentLanguage(): string {
        return this._translocoService.getActiveLang();
    }
}
