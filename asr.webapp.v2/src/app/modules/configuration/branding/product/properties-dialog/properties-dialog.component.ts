import { Component, Inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Product, ProductUnit } from '../product.types';
import { ProductPropertiesDialogConfig, ProductPropertiesDialogResult } from './properties-dialog.types';
import { ProductService } from '../product.service';
import { Units } from 'app/modules/configuration/measurement/unit/unit.types';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { ItemListConfig } from 'app/modules/configuration/shared/item-list/item-list.types';

@Component({
    selector: 'product-properties-dialog',
    templateUrl: './properties-dialog.component.html',
    styles: [`
        .unit-table {
            width: 100%;
            border-collapse: collapse;
        }
        .unit-table th, .unit-table td {
            padding: 8px 12px;
            text-align: left;
            border-bottom: 1px solid #e0e0e0;
        }
        .unit-table th {
            background-color: #f5f5f5;
            font-weight: 600;
        }
        .primary-badge {
            background-color: #4caf50;
            color: white;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
        }
    `]
})
export class ProductPropertiesDialogComponent implements OnInit, OnDestroy {
    product: Product;
    units: ProductUnit[] = [];
    availableUnits: Units[] = [];
    unitForm: FormGroup;
    isLoading = false;
    editingIndex: number | null = null;
    
    // Item list configuration for units
    listConfig: ItemListConfig = {
        title: 'Product Units',
        emptyMessage: 'No units added yet. Add a primary unit first, then add secondary units with conversion rates.',
        columns: [
            { key: 'unitName', label: 'Unit' },
            { key: 'unitCode', label: 'Code' },
            { 
                key: 'isPrimary', 
                label: 'Type', 
                type: 'primary-badge',
                align: 'center'
            },
            { key: 'conversionRate', label: 'Conversion Rate' }
        ],
        actions: [
            { 
                icon: 'star_outline', 
                tooltip: 'Set as Primary', 
                color: 'accent', 
                action: 'primary',
                showCondition: (item: ProductUnit) => !item.isPrimary
            },
            { icon: 'edit', tooltip: 'Edit', color: 'primary', action: 'edit' },
            { icon: 'delete', tooltip: 'Delete', color: 'warn', action: 'delete' }
        ]
    };
    
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: ProductPropertiesDialogConfig,
        public dialogRef: MatDialogRef<ProductPropertiesDialogComponent>,
        private _formBuilder: FormBuilder,
        private _productService: ProductService,
        private _snackBar: MatSnackBar,
        private _fuseConfirmationService: FuseConfirmationService,
        private _cdr: ChangeDetectorRef
    ) {
        this.product = data.product;
    }

    ngOnInit(): void {
        this.createForm();
        this.loadUnits();
        this.loadProductUnits();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    /**
     * Create the unit form
     */
    private createForm(): void {
        this.unitForm = this._formBuilder.group({
            unitId: [null, Validators.required],
            isPrimary: [false],
            conversionRate: [1, [Validators.required, Validators.min(0.0001)]]
        });
    }

    /**
     * Load available units from service
     */
    private loadUnits(): void {
        this._productService.getUnits()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (res: any) => {
                    this.availableUnits = res.data || [];
                    this._cdr.detectChanges();
                },
                error: (err) => {
                    console.error('Error loading units:', err);
                }
            });
    }

    /**
     * Load existing product units
     */
    private loadProductUnits(): void {
        // If product already has units, use them
        if (this.product.units && this.product.units.length > 0) {
            this.units = [...this.product.units];
        } else {
            this.units = [];
        }
        this._cdr.detectChanges();
    }

    /**
     * Check if we have a primary unit
     */
    get hasPrimaryUnit(): boolean {
        return this.units.some(u => u.isPrimary);
    }

    /**
     * Get primary unit name
     */
    get primaryUnitName(): string {
        const primary = this.units.find(u => u.isPrimary);
        return primary?.unitName || '';
    }

    /**
     * Get unit name by ID
     */
    getUnitName(unitId: number): string {
        const unit = this.availableUnits.find(u => u.unitId === unitId);
        return unit?.unitName || '';
    }

    /**
     * Get unit code by ID
     */
    getUnitCode(unitId: number): string {
        const unit = this.availableUnits.find(u => u.unitId === unitId);
        return unit?.unitCode || '';
    }

    /**
     * Add or update a unit
     */
    saveUnit(): void {
        if (this.unitForm.invalid) {
            return;
        }

        const formValue = this.unitForm.value;
        const selectedUnit = this.availableUnits.find(u => u.unitId === formValue.unitId);
        
        const productUnit: ProductUnit = {
            unitId: formValue.unitId,
            unitName: selectedUnit?.unitName || '',
            unitCode: selectedUnit?.unitCode || '',
            isPrimary: formValue.isPrimary || !this.hasPrimaryUnit, // First unit is always primary
            conversionRate: formValue.isPrimary ? 1 : formValue.conversionRate
        };

        // If setting this as primary, unset others
        if (productUnit.isPrimary) {
            this.units.forEach(u => u.isPrimary = false);
        }

        if (this.editingIndex !== null) {
            // Update existing
            this.units[this.editingIndex] = productUnit;
            this.units = [...this.units]; // Create new array reference for change detection
            this._snackBar.open('Unit updated', null, { duration: 2000 });
        } else {
            // Check if unit already exists
            const existingIndex = this.units.findIndex(u => u.unitId === productUnit.unitId);
            if (existingIndex !== -1) {
                this._snackBar.open('This unit is already added', null, { duration: 2000 });
                return;
            }
            // Add new
            this.units = [...this.units, productUnit]; // Create new array with the new unit
            this._snackBar.open('Unit added', null, { duration: 2000 });
        }

        this.resetForm();
        this._cdr.detectChanges();
    }

    /**
     * Edit a unit
     */
    editUnit(index: number): void {
        const unit = this.units[index];
        this.editingIndex = index;
        
        this.unitForm.patchValue({
            unitId: unit.unitId,
            isPrimary: unit.isPrimary,
            conversionRate: unit.conversionRate
        });
        
        this._cdr.detectChanges();
    }

    /**
     * Delete a unit
     */
    deleteUnit(index: number): void {
        const unit = this.units[index];
        
        // Prevent deleting primary if it's the only unit or there are other units
        if (unit.isPrimary && this.units.length > 1) {
            this._snackBar.open('Cannot delete primary unit. Set another unit as primary first.', null, { duration: 3000 });
            return;
        }

        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete Unit',
            message: `Are you sure you want to remove "${unit.unitName}" from this product?`,
            actions: {
                confirm: {
                    label: 'Delete'
                }
            }
        });

        confirmation.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                this.units.splice(index, 1);
                
                // If we deleted the primary and there are other units, make the first one primary
                if (unit.isPrimary && this.units.length > 0) {
                    this.units[0].isPrimary = true;
                    this.units[0].conversionRate = 1;
                }
                
                this.units = [...this.units]; // Create new array reference for change detection
                this._snackBar.open('Unit removed', null, { duration: 2000 });
                this._cdr.detectChanges();
            }
        });
    }

    /**
     * Set a unit as primary
     */
    setPrimary(index: number): void {
        // Unset all as primary
        this.units.forEach((u, i) => {
            u.isPrimary = i === index;
            if (i === index) {
                u.conversionRate = 1;
            }
        });
        
        this.units = [...this.units]; // Create new array reference for change detection
        this._snackBar.open(`${this.units[index].unitName} is now the primary unit`, null, { duration: 2000 });
        this._cdr.detectChanges();
    }

    /**
     * Reset the form
     */
    resetForm(): void {
        this.unitForm.reset({
            unitId: null,
            isPrimary: false,
            conversionRate: 1
        });
        this.editingIndex = null;
    }

    /**
     * Cancel editing
     */
    cancelEdit(): void {
        this.resetForm();
        this._cdr.detectChanges();
    }

    /**
     * Save and close dialog
     */
    save(): void {
        if (this.units.length === 0) {
            this._snackBar.open('Please add at least one unit', null, { duration: 2000 });
            return;
        }

        if (!this.hasPrimaryUnit) {
            this._snackBar.open('Please set a primary unit', null, { duration: 2000 });
            return;
        }

        const result: ProductPropertiesDialogResult = {
            saved: true,
            units: this.units
        };

        this.dialogRef.close(result);
    }

    /**
     * Close dialog without saving
     */
    cancel(): void {
        const result: ProductPropertiesDialogResult = {
            saved: false
        };
        this.dialogRef.close(result);
    }
}

