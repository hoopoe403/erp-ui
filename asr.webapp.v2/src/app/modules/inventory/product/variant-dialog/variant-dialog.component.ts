import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslocoService } from '@ngneat/transloco';
import { Subject } from 'rxjs';
import { filter, finalize, takeUntil } from 'rxjs/operators';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { AttributeValue } from '../../attribute/attribute.types';
import { ProductService } from '../product.service';
import { Product, ProductVariant, ProductVariantAttributeValueRow, suggestedSku } from '../product.types';

/** A variant attribute of the product with the values a variant can pick from. */
export interface VariantAttribute {
    attributeId: number;
    attributeName: string;
    values: Array<AttributeValue>;
}

export interface VariantDialogData {
    product: Product;
    /** The product's stored variant attributes - a variant has exactly one value of each. */
    variantAttributes: Array<VariantAttribute>;
    /** The product's variants, for the duplicate checks shown before saving. */
    variants: Array<ProductVariant>;
    /** Set to edit that variant; null adds one. */
    variant: ProductVariant;
    statuses: Array<any>;
}

/**
 * Edits one generated variant (SKU) of a product: its SKU, barcode and status. Its values - one per variant
 * attribute - are shown read-only: they come from the values selected on the product, which is where variants
 * are added and removed. The server rejects a duplicate SKU or barcode. Shows the history of the variant's values.
 */
@Component({
    selector: 'product-variant-dialog',
    templateUrl: './variant-dialog.component.html',
    styles: [
        /* language=SCSS */
        `
            .product-variant-dialog .mat-dialog-container {
                padding: 0;
            }
        `
    ],
    encapsulation: ViewEncapsulation.None
})
export class VariantDialogComponent implements OnInit, OnDestroy {
    form: FormGroup;
    isEdit: boolean;
    isSaving: boolean = false;
    errorMessage: string = null;
    history: Array<ProductVariantAttributeValueRow> = null;
    showHistory: boolean = false;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: VariantDialogData,
        private _dialogRef: MatDialogRef<VariantDialogComponent, ProductVariant>,
        private _formBuilder: FormBuilder,
        private service: ProductService,
        private cdr: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _translocoService: TranslocoService
    ) {
    }

    ngOnInit(): void {
        const variant = this.data.variant;
        this.isEdit = !!variant;
        const defaultStatus = this.data.statuses.find(x => x.isDefault === 1);
        const valueControls = {};
        this.data.variantAttributes.forEach(attribute => {
            const selected = variant ? attribute.values.find(v => (variant.attributeValueIds || []).includes(v.attributeValueId)) : null;
            valueControls['a' + attribute.attributeId] = [selected ? selected.attributeValueId : null, Validators.required];
        });
        this.form = this._formBuilder.group({
            sku: [variant ? variant.sku : this.suggestedSku(), [Validators.required, Validators.maxLength(50)]],
            barcode: [variant ? variant.barcode : null, Validators.maxLength(50)],
            status: [variant ? variant.status : defaultStatus ? defaultStatus.statusId : null],
            values: this._formBuilder.group(valueControls),
        });
        // The combination is the product's business - change the product's values to get other variants.
        this.valuesGroup.disable();

        this._dialogRef.backdropClick().pipe(takeUntil(this._unsubscribeAll)).subscribe(() => this.close());
        this._dialogRef.keydownEvents()
            .pipe(takeUntil(this._unsubscribeAll), filter(e => e.key === 'Escape'))
            .subscribe(() => this.close());
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    get valuesGroup(): FormGroup {
        return this.form.controls['values'] as FormGroup;
    }

    get selectedValueIds(): Array<number> {
        return this.data.variantAttributes
            .map(a => this.valuesGroup.getRawValue()['a' + a.attributeId])
            .filter(id => id != null);
    }

    /** Another variant of the product with the same values - the server would reject it. */
    get duplicateCombination(): ProductVariant {
        const ids = this.selectedValueIds;
        if (ids.length !== this.data.variantAttributes.length)
            return null;
        const key = [...ids].sort((a, b) => a - b).join(',');
        return this.otherVariants.find(v => [...(v.attributeValueIds || [])].sort((a, b) => a - b).join(',') === key);
    }

    get duplicateSku(): ProductVariant {
        return this.findOther('sku');
    }

    get duplicateBarcode(): ProductVariant {
        return this.findOther('barcode');
    }

    save(): void {
        this.errorMessage = null;
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        const controls = this.form.controls;
        const variant = new ProductVariant();
        variant.productVariantId = this.isEdit ? this.data.variant.productVariantId : null;
        variant.productId = this.data.product.productId;
        variant.sku = (controls['sku'].value || '').trim();
        variant.barcode = (controls['barcode'].value || '').trim() || null;
        variant.status = controls['status'].value;
        variant.attributeValueIds = this.selectedValueIds;

        this.isSaving = true;
        (this.isEdit ? this.service.editVariant(variant) : this.service.createVariant(variant))
            .pipe(takeUntil(this._unsubscribeAll), finalize(() => {
                this.isSaving = false;
                this.cdr.detectChanges();
            }))
            .subscribe(saved => this._dialogRef.close(saved),
                error => this.errorMessage = this.service.errorMessage(error));
    }

    toggleHistory(): void {
        this.showHistory = !this.showHistory;
        if (!this.showHistory || this.history)
            return;
        this.service.getVariantValueHistory(this.data.variant.productVariantId)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(rows => {
                this.history = rows;
                this.cdr.detectChanges();
            }, error => this.errorMessage = this.service.errorMessage(error));
    }

    /** Closes the dialog, asking first when there is unsaved input. */
    close(): void {
        if (this.isSaving)
            return;
        if (!this.form.dirty) {
            this._dialogRef.close(null);
            return;
        }
        this._fuseConfirmationService.open({
            title: this._translocoService.translate('inventory.unsavedChangesTitle'),
            message: this._translocoService.translate('inventory.unsavedChangesMessage'),
            actions: {
                confirm: { label: this._translocoService.translate('inventory.discardChanges') },
                cancel: { label: this._translocoService.translate('common.cancel') }
            }
        }).afterClosed()
            .pipe(filter(answer => answer === 'confirmed'))
            .subscribe(() => this._dialogRef.close(null));
    }

    /** What the app suggests for this variant: the product code plus its values' short codes. */
    get suggestion(): string {
        const values = this.data.variantAttributes
            .map(a => a.values.find(v => v.attributeValueId === this.valuesGroup.getRawValue()['a' + a.attributeId]))
            .filter(v => !!v);
        return suggestedSku(this.data.product, values);
    }

    useSuggestion(): void {
        this.form.controls['sku'].setValue(this.suggestion);
        this.form.controls['sku'].markAsDirty();
    }

    /** A first SKU for a new variant: the suggestion. */
    private suggestedSku(): string {
        return suggestedSku(this.data.product, []);
    }

    private get otherVariants(): Array<ProductVariant> {
        return this.data.variants.filter(v => !this.isEdit || v.productVariantId !== this.data.variant.productVariantId);
    }

    private findOther(field: 'sku' | 'barcode'): ProductVariant {
        const value = (this.form.controls[field].value || '').trim().toUpperCase();
        return value ? this.otherVariants.find(v => (v[field] || '').trim().toUpperCase() === value) : null;
    }
}
