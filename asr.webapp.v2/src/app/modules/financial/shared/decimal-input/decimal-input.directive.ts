import { Directive, ElementRef, HostListener, Renderer2, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Drop-in replacement for binding formControlName directly to a plain
 * `<input type="number">` — displays/accepts EU-style numbers (period
 * thousands separator, comma decimal separator, e.g. "52.336,89") while the
 * underlying FormControl value stays a plain JS number, and there's no native
 * spin-button since the host input is `type="text"` (see line-items-table's
 * template — `inputmode="decimal"` still gives mobile a numeric keypad).
 * <p>
 * Overrides Angular's own DefaultValueAccessor for the host input by
 * providing itself as NG_VALUE_ACCESSOR, the same mechanism
 * MatAutocompleteTrigger and LookupSelectComponent already use in this app.
 * Shows the raw, unformatted number while focused (so typing/editing isn't
 * fighting thousands-separator insertion/cursor jumps), and reformats on blur.
 */
@Directive({
    selector: 'input[appDecimalInput]',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DecimalInputDirective),
            multi: true
        }
    ]
})
export class DecimalInputDirective implements ControlValueAccessor {
    private _rawValue: number | null = null;
    private _onChange: (value: number | null) => void = () => { };
    private _onTouched: () => void = () => { };

    constructor(private _el: ElementRef<HTMLInputElement>, private _renderer: Renderer2) {
    }

    @HostListener('focus')
    onFocus(): void {
        this._setDisplay(this._rawValue === null ? '' : String(this._rawValue));
    }

    @HostListener('blur')
    onBlur(): void {
        this._onTouched();
        this._setDisplay(this._format(this._rawValue));
    }

    @HostListener('input', ['$event.target.value'])
    onInput(value: string): void {
        this._rawValue = this._parse(value);
        this._onChange(this._rawValue);
    }

    writeValue(value: number | null): void {
        this._rawValue = value === null || value === undefined || Number.isNaN(Number(value)) ? null : Number(value);
        const isFocused = this._el.nativeElement === document.activeElement;
        this._setDisplay(isFocused ? (this._rawValue === null ? '' : String(this._rawValue)) : this._format(this._rawValue));
    }

    registerOnChange(fn: (value: number | null) => void): void {
        this._onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this._onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this._renderer.setProperty(this._el.nativeElement, 'disabled', isDisabled);
    }

    private _setDisplay(text: string): void {
        this._renderer.setProperty(this._el.nativeElement, 'value', text);
    }

    private _format(value: number | null): string {
        if (value === null) {
            return '';
        }
        return value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    /** Accepts either display format back (EU "1.234,56" or a plain "1234.56"
     *  typed via a numeric keypad) - strips "." thousands separators, then
     *  treats "," as the decimal point. */
    private _parse(text: string): number | null {
        if (!text) {
            return null;
        }
        const normalized = text.replace(/\./g, '').replace(',', '.').replace(/[^0-9.\-]/g, '');
        if (!normalized) {
            return null;
        }
        const parsed = parseFloat(normalized);
        return Number.isNaN(parsed) ? null : parsed;
    }
}
