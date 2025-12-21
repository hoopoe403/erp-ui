import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { FieldValidationConfig } from '../config/country-config.types';

/**
 * Dynamic Validator Factory
 * Creates Angular validators based on configuration from JSON
 */
export class DynamicValidatorFactory {

    /**
     * Create a validator function from field configuration
     * @param config Field validation configuration from country config
     * @returns ValidatorFn that can be used with Angular reactive forms
     */
    static createValidator(config: FieldValidationConfig): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            // Skip validation if empty and not required
            if (!control.value) {
                return null;
            }

            // Normalize value: uppercase, remove spaces
            const value = control.value.toString().toUpperCase().replace(/\s/g, '');

            // Check pattern
            if (config.pattern) {
                const regex = new RegExp(config.pattern);
                if (!regex.test(value)) {
                    return { 
                        invalidFormat: config.errorMessages?.pattern || 'Invalid format' 
                    };
                }
            }

            // Check exact length
            if (config.length !== undefined && value.length !== config.length) {
                return { 
                    invalidLength: config.errorMessages?.length || `Must be exactly ${config.length} characters` 
                };
            }

            // Check allowed lengths (e.g., SWIFT can be 8 or 11)
            if (config.lengths && config.lengths.length > 0) {
                if (!config.lengths.includes(value.length)) {
                    return { 
                        invalidLength: config.errorMessages?.length || `Must be ${config.lengths.join(' or ')} characters` 
                    };
                }
            }

            // Check min length
            if (config.minLength !== undefined && value.length < config.minLength) {
                return { 
                    minLength: config.errorMessages?.minLength || `Minimum ${config.minLength} characters required` 
                };
            }

            // Check max length
            if (config.maxLength !== undefined && value.length > config.maxLength) {
                return { 
                    maxLength: config.errorMessages?.maxLength || `Maximum ${config.maxLength} characters allowed` 
                };
            }

            // Check prefix
            if (config.prefix && !value.startsWith(config.prefix)) {
                return { 
                    invalidPrefix: `Must start with ${config.prefix}` 
                };
            }

            return null;
        };
    }

    /**
     * Create validators array including required if needed
     * @param config Field validation configuration
     * @returns Array of ValidatorFn
     */
    static createValidators(config: FieldValidationConfig): ValidatorFn[] {
        const validators: ValidatorFn[] = [];

        // Add the main dynamic validator
        validators.push(this.createValidator(config));

        return validators;
    }

    /**
     * Get error message for a control based on its errors
     * @param control Form control
     * @param config Field validation configuration
     * @returns Error message string
     */
    static getErrorMessage(control: AbstractControl, config: FieldValidationConfig): string {
        if (!control.errors) {
            return '';
        }

        // Check for required error first (from Validators.required)
        if (control.errors['required']) {
            return config.errorMessages?.required || 'This field is required';
        }

        // Check custom validation errors
        if (control.errors['invalidFormat']) {
            return control.errors['invalidFormat'];
        }

        if (control.errors['invalidLength']) {
            return control.errors['invalidLength'];
        }

        if (control.errors['minLength']) {
            return control.errors['minLength'];
        }

        if (control.errors['maxLength']) {
            return control.errors['maxLength'];
        }

        if (control.errors['invalidPrefix']) {
            return control.errors['invalidPrefix'];
        }

        // Default error message
        return 'Invalid value';
    }
}
