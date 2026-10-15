import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslocoService } from '@ngneat/transloco';
import { Subject } from 'rxjs';
import { filter, finalize, takeUntil } from 'rxjs/operators';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { ProductCategoryService } from '../../product-category.service';
import { ProductCategory, ProductCategoryStatus } from '../../product-category.types';
import { Attribute, ATTRIBUTE_STATUSES } from '../../../attribute/attribute.types';

/** The attribute status that can be newly selected; an inactive one stays only where it is already selected. */
const ATTRIBUTE_ACTIVE = ATTRIBUTE_STATUSES.find(x => x.isDefault === 1).statusId;

export interface ProductCategoryDialogData {
    /** Set to edit that category; left out to add one under `parentId`. */
    category?: ProductCategory;
    /** For a new category: null adds a root category. */
    parentId?: number;
    /** The whole tree, for the parent list, the previews and the duplicate code check. */
    categories: Array<ProductCategory>;
    statuses: Array<ProductCategoryStatus>;
    /** Every attribute, for the attribute picker. */
    attributes: Array<Attribute>;
}

export interface ProductCategoryDialogResult {
    /** Id of the last category saved, or null when nothing was saved. */
    savedId: number;
    /** Set when "Add sub-category" was pressed while editing: open the add dialog under this id. */
    addChildOf?: number;
}

/**
 * Adds or edits one product category. While adding, "Create & add another" keeps the dialog open
 * so several siblings can be entered in a row.
 */
@Component({
    selector: 'product-category-dialog',
    templateUrl: './category-dialog.component.html',
    styles: [
        /* language=SCSS */
        `
            .product-category-dialog .mat-dialog-container {
                padding: 0;
            }
        `
    ],
    encapsulation: ViewEncapsulation.None
})
export class ProductCategoryDialogComponent implements OnInit, OnDestroy {
    form: FormGroup;
    isEdit: boolean;
    /** Categories that can be chosen as parent: when editing, not the category itself or its descendants. */
    parentOptions: Array<ProductCategory> = [];
    childCount: number = 0;
    isSaving: boolean = false;
    errorMessage: string = null;
    /** Typed into the attribute picker's search box. */
    attributeFilter: FormControl = new FormControl('');
    /** True while a new category's attributes are still the ones copied from its parent. */
    attributesFromParent: boolean = false;
    /** Names created while "add another" kept the dialog open. */
    createdNames: Array<string> = [];

    private savedId: number = null;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: ProductCategoryDialogData,
        private _dialogRef: MatDialogRef<ProductCategoryDialogComponent, ProductCategoryDialogResult>,
        private _formBuilder: FormBuilder,
        private service: ProductCategoryService,
        private cdr: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _translocoService: TranslocoService
    ) {
    }

    ngOnInit(): void {
        const category = this.data.category;
        this.isEdit = !!category;
        const parentId = (this.isEdit ? category.parentId : this.data.parentId) || null;
        const parent = this.findCategory(parentId);

        if (this.isEdit) {
            const excluded = this.subtreeIds(category.productCategoryId);
            this.parentOptions = this.data.categories.filter(x => !excluded.has(x.productCategoryId));
            this.childCount = this.data.categories.filter(x => x.parentId === category.productCategoryId).length;
        }
        else
            this.parentOptions = this.data.categories;

        const defaultStatus = this.data.statuses.find(x => x.isDefault === 1);
        this.form = this._formBuilder.group({
            parent: [parentId],
            code: [this.isEdit ? category.productCategoryCode : null, [Validators.required, Validators.maxLength(30)]],
            name: [this.isEdit ? category.productCategoryName : null, [Validators.required, Validators.maxLength(40)]],
            // A new sub-category starts with its parent's ordering values.
            orderDeadline: [this.isEdit ? category.orderDeadline : parent ? parent.orderDeadline : null, [Validators.min(0)]],
            orderCriticalPoint: [this.isEdit ? category.orderCriticalPoint : parent ? parent.orderCriticalPoint : null, [Validators.min(0)]],
            // A category saved without a status (or with an unknown one) shows the default.
            status: [this.isEdit && this.data.statuses.some(x => x.statusId === category.status)
                ? category.status : defaultStatus ? defaultStatus.statusId : null],
            // A new sub-category starts with its parent's attributes; each category stores its own list.
            attributeIds: [this.isEdit ? [...(category.attributeIds || [])] : this.parentAttributeIds(parent)],
        });
        this.attributesFromParent = !this.isEdit && this.form.controls['attributeIds'].value.length > 0;

        // While adding, picking another parent brings its attributes along - until the user changes them.
        if (!this.isEdit)
            this.form.controls['parent'].valueChanges.pipe(takeUntil(this._unsubscribeAll)).subscribe(parentId => {
                if (this.form.controls['attributeIds'].dirty)
                    return;
                const ids = this.parentAttributeIds(this.findCategory(parentId));
                this.form.controls['attributeIds'].setValue(ids);
                this.attributesFromParent = ids.length > 0;
            });
        this.form.controls['attributeIds'].valueChanges.pipe(takeUntil(this._unsubscribeAll)).subscribe(() => {
            if (this.form.controls['attributeIds'].dirty)
                this.attributesFromParent = false;
        });

        // Escape and backdrop clicks go through close() so unsaved input is never lost silently.
        this._dialogRef.backdropClick().pipe(takeUntil(this._unsubscribeAll)).subscribe(() => this.close());
        this._dialogRef.keydownEvents()
            .pipe(takeUntil(this._unsubscribeAll), filter(e => e.key === 'Escape'))
            .subscribe(() => this.close());
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    get parent(): ProductCategory {
        return this.findCategory(this.form.controls['parent'].value);
    }

    /** What the full code will be after saving: the parent's full code followed by this code. */
    get fullCodePreview(): string {
        const parent = this.parent;
        return (parent ? parent.fullCode : '') + (this.form.controls['code'].value || '').trim();
    }

    get fullNamePreview(): string {
        const parent = this.parent;
        const name = (this.form.controls['name'].value || '').trim();
        return parent ? parent.fullName + ' / ' + name : name;
    }

    /** What the picker offers: active attributes plus any already selected one, matching the search. */
    get attributeOptions(): Array<Attribute> {
        const selected = new Set<number>(this.form.controls['attributeIds'].value || []);
        const term = (this.attributeFilter.value || '').trim().toLowerCase();
        return this.data.attributes.filter(x =>
            (x.status === ATTRIBUTE_ACTIVE || selected.has(x.attributeId)) &&
            (!term || (x.attributeCode || '').toLowerCase().includes(term) || (x.attributeName || '').toLowerCase().includes(term)));
    }

    /** The selected attributes in selection order; an id no longer in the list shows as its number. */
    get selectedAttributes(): Array<Attribute> {
        return (this.form.controls['attributeIds'].value || []).map((id: number) =>
            this.data.attributes.find(x => x.attributeId === id) || <Attribute>{ attributeId: id, attributeName: '#' + id });
    }

    isAttributeActive(attribute: Attribute): boolean {
        return attribute.status === ATTRIBUTE_ACTIVE;
    }

    removeAttribute(id: number): void {
        const control = this.form.controls['attributeIds'];
        control.setValue((control.value || []).filter((x: number) => x !== id));
        control.markAsDirty();
    }

    /** A sibling already using the code typed in the form; a warning only, the server decides. */
    get duplicateCodeSibling(): ProductCategory {
        const code = (this.form.controls['code'].value || '').trim().toLowerCase();
        if (!code)
            return null;
        const parentId = this.form.controls['parent'].value || null;
        return this.data.categories.find(x =>
            (x.parentId || null) === parentId &&
            (!this.isEdit || x.productCategoryId !== this.data.category.productCategoryId) &&
            (x.productCategoryCode || '').trim().toLowerCase() === code);
    }

    save(addAnother: boolean): void {
        this.errorMessage = null;
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const controls = this.form.controls;
        const category = new ProductCategory();
        category.productCategoryId = this.isEdit ? this.data.category.productCategoryId : null;
        category.parentId = controls['parent'].value || null;
        category.productCategoryCode = (controls['code'].value || '').trim();
        category.productCategoryName = (controls['name'].value || '').trim();
        category.orderDeadline = controls['orderDeadline'].value;
        category.orderCriticalPoint = controls['orderCriticalPoint'].value;
        category.status = controls['status'].value;
        category.attributeIds = controls['attributeIds'].value || [];

        this.isSaving = true;
        (this.isEdit ? this.service.editCategory(category) : this.service.createCategory(category))
            .pipe(takeUntil(this._unsubscribeAll), finalize(() => {
                this.isSaving = false;
                this.cdr.detectChanges();
            }))
            .subscribe(saved => {
                this.savedId = saved.productCategoryId;
                if (!addAnother) {
                    this._dialogRef.close({ savedId: this.savedId });
                    return;
                }
                // The saved category can be the parent of the next one, and counts for the duplicate check.
                this.data.categories = [...this.data.categories, saved];
                this.parentOptions = this.data.categories;
                this.createdNames.push(saved.productCategoryName);
                this.form.reset({
                    parent: controls['parent'].value,
                    code: null,
                    name: null,
                    orderDeadline: controls['orderDeadline'].value,
                    orderCriticalPoint: controls['orderCriticalPoint'].value,
                    status: controls['status'].value,
                    attributeIds: controls['attributeIds'].value,
                });
            }, error => this.errorMessage = this.service.errorMessage(error));
    }

    /** Closes the dialog, asking first when there is unsaved input. */
    close(addChildOf: number = null): void {
        if (this.isSaving)
            return;
        const result: ProductCategoryDialogResult = { savedId: this.savedId, addChildOf: addChildOf };
        if (!this.form.dirty) {
            this._dialogRef.close(result);
            return;
        }
        this._fuseConfirmationService.open({
            title: this.translate('inventory.unsavedChangesTitle'),
            message: this.translate('inventory.unsavedChangesMessage'),
            actions: {
                confirm: { label: this.translate('inventory.discardChanges') },
                cancel: { label: this.translate('common.cancel') }
            }
        }).afterClosed()
            .pipe(filter(answer => answer === 'confirmed'))
            .subscribe(() => this._dialogRef.close(result));
    }

    addSubCategory(): void {
        this.close(this.data.category.productCategoryId);
    }

    private parentAttributeIds(parent: ProductCategory): Array<number> {
        return parent && parent.attributeIds ? [...parent.attributeIds] : [];
    }

    private findCategory(id: number): ProductCategory {
        return id ? this.data.categories.find(x => x.productCategoryId === id) : null;
    }

    /** Ids of the category and all of its descendants - none of them can become its parent. */
    private subtreeIds(id: number): Set<number> {
        const ids = new Set<number>([id]);
        // The list is in full-code order, so a parent always comes before its children.
        this.data.categories.forEach(x => {
            if (x.parentId && ids.has(x.parentId))
                ids.add(x.productCategoryId);
        });
        return ids;
    }

    private translate(key: string): string {
        return this._translocoService.translate(key);
    }
}
