import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { filter, finalize, takeUntil } from 'rxjs/operators';
import { ProductService } from '../product.service';
import { Brand, skuPart } from '../product.types';

export interface BrandDialogData {
    /** What the user typed in the brand search - the new brand's name to start with. */
    name: string;
    /** The brands there are, for the duplicate warnings. */
    brands: Array<Brand>;
}

/**
 * Adds a brand without leaving the product form. Code and name must be unique (the server decides); closes
 * with the stored brand so the form can select it.
 */
@Component({
    selector: 'product-brand-dialog',
    templateUrl: './brand-dialog.component.html',
    styles: [
        /* language=SCSS */
        `
            .product-brand-dialog .mat-dialog-container {
                padding: 0;
            }
        `
    ],
    encapsulation: ViewEncapsulation.None
})
export class BrandDialogComponent implements OnInit, OnDestroy {
    form: FormGroup;
    isSaving: boolean = false;
    errorMessage: string = null;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: BrandDialogData,
        private _dialogRef: MatDialogRef<BrandDialogComponent, Brand>,
        private _formBuilder: FormBuilder,
        private service: ProductService,
        private cdr: ChangeDetectorRef
    ) {
    }

    ngOnInit(): void {
        const name = (this.data.name || '').trim();
        this.form = this._formBuilder.group({
            name: [name || null, [Validators.required, Validators.maxLength(200)]],
            code: [this.suggestCode(name), [Validators.required, Validators.maxLength(10)]],
        });
        // The code follows the name until the user types one.
        this.form.controls['name'].valueChanges.pipe(takeUntil(this._unsubscribeAll)).subscribe(value => {
            if (!this.form.controls['code'].dirty)
                this.form.controls['code'].setValue(this.suggestCode(value));
        });
        this._dialogRef.keydownEvents()
            .pipe(takeUntil(this._unsubscribeAll), filter(e => e.key === 'Escape'))
            .subscribe(() => this.close());
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    get duplicateName(): boolean {
        return this.exists(b => b.brandName, this.form.controls['name'].value);
    }

    get duplicateCode(): boolean {
        return this.exists(b => b.brandCode, this.form.controls['code'].value);
    }

    save(): void {
        this.errorMessage = null;
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        const brand = new Brand();
        brand.brandName = (this.form.controls['name'].value || '').trim();
        brand.brandCode = (this.form.controls['code'].value || '').trim();
        this.isSaving = true;
        this.service.createBrand(brand)
            .pipe(takeUntil(this._unsubscribeAll), finalize(() => {
                this.isSaving = false;
                this.cdr.detectChanges();
            }))
            .subscribe(saved => this._dialogRef.close(saved), error => this.errorMessage = this.service.errorMessage(error));
    }

    close(): void {
        if (!this.isSaving)
            this._dialogRef.close(null);
    }

    private suggestCode(name: string): string {
        return skuPart(name).replace(/-/g, '').substring(0, 10) || null;
    }

    private exists(field: (b: Brand) => string, value: string): boolean {
        const text = (value || '').trim().toUpperCase();
        return !!text && this.data.brands.some(b => (field(b) || '').trim().toUpperCase() === text);
    }
}
