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
import { MockCostCenter, MockVatGroup } from '../mock-data';

export interface AddCostCenterRequest {
    searchText: string;
    lineIndex: number;
}

export interface AddUnitRequest {
    searchText: string;
    lineIndex: number;
}

/**
 * Reusable accounting line-items table (G/L Account or Fixed Asset, Cost Center,
 * Description, VAT Posting Group / VAT Product Posting Group, Qty, Unit, Unit
 * Price, Net Amount, Gross Amount). Built for Purchase Invoice first; designed
 * to be dropped into Sales Invoice / Expense screens later — it only needs a
 * `FormArray` of row `FormGroup`s (each with the fields above) and the lookup
 * option lists.
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
    @Input() glAccountOptions: LookupOption[] = [];
    @Input() fixedAssetOptions: LookupOption[] = [];
    @Input() costCenters: MockCostCenter[] = [];
    @Input() vatPostingGroups: MockVatGroup[] = [];
    @Input() vatProductPostingGroups: MockVatGroup[] = [];
    @Input() unitOptions: LookupOption[] = [];
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
        return lineGroup.get('lineType').value === 'FA' ? this.fixedAssetOptions : this.glAccountOptions;
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
