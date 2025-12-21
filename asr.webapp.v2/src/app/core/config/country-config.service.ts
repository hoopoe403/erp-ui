import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { 
    CountryConfig, 
    CountryConfigFile, 
    CountryOption,
    BankAccountValidationConfig 
} from './country-config.types';

const STORAGE_KEY = 'app_country_code';
const CONFIG_PATH = 'assets/config/country-config.json';

@Injectable({
    providedIn: 'root'
})
export class CountryConfigService {
    // Store all country configs
    private _configFile: CountryConfigFile | null = null;
    
    // Current selected country config
    private _currentCountry$ = new BehaviorSubject<CountryConfig | null>(null);
    
    // Loading state
    private _isLoaded = false;

    constructor(private _httpClient: HttpClient) {}

    /**
     * Load configuration from JSON file
     * Call this during app initialization
     */
    loadConfig(): Observable<CountryConfigFile> {
        if (this._isLoaded && this._configFile) {
            return of(this._configFile);
        }

        return this._httpClient.get<CountryConfigFile>(CONFIG_PATH).pipe(
            tap(config => {
                this._configFile = config;
                this._isLoaded = true;
                
                // Load saved country or use default
                const savedCountryCode = this.getSavedCountryCode();
                const countryCode = savedCountryCode || config.defaultCountry;
                this.setCountry(countryCode);
            }),
            catchError(error => {
                console.error('Error loading country config:', error);
                throw error;
            })
        );
    }

    /**
     * Get current country config as Observable
     */
    get currentCountry$(): Observable<CountryConfig | null> {
        return this._currentCountry$.asObservable();
    }

    /**
     * Get current country config (sync)
     */
    get currentCountry(): CountryConfig | null {
        return this._currentCountry$.value;
    }

    /**
     * Get current country code
     */
    get currentCountryCode(): string {
        return this._currentCountry$.value?.code || 'TR';
    }

    /**
     * Set current country by code
     */
    setCountry(countryCode: string): void {
        if (!this._configFile) {
            console.error('Config not loaded. Call loadConfig() first.');
            return;
        }

        const countryConfig = this._configFile.countries[countryCode];
        if (countryConfig) {
            this._currentCountry$.next(countryConfig);
            this.saveCountryCode(countryCode);
        } else {
            console.error(`Country config not found for: ${countryCode}`);
        }
    }

    /**
     * Get list of available countries
     */
    getAvailableCountries(): CountryOption[] {
        if (!this._configFile) {
            return [];
        }

        return Object.values(this._configFile.countries).map(country => ({
            code: country.code,
            name: country.name
        }));
    }

    /**
     * Get config for a specific country
     */
    getCountryConfig(countryCode: string): CountryConfig | null {
        if (!this._configFile) {
            return null;
        }
        return this._configFile.countries[countryCode] || null;
    }

    /**
     * Get bank account validation config for current country
     */
    get bankAccountValidation(): BankAccountValidationConfig | null {
        return this._currentCountry$.value?.validation?.bankAccount || null;
    }

    /**
     * Get bank account validation config as Observable
     */
    get bankAccountValidation$(): Observable<BankAccountValidationConfig | null> {
        return this._currentCountry$.pipe(
            map(country => country?.validation?.bankAccount || null)
        );
    }

    /**
     * Save country code to localStorage
     */
    private saveCountryCode(countryCode: string): void {
        try {
            localStorage.setItem(STORAGE_KEY, countryCode);
        } catch (e) {
            console.warn('Could not save country to localStorage:', e);
        }
    }

    /**
     * Get saved country code from localStorage
     */
    private getSavedCountryCode(): string | null {
        try {
            return localStorage.getItem(STORAGE_KEY);
        } catch (e) {
            return null;
        }
    }

    /**
     * Clear saved country (reset to default)
     */
    resetToDefault(): void {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {
            // Ignore
        }
        
        if (this._configFile) {
            this.setCountry(this._configFile.defaultCountry);
        }
    }
}
