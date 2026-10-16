import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    DoCheck,
    EventEmitter,
    forwardRef,
    Injector,
    Input,
    OnChanges,
    OnInit,
    Output,
    SimpleChanges,
    ViewEncapsulation
} from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, NgControl } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldAppearance } from '@angular/material/form-field';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

/**
 * Generic "MS365-style" lookup field: a searchable dropdown that renders its
 * options as a code/name table, with an optional pinned "+ Add new" row at
 * the bottom. Drops into `formControlName` like any other field.
 *
 * The component never opens a dialog itself — it only emits `addRequested`
 * so each consumer decides what "add new X" actually means (a full form,
 * a two-field quick-add, etc).
 */
@Component({
    selector: 'app-lookup-select',
    templateUrl: './lookup-select.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => LookupSelectComponent),
            multi: true
        }
    ]
})
export class LookupSelectComponent implements ControlValueAccessor, OnChanges, OnInit, DoCheck {
    @Input() options: any[] = [];
    @Input() idKey = 'id';
    @Input() codeKey: string | null = 'code';
    @Input() nameKey = 'name';
    @Input() extraKey: string | null = null;
    @Input() label = '';
    @Input() placeholder = 'Search...';
    @Input() showAddOption = false;
    @Input() addOptionLabel = '+ Add new';
    /** Divider line between the option list and the "+ Add new" row. Only ever
     *  rendered when showAddOption is also true; automatically hidden when the
     *  filtered list is empty (nothing to separate the add-row from). */
    @Input() showDivider = true;
    @Input() required = false;
    @Input() isLoading = false;
    /** How many options to show before the user types anything — keeps a long
     *  list (e.g. every vendor) from opening as one huge dropdown. Typing
     *  searches the full list regardless of this cap. */
    @Input() defaultVisibleCount = 5;
    /** The field's look. The default ('legacy', underline only) is what the invoice line tables use; forms
     *  whose other fields are outlined pass 'outline' to match them. */
    @Input() appearance: MatFormFieldAppearance = 'legacy';
    /** When given, the field turns red and shows this text once its form control is invalid and touched -
     *  like the other fields of a form. Left empty, the field never shows an error state (the invoice
     *  line tables mark their invalid cells themselves). */
    @Input() errorMessage: string | null = null;

    @Output() optionSelected = new EventEmitter<any>();
    @Output() addRequested = new EventEmitter<string>();

    readonly ADD_NEW = '__ADD_NEW__';

    searchCtrl = new FormControl();
    filteredOptions$: Observable<any[]>;

    private _selectedOption: any = null;
    /** The control's current id - from writeValue() or the user's pick - even when
     *  options has no match for it yet (e.g. options is still `[]`, loading over
     *  HTTP). Every time options changes, the selection is resolved from it again. */
    private _value: any = null;
    private _onChange: (value: any) => void = () => { };
    private _onTouched: () => void = () => { };
    disabled = false;

    /** The outer form control (formControlName) - read for the error state only. */
    private _ngControl: NgControl | null = null;
    private _lastErrorState = false;
    readonly errorStateMatcher: ErrorStateMatcher = {
        isErrorState: () => this._isErrorState()
    };

    // `options` is almost always still `[]` when this component first renders — the
    // real data (vendors, GL accounts, ...) loads over HTTP a moment later. The old
    // version built filteredOptions$ purely from searchCtrl.valueChanges, which only
    // emits once up front (via startWith('')) and then waits for the user to type —
    // so it permanently showed that first, empty snapshot until you typed something.
    // This subject gives `options` arriving/changing its own trigger to re-filter.
    private _optionsChanged = new BehaviorSubject<void>(undefined);

    constructor(private _cdr: ChangeDetectorRef, private _injector: Injector) {
        this.filteredOptions$ = combineLatest([
            this.searchCtrl.valueChanges.pipe(startWith('')),
            this._optionsChanged
        ]).pipe(
            map(([value]) => this._filter(typeof value === 'string' ? value : this._display(value)))
        );
    }

    ngOnInit(): void {
        // Read lazily: this component is the control's value accessor, so the
        // NgControl can't be a constructor dependency (it would be circular).
        this._ngControl = this._injector.get(NgControl, null);
    }

    ngDoCheck(): void {
        // markAllAsTouched() on the parent form emits no event, and this component
        // is OnPush - re-render whenever the outer control's error state flips.
        const errorState = this._isErrorState();
        if (errorState !== this._lastErrorState) {
            this._lastErrorState = errorState;
            this._cdr.markForCheck();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['options']) {
            // The control's value may have arrived before options did (options is
            // usually fed by an HTTP call), or options may have been refreshed
            // (e.g. after a quick-add) - resolve the selection from the value again.
            // With no value, a search the user is typing is left alone.
            if (this._hasValue()) {
                this._resolveSelection();
            }
            this._optionsChanged.next();
        }
    }

    // ---------------------------------------------------------------------
    // ControlValueAccessor
    // ---------------------------------------------------------------------

    writeValue(id: any): void {
        this._value = id;
        this._resolveSelection();
    }

    registerOnChange(fn: (value: any) => void): void {
        this._onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this._onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
        if (isDisabled) {
            this.searchCtrl.disable({ emitEvent: false });
        } else {
            this.searchCtrl.enable({ emitEvent: false });
        }
        this._cdr.markForCheck();
    }

    // ---------------------------------------------------------------------
    // Template handlers
    // ---------------------------------------------------------------------

    displayFn = (value: any): string => {
        if (typeof value === 'string') {
            return value;
        }
        return value ? this._display(value) : '';
    };

    onOptionSelected(value: any): void {
        if (value === this.ADD_NEW) {
            // Revert the visible text, don't propagate as a real selection
            this.searchCtrl.setValue(this._selectedOption ? this._display(this._selectedOption) : '', { emitEvent: false });
            this.addRequested.emit(this._rawSearchText());
            return;
        }
        this._selectedOption = value;
        this._value = value ? value[this.idKey] : null;
        this._onChange(this._value);
        this.optionSelected.emit(value);
    }

    onBlur(): void {
        this._onTouched();
        // Deferred so a pending option click (which fires blur first, since
        // mat-option is focusable) still lands before this reverts the typed
        // search text - see (mousedown)="$event.preventDefault()" on the
        // options above, which is the primary fix; this defers as a backstop
        // for genuine outside-blur cases.
        setTimeout(() => {
            if (!this._selectedOption || this._display(this._selectedOption) !== this.searchCtrl.value) {
                if (!this._selectedOption) {
                    this.searchCtrl.setValue('');
                } else {
                    this.searchCtrl.setValue(this._display(this._selectedOption));
                }
            }
        });
    }

    clear(event?: Event): void {
        event?.stopPropagation();
        this._selectedOption = null;
        this._value = null;
        this.searchCtrl.setValue('');
        this._onChange(null);
        this.optionSelected.emit(null);
    }

    /** Whether the list currently shown is capped (no search typed yet, and there
     *  are more options than the default cap) — used to show a "type to search
     *  more" hint under the truncated list. */
    get isTruncated(): boolean {
        return !this._rawSearchText() && this._options().length > this.defaultVisibleCount;
    }

    // ---------------------------------------------------------------------
    // Internal
    // ---------------------------------------------------------------------

    private _options(): any[] {
        return this.options || [];
    }

    private _hasValue(): boolean {
        return this._value !== null && this._value !== undefined && this._value !== '';
    }

    /** Ids are compared as text: the same id can arrive as 5 from one endpoint and "5" from another. */
    private _sameId(a: any, b: any): boolean {
        return a !== null && a !== undefined && b !== null && b !== undefined && String(a) === String(b);
    }

    /** Shows the option matching the current value, or nothing when there is no match (yet). */
    private _resolveSelection(): void {
        const match = this._hasValue()
            ? this._options().find((o) => this._sameId(o[this.idKey], this._value)) || null
            : null;
        this._selectedOption = match;
        this.searchCtrl.setValue(match ? this._display(match) : '', { emitEvent: false });
        this._cdr.markForCheck();
    }

    private _isErrorState(): boolean {
        const control = this._ngControl;
        return !!this.errorMessage && !!control && !!control.invalid && !!control.touched;
    }

    private _rawSearchText(): string {
        const value = this.searchCtrl.value;
        return typeof value === 'string' ? value : '';
    }

    private _display(option: any): string {
        if (!option) {
            return '';
        }
        const code = this.codeKey ? option[this.codeKey] : null;
        const name = option[this.nameKey];
        const extra = this.extraKey ? option[this.extraKey] : null;
        let text = code ? `${code} - ${name}` : name;
        if (extra) {
            text += ` (${extra})`;
        }
        return text;
    }

    private _filter(search: string): any[] {
        const filterValue = (search || '').toLowerCase().trim();
        if (!filterValue) {
            return this._options().slice(0, this.defaultVisibleCount);
        }
        return this._options().filter((option) => {
            const code = this.codeKey ? (option[this.codeKey] || '').toString().toLowerCase() : '';
            const name = (option[this.nameKey] || '').toString().toLowerCase();
            const extra = this.extraKey ? (option[this.extraKey] || '').toString().toLowerCase() : '';
            return code.includes(filterValue) || name.includes(filterValue) || extra.includes(filterValue);
        });
    }
}
