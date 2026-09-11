import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    forwardRef,
    Input,
    OnChanges,
    Output,
    SimpleChanges,
    ViewEncapsulation
} from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
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
export class LookupSelectComponent implements ControlValueAccessor, OnChanges {
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

    @Output() optionSelected = new EventEmitter<any>();
    @Output() addRequested = new EventEmitter<string>();

    readonly ADD_NEW = '__ADD_NEW__';

    searchCtrl = new FormControl();
    filteredOptions$: Observable<any[]>;

    private _selectedOption: any = null;
    /** The id last passed to writeValue(), even when no match was found in
     *  options at the time (e.g. options is still `[]`, loading over HTTP) -
     *  lets ngOnChanges retry the match once options actually arrives. */
    private _pendingId: any = null;
    private _onChange: (value: any) => void = () => { };
    private _onTouched: () => void = () => { };
    disabled = false;

    // `options` is almost always still `[]` when this component first renders — the
    // real data (vendors, GL accounts, ...) loads over HTTP a moment later. The old
    // version built filteredOptions$ purely from searchCtrl.valueChanges, which only
    // emits once up front (via startWith('')) and then waits for the user to type —
    // so it permanently showed that first, empty snapshot until you typed something.
    // This subject gives `options` arriving/changing its own trigger to re-filter.
    private _optionsChanged = new BehaviorSubject<void>(undefined);

    constructor(private _cdr: ChangeDetectorRef) {
        this.filteredOptions$ = combineLatest([
            this.searchCtrl.valueChanges.pipe(startWith('')),
            this._optionsChanged
        ]).pipe(
            map(([value]) => this._filter(typeof value === 'string' ? value : this._display(value)))
        );
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['options']) {
            if (this._selectedOption) {
                // Re-sync display in case the just-selected option's identity changed (e.g. after a quick-add refresh)
                const match = this.options.find((o) => o[this.idKey] === this._selectedOption[this.idKey]);
                if (match) {
                    this._selectedOption = match;
                }
            } else if (this._pendingId !== null && this._pendingId !== undefined) {
                // writeValue() ran before options had loaded (e.g. options is fed by
                // an async HTTP call and the form's initial value arrived first) - no
                // match was found then, so the field was left showing blank even
                // though the control's value was already correct. Retry now that
                // options has actually arrived.
                const match = this.options.find((o) => o[this.idKey] === this._pendingId);
                if (match) {
                    this._selectedOption = match;
                    this.searchCtrl.setValue(this._display(match), { emitEvent: false });
                }
            }
            this._optionsChanged.next();
        }
    }

    // ---------------------------------------------------------------------
    // ControlValueAccessor
    // ---------------------------------------------------------------------

    writeValue(id: any): void {
        this._pendingId = id;
        if (id === null || id === undefined) {
            this._selectedOption = null;
            this.searchCtrl.setValue('', { emitEvent: false });
            return;
        }
        const match = this.options.find((o) => o[this.idKey] === id);
        this._selectedOption = match || null;
        this.searchCtrl.setValue(match ? this._display(match) : '', { emitEvent: false });
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
        this._onChange(value ? value[this.idKey] : null);
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
        this.searchCtrl.setValue('');
        this._onChange(null);
        this.optionSelected.emit(null);
    }

    /** Whether the list currently shown is capped (no search typed yet, and there
     *  are more options than the default cap) — used to show a "type to search
     *  more" hint under the truncated list. */
    get isTruncated(): boolean {
        return !this._rawSearchText() && this.options.length > this.defaultVisibleCount;
    }

    // ---------------------------------------------------------------------
    // Internal
    // ---------------------------------------------------------------------

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
            return this.options.slice(0, this.defaultVisibleCount);
        }
        return this.options.filter((option) => {
            const code = this.codeKey ? (option[this.codeKey] || '').toString().toLowerCase() : '';
            const name = (option[this.nameKey] || '').toString().toLowerCase();
            const extra = this.extraKey ? (option[this.extraKey] || '').toString().toLowerCase() : '';
            return code.includes(filterValue) || name.includes(filterValue) || extra.includes(filterValue);
        });
    }
}
