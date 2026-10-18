import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslocoService } from '@ngneat/transloco';
import { Subject } from 'rxjs';
import { filter, finalize, takeUntil } from 'rxjs/operators';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { RawMaterialCategoryService } from '../../raw-material-category.service';
import { RawMaterialCategory, RawMaterialCategoryAttribute, RawMaterialCategoryStatus } from '../../raw-material-category.types';
import { Attribute, ATTRIBUTE_STATUSES, AttributeValue } from '../../../attribute/attribute.types';
import { ProductService } from '../../../product/product.service';
import { DATA_TYPE_LIST } from '../../../product/product.types';

/** The attribute status that can be newly selected; an inactive one stays only where it is already selected. */
const ATTRIBUTE_ACTIVE = ATTRIBUTE_STATUSES.find(x => x.isDefault === 1).statusId;

export interface RawMaterialCategoryDialogData {
    /** Set to edit that category; left out to add one under `parentId`. */
    category?: RawMaterialCategory;
    /** For a new category: null adds a root category. */
    parentId?: number;
    /** The whole tree, for the parent list, the previews and the duplicate code check. */
    categories: Array<RawMaterialCategory>;
    statuses: Array<RawMaterialCategoryStatus>;
    /** Every attribute, for the attribute picker. */
    attributes: Array<Attribute>;
}

export interface RawMaterialCategoryDialogResult {
    /** Id of the last category saved, or null when nothing was saved. */
    savedId: number;
    /** Set when "Add sub-category" was pressed while editing: open the add dialog under this id. */
    addChildOf?: number;
}

/**
 * Adds or edits one raw material category. While adding, "Create & add another" keeps the dialog open
 * so several siblings can be entered in a row.
 * <p>
 * Attributes: the user picks the attributes of the category's raw materials; each list attribute then
 * gets the values allowed in the category (at least one) - a number or text attribute allows any value.
 * The allowed values live in the `values` group, one control per list attribute, keyed by its id.
 */
@Component({
    selector: 'raw-material-category-dialog',
    templateUrl: './category-dialog.component.html',
    styles: [
        /* language=SCSS */
        `
            .raw-material-category-dialog .mat-dialog-container {
                padding: 0;
            }
        `
    ],
    encapsulation: ViewEncapsulation.None
})
export class RawMaterialCategoryDialogComponent implements OnInit, OnDestroy {
    form: FormGroup;
    isEdit: boolean;
    /** Categories that can be chosen as parent: when editing, not the category itself or its descendants. */
    parentOptions: Array<RawMaterialCategory> = [];
    childCount: number = 0;
    isSaving: boolean = false;
    errorMessage: string = null;
    /** Names created while "add another" kept the dialog open. */
    createdNames: Array<string> = [];
    /** Typed into the attribute picker's search box. */
    attributeFilter: FormControl = new FormControl('');

    private savedId: number = null;
    /** The values of each list attribute shown, loaded once each. */
    private valuesByAttribute = new Map<number, Array<AttributeValue>>();
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: RawMaterialCategoryDialogData,
        private _dialogRef: MatDialogRef<RawMaterialCategoryDialogComponent, RawMaterialCategoryDialogResult>,
        private _formBuilder: FormBuilder,
        private service: RawMaterialCategoryService,
        private _productService: ProductService,
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
            const excluded = this.subtreeIds(category.rawMaterialCategoryId);
            this.parentOptions = this.data.categories.filter(x => !excluded.has(x.rawMaterialCategoryId));
            this.childCount = this.data.categories.filter(x => x.parentId === category.rawMaterialCategoryId).length;
        }
        else
            this.parentOptions = this.data.categories;

        const defaultStatus = this.data.statuses.find(x => x.isDefault === 1);
        this.form = this._formBuilder.group({
            parent: [parentId],
            code: [this.isEdit ? category.rawMaterialCategoryCode : null, [Validators.required, Validators.maxLength(30)]],
            name: [this.isEdit ? category.rawMaterialCategoryName : null, [Validators.required, Validators.maxLength(40)]],
            // A new sub-category starts with its parent's ordering values.
            orderDeadline: [this.isEdit ? category.orderDeadline : parent ? parent.orderDeadline : null, [Validators.min(0)]],
            orderCriticalPoint: [this.isEdit ? category.orderCriticalPoint : parent ? parent.orderCriticalPoint : null, [Validators.min(0)]],
            // A category saved without a status (or with an unknown one) shows the default.
            status: [this.isEdit && this.data.statuses.some(x => x.statusId === category.status)
                ? category.status : defaultStatus ? defaultStatus.statusId : null],
            attributeIds: [[]],
            values: this._formBuilder.group({}),
        });
        this.setAttributes(this.isEdit ? category.attributes : []);
        this.form.controls['attributeIds'].valueChanges.pipe(takeUntil(this._unsubscribeAll))
            .subscribe(() => this.syncValueControls());

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

    get parent(): RawMaterialCategory {
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

    get valuesGroup(): FormGroup {
        return this.form.controls['values'] as FormGroup;
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
        return (this.form.controls['attributeIds'].value || []).map((id: number) => this.findAttribute(id));
    }

    isList(attribute: Attribute): boolean {
        return attribute.dataType === DATA_TYPE_LIST;
    }

    isAttributeActive(attribute: Attribute): boolean {
        return attribute.status === ATTRIBUTE_ACTIVE;
    }

    valuesOf(attribute: Attribute): Array<AttributeValue> {
        return this.valuesByAttribute.get(attribute.attributeId) || [];
    }

    /** The key of a list attribute's control in the `values` group. */
    valueKey(attribute: Attribute): string {
        return String(attribute.attributeId);
    }

    /** Allows every value of the list attribute at once. */
    selectAllValues(attribute: Attribute): void {
        const control = this.valuesGroup.controls[this.valueKey(attribute)];
        control.setValue(this.valuesOf(attribute).map(x => x.attributeValueId));
        control.markAsDirty();
    }

    removeAttribute(id: number): void {
        const control = this.form.controls['attributeIds'];
        control.setValue((control.value || []).filter((x: number) => x !== id));
        control.markAsDirty();
    }

    /** A sibling already using the code typed in the form; a warning only, the server decides. */
    get duplicateCodeSibling(): RawMaterialCategory {
        const code = (this.form.controls['code'].value || '').trim().toLowerCase();
        if (!code)
            return null;
        const parentId = this.form.controls['parent'].value || null;
        return this.data.categories.find(x =>
            (x.parentId || null) === parentId &&
            (!this.isEdit || x.rawMaterialCategoryId !== this.data.category.rawMaterialCategoryId) &&
            (x.rawMaterialCategoryCode || '').trim().toLowerCase() === code);
    }

    save(addAnother: boolean): void {
        this.errorMessage = null;
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const controls = this.form.controls;
        const category = new RawMaterialCategory();
        category.rawMaterialCategoryId = this.isEdit ? this.data.category.rawMaterialCategoryId : null;
        category.parentId = controls['parent'].value || null;
        category.rawMaterialCategoryCode = (controls['code'].value || '').trim();
        category.rawMaterialCategoryName = (controls['name'].value || '').trim();
        category.orderDeadline = controls['orderDeadline'].value;
        category.orderCriticalPoint = controls['orderCriticalPoint'].value;
        category.status = controls['status'].value;
        category.attributes = this.selectedAttributes.map(attribute => ({
            attributeId: attribute.attributeId,
            attributeValueIds: this.isList(attribute) ? [...(this.valuesGroup.controls[this.valueKey(attribute)].value || [])] : [],
        }));

        this.isSaving = true;
        (this.isEdit ? this.service.editCategory(category) : this.service.createCategory(category))
            .pipe(takeUntil(this._unsubscribeAll), finalize(() => {
                this.isSaving = false;
                this.cdr.detectChanges();
            }))
            .subscribe(saved => {
                this.savedId = saved.rawMaterialCategoryId;
                if (!addAnother) {
                    this._dialogRef.close({ savedId: this.savedId });
                    return;
                }
                // The saved category can be the parent of the next one, and counts for the duplicate check.
                this.data.categories = [...this.data.categories, saved];
                this.parentOptions = this.data.categories;
                this.createdNames.push(saved.rawMaterialCategoryName);
                // The next sibling starts with the same attributes and values.
                this.form.reset({
                    parent: controls['parent'].value,
                    code: null,
                    name: null,
                    orderDeadline: controls['orderDeadline'].value,
                    orderCriticalPoint: controls['orderCriticalPoint'].value,
                    status: controls['status'].value,
                    attributeIds: controls['attributeIds'].value,
                    values: this.valuesGroup.getRawValue(),
                });
            }, error => this.errorMessage = this.service.errorMessage(error));
    }

    /** Closes the dialog, asking first when there is unsaved input. */
    close(addChildOf: number = null): void {
        if (this.isSaving)
            return;
        const result: RawMaterialCategoryDialogResult = { savedId: this.savedId, addChildOf: addChildOf };
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
        this.close(this.data.category.rawMaterialCategoryId);
    }

    /** Shows the stored attributes and their allowed values, without marking the form dirty. */
    private setAttributes(attributes: Array<RawMaterialCategoryAttribute>): void {
        const list = attributes || [];
        this.form.controls['attributeIds'].setValue(list.map(x => x.attributeId), { emitEvent: false });
        this.syncValueControls();
        list.forEach(x => {
            const control = this.valuesGroup.controls[String(x.attributeId)];
            if (control)
                control.setValue([...(x.attributeValueIds || [])], { emitEvent: false });
        });
    }

    /**
     * Keeps one `values` control per selected list attribute - at least one value required - and loads the
     * values of any list attribute not loaded yet.
     */
    private syncValueControls(): void {
        const listIds = this.selectedAttributes.filter(x => this.isList(x)).map(x => this.valueKey(x));
        Object.keys(this.valuesGroup.controls).filter(key => !listIds.includes(key))
            .forEach(key => this.valuesGroup.removeControl(key));
        listIds.filter(key => !this.valuesGroup.contains(key))
            .forEach(key => this.valuesGroup.addControl(key, new FormControl([], Validators.required)));

        this.selectedAttributes.filter(x => this.isList(x) && !this.valuesByAttribute.has(x.attributeId)).forEach(attribute => {
            this.valuesByAttribute.set(attribute.attributeId, []);
            this._productService.getAttributeValues(attribute.attributeId).pipe(takeUntil(this._unsubscribeAll))
                .subscribe(values => {
                    this.valuesByAttribute.set(attribute.attributeId, values || []);
                    this.cdr.detectChanges();
                }, () => this.valuesByAttribute.delete(attribute.attributeId));
        });
    }

    private findAttribute(id: number): Attribute {
        return this.data.attributes.find(x => x.attributeId === id) || <Attribute>{ attributeId: id, attributeName: '#' + id };
    }

    private findCategory(id: number): RawMaterialCategory {
        return id ? this.data.categories.find(x => x.rawMaterialCategoryId === id) : null;
    }

    /** Ids of the category and all of its descendants - none of them can become its parent. */
    private subtreeIds(id: number): Set<number> {
        const ids = new Set<number>([id]);
        // The list is in full-code order, so a parent always comes before its children.
        this.data.categories.forEach(x => {
            if (x.parentId && ids.has(x.parentId))
                ids.add(x.rawMaterialCategoryId);
        });
        return ids;
    }

    private translate(key: string): string {
        return this._translocoService.translate(key);
    }
}
