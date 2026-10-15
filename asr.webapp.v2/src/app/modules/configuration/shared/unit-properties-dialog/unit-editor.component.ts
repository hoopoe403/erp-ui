import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { Units } from 'app/modules/configuration/measurement/unit/unit.types';
import { ItemListConfig } from 'app/modules/configuration/shared/item-list/item-list.types';
import { UnitRow } from './unit-properties-dialog.types';

/**
 * Add / edit / remove the units of a product or goods and pick the primary one. It works on its own copy of
 * {@link units} and emits the whole new list through {@link unitsChange} after every change, so it can sit
 * in a tab or inside a dialog.
 */
@Component({
    selector: 'app-unit-editor',
    templateUrl: './unit-editor.component.html'
})
export class UnitEditorComponent implements OnInit, OnChanges, OnDestroy {
    @Input() units: UnitRow[] = [];
    @Input() loadUnits: () => Observable<any>;   // Returns the available units as { data: Units[] }
    @Output() unitsChange = new EventEmitter<UnitRow[]>();

    rows: UnitRow[] = [];
    availableUnits: Units[] = [];
    unitForm: FormGroup;
    editingIndex: number | null = null;

    listConfig: ItemListConfig = {
        title: 'Units',
        emptyMessage: 'No units added yet. Add a primary unit first, then add secondary units with conversion rates.',
        columns: [
            { key: 'unitName', label: 'Unit' },
            { key: 'unitCode', label: 'Code' },
            { key: 'isPrimary', label: 'Type', type: 'primary-badge', align: 'center' },
            { key: 'conversionRate', label: 'Conversion Rate' }
        ],
        actions: [
            {
                icon: 'star_outline',
                tooltip: 'Set as Primary',
                color: 'accent',
                action: 'primary',
                showCondition: (item: UnitRow) => !item.isPrimary
            },
            { icon: 'edit', tooltip: 'Edit', color: 'primary', action: 'edit' },
            { icon: 'delete', tooltip: 'Delete', color: 'warn', action: 'delete' }
        ]
    };

    // The list this component last emitted - an input equal to it is our own echo and is not copied again
    private _lastEmitted: UnitRow[] | null = null;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _formBuilder: FormBuilder,
        private _snackBar: MatSnackBar,
        private _fuseConfirmationService: FuseConfirmationService,
        private _cdr: ChangeDetectorRef
    ) {
    }

    ngOnInit(): void {
        this.unitForm = this._formBuilder.group({
            unitId: [null, Validators.required],
            isPrimary: [false],
            conversionRate: [1, [Validators.required, Validators.min(0.0001)]]
        });
        this.loadAvailableUnits();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.units && this.units !== this._lastEmitted) {
            // Copy the rows so the owner's units are only changed through unitsChange
            this.rows = (this.units || []).map(u => ({ ...u }));
            this.editingIndex = null;
            this.unitForm?.reset({ unitId: null, isPrimary: false, conversionRate: 1 });
        }
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    private loadAvailableUnits(): void {
        if (!this.loadUnits) {
            return;
        }
        this.loadUnits()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (res: any) => {
                    this.availableUnits = res.data || [];
                    this._cdr.detectChanges();
                },
                error: (err) => console.error('Error loading units:', err)
            });
    }

    get hasPrimaryUnit(): boolean {
        return this.rows.some(u => u.isPrimary);
    }

    get primaryUnitName(): string {
        return this.rows.find(u => u.isPrimary)?.unitName || '';
    }

    getUnitName(unitId: number): string {
        return this.availableUnits.find(u => u.unitId === unitId)?.unitName || '';
    }

    saveUnit(): void {
        if (this.unitForm.invalid) {
            return;
        }

        const formValue = this.unitForm.value;
        const selectedUnit = this.availableUnits.find(u => u.unitId === formValue.unitId);

        const unit: UnitRow = {
            unitId: formValue.unitId,
            unitName: selectedUnit?.unitName || '',
            unitCode: selectedUnit?.unitCode || '',
            isPrimary: formValue.isPrimary || !this.hasPrimaryUnit, // First unit is always primary
            conversionRate: formValue.isPrimary || !this.hasPrimaryUnit ? 1 : formValue.conversionRate
        };

        if (unit.isPrimary) {
            this.rows.forEach(u => u.isPrimary = false);
        }

        if (this.editingIndex !== null) {
            this.rows[this.editingIndex] = unit;
            this.rows = [...this.rows];
            this._snackBar.open('Unit updated', undefined, { duration: 2000 });
        } else {
            if (this.rows.some(u => u.unitId === unit.unitId)) {
                this._snackBar.open('This unit is already added', undefined, { duration: 2000 });
                return;
            }
            this.rows = [...this.rows, unit];
            this._snackBar.open('Unit added', undefined, { duration: 2000 });
        }

        this.resetForm();
        this.emit();
    }

    editUnit(index: number): void {
        const unit = this.rows[index];
        this.editingIndex = index;
        this.unitForm.patchValue({
            unitId: unit.unitId,
            isPrimary: unit.isPrimary,
            conversionRate: unit.conversionRate
        });
        this._cdr.detectChanges();
    }

    deleteUnit(index: number): void {
        const unit = this.rows[index];

        // The primary unit can only go when it is the last one - otherwise another must be made primary first
        if (unit.isPrimary && this.rows.length > 1) {
            this._snackBar.open('Cannot delete primary unit. Set another unit as primary first.', undefined, { duration: 3000 });
            return;
        }

        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete Unit',
            message: `Are you sure you want to remove "${unit.unitName}"?`,
            actions: { confirm: { label: 'Delete' } }
        });

        confirmation.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                this.rows = this.rows.filter((_, i) => i !== index);
                this.resetForm();
                this._snackBar.open('Unit removed', undefined, { duration: 2000 });
                this.emit();
            }
        });
    }

    setPrimary(index: number): void {
        this.rows = this.rows.map((u, i) => ({
            ...u,
            isPrimary: i === index,
            conversionRate: i === index ? 1 : u.conversionRate
        }));
        this._snackBar.open(`${this.rows[index].unitName} is now the primary unit`, undefined, { duration: 2000 });
        this.emit();
    }

    resetForm(): void {
        this.unitForm.reset({ unitId: null, isPrimary: false, conversionRate: 1 });
        this.editingIndex = null;
    }

    cancelEdit(): void {
        this.resetForm();
        this._cdr.detectChanges();
    }

    private emit(): void {
        this._lastEmitted = this.rows.map(u => ({ ...u }));
        this.unitsChange.emit(this._lastEmitted);
        this._cdr.detectChanges();
    }
}
