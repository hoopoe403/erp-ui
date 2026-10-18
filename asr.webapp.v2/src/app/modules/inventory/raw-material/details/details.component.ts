import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin, of, Subject } from 'rxjs';
import { catchError, finalize, map, takeUntil } from 'rxjs/operators';
import { fuseAnimations } from '../../../../../@fuse/animations';
import { Attribute, AttributeValue } from '../../attribute/attribute.types';
import { AttributeService } from '../../attribute/attribute.service';
import { ProductCategoryService } from '../../product-category/product-category.service';
import { ProductService } from '../../product/product.service';
import { DATA_TYPE_LIST, DATA_TYPE_NUMBER } from '../../product/product.types';
import { GoodsService } from '../../goods/goods/goods.service';
import { AccountOption } from '../../goods/goods/goods.types';
import { Units } from 'app/modules/configuration/measurement/unit/unit.types';
import { RawMaterialCategoryService } from '../../raw-material-category/raw-material-category.service';
import { RawMaterialCategory } from '../../raw-material-category/raw-material-category.types';
import { RawMaterialService } from '../raw-material.service';
import { RAW_MATERIAL_STATUS_ACTIVE, RawMaterial, RawMaterialAttributeValueInput } from '../raw-material.types';

/** One attribute the user added to the raw material, as a row of the form - it holds a single value. */
export class AttributeLine {
    attributeId: number;
    attributeCode: string;
    attributeName: string;
    dataType: string;
    unitName: string;
    /** The selectable values of a LIST attribute. */
    values: Array<AttributeValue> = [];
    /** valueId (LIST), valueNum (NUMBER) or valueText (anything else) - one value whatever the data type. */
    form: FormGroup;

    get isList(): boolean {
        return this.dataType === DATA_TYPE_LIST;
    }

    get isNumber(): boolean {
        return this.dataType === DATA_TYPE_NUMBER;
    }
}

/**
 * Raw material form. Like the product form, without brand, variants or SKUs. The user adds the attributes that
 * describe the raw material and gives each one value - a list attribute too. When the category has attributes
 * assigned, only those can be added (picking the category adds their rows), and a list attribute offers only
 * the values the category allows; a category without any leaves every attribute open.
 */
@Component({
    selector: 'raw-material-details',
    templateUrl: './details.component.html',
    animations: fuseAnimations,
    encapsulation: ViewEncapsulation.None
})
export class RawMaterialDetailsComponent implements OnInit, OnDestroy {
    isLoading: boolean = false;
    isSaving: boolean = false;
    errorMessage: string = null;

    rawMaterial: RawMaterial = null;
    statuses: Array<any> = [];
    categories: Array<RawMaterialCategory> = [];
    units: Array<Units> = [];
    accounts: Array<AccountOption> = [];
    form: FormGroup;
    categoryFilter: FormControl = new FormControl('');
    /** The attribute picker: picking one adds its row, then the picker clears. */
    attributePicker: FormControl = new FormControl(null);
    attributeFilter: FormControl = new FormControl('');

    lines: Array<AttributeLine> = [];
    /** The selected category's attributes with their allowed value ids (empty: any value); null when it has none. */
    categoryAttributes: Map<number, Array<number>> = null;

    private allAttributes: Array<Attribute> = [];
    /** Ids of categories that have sub-categories - a raw material can only be put in a leaf category. */
    private parentCategoryIds = new Set<number>();
    private valuesByAttribute = new Map<number, Array<AttributeValue>>();
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private service: RawMaterialService,
        private _categoryService: RawMaterialCategoryService,
        private _productCategoryService: ProductCategoryService,
        private _productService: ProductService,
        private _attributeService: AttributeService,
        private _goodsService: GoodsService,
        private _formBuilder: FormBuilder,
        private _snackBar: MatSnackBar,
        private route: ActivatedRoute,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    ngOnInit(): void {
        this.form = this._formBuilder.group({
            code: [null, [Validators.required, Validators.maxLength(38)]],
            name: [null, [Validators.required, Validators.maxLength(100)]],
            category: [null, [Validators.required, this.leafCategoryValidator]],
            technicalNumber: [null, Validators.maxLength(20)],
            unit: [null],
            account: [null],
            status: [null],
            attributes: this._formBuilder.array([]),
        });
        this.attributePicker.valueChanges.pipe(takeUntil(this._unsubscribeAll)).subscribe(attributeId => {
            if (!attributeId)
                return;
            this.addAttribute(attributeId);
            this.attributePicker.setValue(null, { emitEvent: false });
        });
        this.form.controls['category'].valueChanges.pipe(takeUntil(this._unsubscribeAll)).subscribe(() => {
            this.updateCategoryAttributes();
            this.applyCategoryAttributes();
        });

        this.route.paramMap.pipe(takeUntil(this._unsubscribeAll)).subscribe(params => {
            const id = Number(params.get('id'));
            this.loadData(id > 0 ? id : null);
        });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    get isNew(): boolean {
        return !this.rawMaterial;
    }

    get filteredCategories(): Array<RawMaterialCategory> {
        const term = (this.categoryFilter.value || '').trim().toLowerCase();
        return !term ? this.categories : this.categories.filter(x =>
            (x.fullCode || '').toLowerCase().includes(term) || (x.fullName || '').toLowerCase().includes(term));
    }

    isLeafCategory(category: RawMaterialCategory): boolean {
        return !this.parentCategoryIds.has(category.rawMaterialCategoryId);
    }

    /**
     * What the attribute picker offers: attributes not added yet, matching the search - the category's attributes
     * when it has any, else every active attribute.
     */
    get attributeOptions(): Array<Attribute> {
        const added = new Set(this.lines.map(x => x.attributeId));
        const allowed = this.categoryAttributes;
        const term = (this.attributeFilter.value || '').trim().toLowerCase();
        return this.allAttributes.filter(x => !added.has(x.attributeId) &&
            (allowed ? allowed.has(x.attributeId) : x.status === RAW_MATERIAL_STATUS_ACTIVE) &&
            (!term || (x.attributeCode || '').toLowerCase().includes(term) || (x.attributeName || '').toLowerCase().includes(term)));
    }

    /** The values a LIST row offers: the category's allowed ones when it limits them, else all of them. */
    allowedValues(line: AttributeLine): Array<AttributeValue> {
        const allowed = this.categoryAttributes && this.categoryAttributes.get(line.attributeId);
        return allowed && allowed.length ? line.values.filter(v => allowed.includes(v.attributeValueId)) : line.values;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Data
    // -----------------------------------------------------------------------------------------------------

    private loadData(id: number): void {
        this.isLoading = true;
        this.errorMessage = null;
        forkJoin([
            this.service.getStatuses(),
            this._categoryService.getAllCategories(),
            this._productCategoryService.getAttributes(),
            // Unit and account are optional: the form still works without their lists.
            this._attributeService.getUnits().pipe(catchError(() => of([]))),
            this._goodsService.getAccounts().pipe(catchError(() => of([]))),
            id ? this.service.getRawMaterial(id) : of(null),
        ])
            .pipe(takeUntil(this._unsubscribeAll), finalize(() => this.stopLoading()))
            .subscribe(([statuses, categories, attributes, units, accounts, rawMaterial]) => {
                this.statuses = statuses || [];
                this.categories = categories || [];
                this.parentCategoryIds = new Set(this.categories.filter(x => x.parentId).map(x => x.parentId));
                this.allAttributes = attributes || [];
                this.units = units || [];
                this.accounts = accounts || [];
                this.rawMaterial = rawMaterial;
                this.fillForm(rawMaterial);
            }, error => this.errorMessage = this.service.errorMessage(error));
    }

    private fillForm(rawMaterial: RawMaterial): void {
        const defaultStatus = this.statuses.find(x => x.isDefault === 1);
        this.form.reset({
            code: rawMaterial ? rawMaterial.rawMaterialCode : null,
            name: rawMaterial ? rawMaterial.rawMaterialName : null,
            category: rawMaterial ? rawMaterial.categoryId : null,
            technicalNumber: rawMaterial ? rawMaterial.technicalNumber : null,
            unit: rawMaterial ? rawMaterial.unitId : null,
            account: rawMaterial ? rawMaterial.accountId : null,
            status: rawMaterial ? rawMaterial.status : defaultStatus ? defaultStatus.statusId : null,
        }, { emitEvent: false });
        this.updateCategoryAttributes();
        // A raw material stored on a category that has since got sub-categories: show the error straight away.
        if (this.form.controls['category'].hasError('notLeaf'))
            this.form.controls['category'].markAsTouched();

        // One row per attribute; should the backend hold several list values for one, the first is kept.
        const lines: Array<AttributeLine> = [];
        ((rawMaterial && rawMaterial.attributeValues) || []).forEach(v => {
            if (lines.some(x => x.attributeId === v.attributeId))
                return;
            const line = this.createLine(v.attributeId, v.attributeCode, v.attributeName, v.dataType);
            line.form.reset({ valueId: v.valueId ?? null, valueNum: v.valueNum ?? null, valueText: v.valueText ?? null });
            lines.push(line);
        });
        this.setLines(lines);
        this.form.markAsPristine();
    }

    /** Arrow function so `this` is the component when the form calls it. */
    private leafCategoryValidator = (control: AbstractControl): ValidationErrors | null =>
        control.value && this.parentCategoryIds.has(control.value) ? { notLeaf: true } : null;

    // -----------------------------------------------------------------------------------------------------
    // @ Attributes
    // -----------------------------------------------------------------------------------------------------

    addAttribute(attributeId: number): void {
        if (this.lines.some(x => x.attributeId === attributeId))
            return;
        const line = this.createLine(attributeId);
        this.setLines([...this.lines, line]);
        this.form.markAsDirty();
    }

    removeAttribute(line: AttributeLine): void {
        this.setLines(this.lines.filter(x => x !== line));
        this.form.markAsDirty();
    }

    private updateCategoryAttributes(): void {
        const category = this.categories.find(x => x.rawMaterialCategoryId === this.form.controls['category'].value);
        this.categoryAttributes = category && category.attributes && category.attributes.length
            ? new Map(category.attributes.map(a => [a.attributeId, a.attributeValueIds || []] as [number, Array<number>]))
            : null;
    }

    /**
     * After the user picks a category with attributes: rows of attributes it doesn't have are dropped, a list
     * value it doesn't allow is cleared, and a row is added for each of its attributes not shown yet.
     */
    private applyCategoryAttributes(): void {
        const allowed = this.categoryAttributes;
        if (!allowed)
            return;
        const kept = this.lines.filter(x => allowed.has(x.attributeId));
        kept.forEach(line => {
            const values = allowed.get(line.attributeId);
            const valueId = line.form.controls['valueId'].value;
            if (line.isList && valueId != null && values.length && !values.includes(valueId))
                line.form.controls['valueId'].setValue(null);
        });
        const shown = new Set(kept.map(x => x.attributeId));
        const added = Array.from(allowed.keys()).filter(id => !shown.has(id)).map(id => this.createLine(id));
        this.setLines([...kept, ...added]);
    }

    /** The row of an attribute, described from the attribute list (the stored names are the fallback). */
    private createLine(attributeId: number, code: string = null, name: string = null, dataType: string = null): AttributeLine {
        const attribute = this.allAttributes.find(x => x.attributeId === attributeId);
        const line = new AttributeLine();
        line.attributeId = attributeId;
        line.attributeCode = attribute ? attribute.attributeCode : code;
        line.attributeName = attribute ? attribute.attributeName : name || '#' + attributeId;
        line.dataType = attribute ? attribute.dataType : dataType;
        line.unitName = attribute ? attribute.unitName : null;
        line.form = this._formBuilder.group({
            valueId: [null],
            valueNum: [null],
            valueText: [null, Validators.maxLength(4000)],
        });
        return line;
    }

    private setLines(lines: Array<AttributeLine>): void {
        this.lines = lines;
        const array = this.form.controls['attributes'] as FormArray;
        array.clear();
        lines.forEach(line => array.push(line.form));
        this.loadListValues(lines);
        this.cdr.detectChanges();
    }

    /** Loads the values of every LIST attribute shown, once each. */
    private loadListValues(lines: Array<AttributeLine>): void {
        const done = () => {
            lines.forEach(line => line.values = this.valuesByAttribute.get(line.attributeId) || []);
            this.cdr.detectChanges();
        };
        const missing = lines.filter(x => x.isList && !this.valuesByAttribute.has(x.attributeId)).map(x => x.attributeId);
        if (!missing.length) {
            done();
            return;
        }
        forkJoin(missing.map(id => this._productService.getAttributeValues(id).pipe(
            catchError(() => of([])), map(values => [id, values] as [number, Array<AttributeValue>]))))
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(pairs => {
                pairs.forEach(([id, values]) => this.valuesByAttribute.set(id, values));
                done();
            });
    }

    /** The values entered, one per attribute, in the column its data type uses; rows left empty are not sent. */
    private attributeValues(): Array<RawMaterialAttributeValueInput> {
        const entries: Array<RawMaterialAttributeValueInput> = [];
        this.lines.forEach(line => {
            const value = line.form.getRawValue();
            if (line.isList && value.valueId != null)
                entries.push({ attributeId: line.attributeId, valueId: value.valueId });
            else if (line.isNumber && value.valueNum !== '' && value.valueNum != null)
                entries.push({ attributeId: line.attributeId, valueNum: Number(value.valueNum) });
            else if (!line.isList && !line.isNumber && (value.valueText || '').trim())
                entries.push({ attributeId: line.attributeId, valueText: value.valueText.trim() });
        });
        return entries;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Save
    // -----------------------------------------------------------------------------------------------------

    save(): void {
        this.errorMessage = null;
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.errorMessage = 'There is at least one unfilled element! Please fill all the required elements.';
            return;
        }

        const controls = this.form.controls;
        const rawMaterial = new RawMaterial();
        rawMaterial.rawMaterialId = this.rawMaterial ? this.rawMaterial.rawMaterialId : null;
        rawMaterial.rawMaterialCode = (controls['code'].value || '').trim();
        rawMaterial.rawMaterialName = (controls['name'].value || '').trim();
        rawMaterial.categoryId = controls['category'].value;
        rawMaterial.technicalNumber = (controls['technicalNumber'].value || '').trim() || null;
        rawMaterial.unitId = controls['unit'].value || null;
        rawMaterial.accountId = controls['account'].value || null;
        rawMaterial.status = controls['status'].value;
        rawMaterial.attributeValues = <any>this.attributeValues();

        const isNew = !rawMaterial.rawMaterialId;
        this.isSaving = true;
        (isNew ? this.service.createRawMaterial(rawMaterial) : this.service.editRawMaterial(rawMaterial))
            .pipe(takeUntil(this._unsubscribeAll), finalize(() => {
                this.isSaving = false;
                this.cdr.detectChanges();
            }))
            .subscribe(saved => {
                this._snackBar.open(isNew ? 'Raw material registered successfully.' : 'Raw material updated successfully.', null, { duration: 3000 });
                if (isNew) {
                    this.router.navigate(['../details', saved.rawMaterialId], { relativeTo: this.route, replaceUrl: true });
                    return;
                }
                this.rawMaterial = saved;
                this.fillForm(saved);
            }, error => this.errorMessage = this.service.errorMessage(error));
    }

    cancel(): void {
        this.errorMessage = null;
        this.fillForm(this.rawMaterial);
    }

    private stopLoading(): void {
        this.isLoading = false;
        this.cdr.detectChanges();
    }
}
