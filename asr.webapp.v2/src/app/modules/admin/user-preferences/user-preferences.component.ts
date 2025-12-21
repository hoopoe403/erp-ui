import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CountryConfigService } from 'app/core/config/country-config.service';
import { CountryOption } from 'app/core/config/country-config.types';

@Component({
    selector: 'user-preferences',
    templateUrl: './user-preferences.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserPreferencesComponent implements OnInit, OnDestroy {
    preferencesForm: FormGroup;
    countries: CountryOption[] = [];
    currentCountryCode: string = 'TR';
    isLoading: boolean = false;
    
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _formBuilder: FormBuilder,
        private _countryConfigService: CountryConfigService,
        private _snackBar: MatSnackBar,
        private _cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.createForm();
        this.loadConfig();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    /**
     * Create the preferences form
     */
    private createForm(): void {
        this.preferencesForm = this._formBuilder.group({
            countryCode: ['TR']
        });
    }

    /**
     * Load country config
     */
    private loadConfig(): void {
        this.isLoading = true;
        
        this._countryConfigService.loadConfig()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: () => {
                    this.countries = this._countryConfigService.getAvailableCountries();
                    this.currentCountryCode = this._countryConfigService.currentCountryCode;
                    
                    this.preferencesForm.patchValue({
                        countryCode: this.currentCountryCode
                    });
                    
                    this.isLoading = false;
                    this._cdr.detectChanges();
                },
                error: (error) => {
                    console.error('Error loading config:', error);
                    this.isLoading = false;
                    this._cdr.detectChanges();
                }
            });
    }

    /**
     * Save preferences
     */
    savePreferences(): void {
        const formValue = this.preferencesForm.value;
        
        // Set the country
        this._countryConfigService.setCountry(formValue.countryCode);
        this.currentCountryCode = formValue.countryCode;
        
        // Show success message
        const countryName = this.countries.find(c => c.code === formValue.countryCode)?.name || formValue.countryCode;
        this._snackBar.open(`Preferences saved. Country set to ${countryName}`, null, { duration: 3000 });
        
        this._cdr.detectChanges();
    }

    /**
     * Reset to default
     */
    resetToDefault(): void {
        this._countryConfigService.resetToDefault();
        this.currentCountryCode = this._countryConfigService.currentCountryCode;
        
        this.preferencesForm.patchValue({
            countryCode: this.currentCountryCode
        });
        
        this._snackBar.open('Preferences reset to default (Turkey)', null, { duration: 3000 });
        this._cdr.detectChanges();
    }

    /**
     * Get current country name
     */
    get currentCountryName(): string {
        return this._countryConfigService.currentCountry?.name || 'Turkey';
    }

    /**
     * Get current currency info
     */
    get currentCurrency(): string {
        const currency = this._countryConfigService.currentCountry?.currency;
        return currency ? `${currency.name} (${currency.symbol})` : '';
    }
}

