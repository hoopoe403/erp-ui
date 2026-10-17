import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LookupOption } from '../lookup-option.type';
import { CostCenterOption, VatGroupOption } from '../master-data.types';

export interface AddCostCenterRequest {
    searchText: string;
    lineIndex: number;
}

export interface AddUnitRequest {
    searchText: string;
    lineIndex: number;
}

export interface LineTypeOption {
    value: string;
    label: string;
}

/** Purchase Invoice's line types (the default, unless a caller overrides
 *  `lineTypes`) - a purchase invoice line posts to a G/L account, capitalizes
 *  a Fixed Asset, or buys a Raw Material (an 'IT' item line, picked from
 *  `itemOptions`). */
const DEFAULT_LINE_TYPES: LineTypeOption[] = [
    { value: 'GL', label: 'G/L Account' },
    { value: 'FA', label: 'Fixed Asset' },
    { value: 'IT', label: 'Raw Material' },
];

/**
 * Reusable accounting line-items table (an "Account/Item" column whose picker
 * swaps by line type, Cost Center, Description, VAT Posting Group / VAT
 * Product Posting Group, Qty, Unit, Unit Price, Net Amount, Gross Amount).
 * Built for Purchase Invoice first (G/L Account, Fixed Asset or Raw Material), now also used
 * by Sales Invoice (G/L Account or Item - see `lineTypes`/`itemOptions`
 * below) - it only needs a `FormArray` of row `FormGroup`s (each with the
 * fields above) and the lookup option lists.
 *
 * Owns one piece of UX on its own: it always keeps a trailing blank row ready —
 * as soon as the last row gets any data, it asks the parent (via
 * `addRowRequested`) for a fresh blank one, Excel/Business-Central style, so
 * callers don't need an explicit "add row" button.
 */
@Component({
    selector: 'app-line-items-table',
    templateUrl: './line-items-table.component.html',
    styleUrls: ['./line-items-table.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LineItemsTableComponent implements OnInit, OnDestroy {
    @Input() linesFormArray: FormArray;
    /** The "Type" column's options, and which options list (see
     *  getAccountOptions()) each value's "Account/Item" picker uses. Defaults
     *  to Purchase Invoice's G/L Account / Fixed Asset / Raw Material; Sales Invoice
     *  passes G/L Account / Item instead - see sales details.component.html. */
    @Input() lineTypes: LineTypeOption[] = DEFAULT_LINE_TYPES;
    @Input() glAccountOptions: LookupOption[] = [];
    @Input() fixedAssetOptions: LookupOption[] = [];
    /** 'IT' lines' picker options (inventory Goods) - Sales Invoice's Item,
     *  Purchase Invoice's Raw Material. See getAccountOptions(). */
    @Input() itemOptions: LookupOption[] = [];
    @Input() costCenters: CostCenterOption[] = [];
    @Input() vatPostingGroups: VatGroupOption[] = [];
    @Input() vatProductPostingGroups: VatGroupOption[] = [];
    @Input() unitOptions: LookupOption[] = [];
    /** When set, an 'IT' line's Unit dropdown only offers its goods' own units, keyed by goods id
     *  (the line's accountId) - Purchase Invoice's Raw Material. Left null, item lines use
     *  `unitOptions` like any other line. Replaced, never mutated, so OnPush sees new entries. */
    @Input() goodsUnitOptions: { [goodsId: number]: LookupOption[] } | null = null;
    @Input() currencyAbbreviation = '';
    /** Set once the parent's Send for Review validation has been attempted -
     *  turns on red highlighting for any required field left empty on a
     *  non-blank row. See isFieldMissing(). */
    @Input() showRequiredHighlight = false;

    @Output() addRowRequested = new EventEmitter<void>();
    @Output() removeRowRequested = new EventEmitter<number>();
    @Output() addCostCenterRequested = new EventEmitter<AddCostCenterRequest>();
    @Output() addUnitRequested = new EventEmitter<AddUnitRequest>();

    @ViewChild('tableWrapper') private _tableWrapper: ElementRef<HTMLElement>;

    private _unsubscribeAll = new Subject<void>();
    private _lastAutoAddLength = -1;

    ngOnInit(): void {
        this.linesFormArray.valueChanges
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(() => this._checkAutoAddRow());
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    getAccountOptions(lineGroup: FormGroup): LookupOption[] {
        const type = lineGroup.get('lineType').value;
        if (type === 'FA') {
            return this.fixedAssetOptions;
        }
        if (type === 'IT') {
            return this.itemOptions;
        }
        return this.glAccountOptions;
    }

    getAccountPlaceholder(lineGroup: FormGroup): string {
        const type = this.lineTypes.find((lt) => lt.value === lineGroup.get('lineType').value);
        return type ? 'Select ' + type.label.toLowerCase() + '...' : 'Select account...';
    }

    /** Whether the line's units come from its goods (see goodsUnitOptions) rather than `unitOptions`. */
    hasGoodsUnits(lineGroup: FormGroup): boolean {
        return !!this.goodsUnitOptions && lineGroup.get('lineType').value === 'IT';
    }

    /** Such a line can only be counted in its goods' units (none until a goods is picked). */
    getUnitOptions(lineGroup: FormGroup): LookupOption[] {
        if (!this.hasGoodsUnits(lineGroup)) {
            return this.unitOptions;
        }
        const goodsId = lineGroup.get('accountId').value;
        return (goodsId && this.goodsUnitOptions[goodsId]) || [];
    }

    onRemove(index: number): void {
        // The invoice always needs at least one line to submit — keep the last
        // remaining row in place rather than letting the table go empty.
        if (this.linesFormArray.controls.length <= 1) {
            return;
        }
        this.removeRowRequested.emit(index);
    }

    onAddCostCenter(searchText: string, lineIndex: number): void {
        this.addCostCenterRequested.emit({ searchText, lineIndex });
    }

    onAddUnit(searchText: string, lineIndex: number): void {
        this.addUnitRequested.emit({ searchText, lineIndex });
    }

    private _checkAutoAddRow(): void {
        const controls = this.linesFormArray.controls;
        if (controls.length === 0 || this._lastAutoAddLength === controls.length) {
            return;
        }
        const lastGroup = controls[controls.length - 1] as FormGroup;
        if (this._rowHasData(lastGroup)) {
            this._lastAutoAddLength = controls.length;
            this.addRowRequested.emit();
            this._scrollToBottom();
        }
    }

    private _rowHasData(group: FormGroup): boolean {
        const value = group.value;
        return !!value.accountId || !!value.costCenterId || !!(value.itemDesc && value.itemDesc.trim())
            || (parseFloat(value.unitPrice) || 0) > 0;
    }

    /** A still-blank trailing placeholder row never gets highlighted, even
     *  once showRequiredHighlight is on - matches
     *  PurchaseInvoiceDetailsComponent._isLineBlank()'s definition. */
    isRowBlank(group: FormGroup): boolean {
        const value = group.value;
        return !value.accountId && !value.costCenterId && !(value.itemDesc && value.itemDesc.trim())
            && !((parseFloat(value.netAmount) || 0) > 0);
    }

    /**
     * Whether a required field (every column except Cost Center) is empty on
     * a non-blank row, for Send for Review's row-level validation - see
     * PurchaseInvoiceDetailsComponent._hasValidLinesForReview(), which this
     * mirrors. Only ever true once the parent has actually attempted that
     * validation (showRequiredHighlight) and re-evaluates live as the user
     * fills fields in, since it's a template-bound method, not a stored flag.
     */
    isFieldMissing(group: FormGroup, controlName: string): boolean {
        if (!this.showRequiredHighlight || this.isRowBlank(group)) {
            return false;
        }
        const value = group.get(controlName).value;
        if (controlName === 'quantity') {
            return value === null || value === undefined || value === '' || Number.isNaN(parseFloat(value)) || parseFloat(value) <= 0;
        }
        if (controlName === 'unitPrice') {
            return value === null || value === undefined || value === '' || Number.isNaN(parseFloat(value)) || parseFloat(value) < 0;
        }
        return value === null || value === undefined || value === '';
    }

    private _scrollToBottom(): void {
        setTimeout(() => {
            const el = this._tableWrapper?.nativeElement;
            if (el) {
                el.scrollTop = el.scrollHeight;
            }
        });
    }
}
