import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslocoService } from '@ngneat/transloco';
import { forkJoin, merge, Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, finalize, map, takeUntil } from 'rxjs/operators';
import { fuseAnimations } from '../../../../../@fuse/animations';
import { Attribute, AttributeValue } from '../../attribute/attribute.types';
import { ProductCategoryService } from '../../product-category/product-category.service';
import { ProductCategory } from '../../product-category/product-category.types';
import { ProductService } from '../product.service';
import {
    Brand,
    DATA_TYPE_LIST,
    DATA_TYPE_NUMBER,
    Product,
    ProductAttributeValueInput,
    ProductVariant,
    combinationKey,
    MAX_VARIANTS,
    PRODUCT_STATUS_ACTIVE,
    ProductVariantSkuUsage,
    suggestedSku
} from '../product.types';
import { VariantAttribute, VariantDialogComponent, VariantDialogData } from '../variant-dialog/variant-dialog.component';
import { BrandDialogComponent, BrandDialogData } from '../brand-dialog/brand-dialog.component';

/** One attribute of the product's main category, as a row of the product form. */
export class AttributeLine {
    attributeId: number;
    attributeCode: string;
    attributeName: string;
    dataType: string;
    unitName: string;
    /** The selectable values of a LIST attribute. */
    values: Array<AttributeValue> = [];
    /** valueIds (a LIST attribute can have several values - they make the variants), valueNum, valueText. */
    form: FormGroup;

    get isList(): boolean {
        return this.dataType === DATA_TYPE_LIST;
    }

    get isNumber(): boolean {
        return this.dataType === DATA_TYPE_NUMBER;
    }
}

/** One combination the product's list values make, with the SKU its variant gets (or has). */
export class SkuRow {
    /** The backend's combination key - matches an existing variant's. */
    key: string;
    valueIds: Array<number> = [];
    /** "Colour: Red · Size: M" - empty for the plain variant. */
    text: string;
    sku: string;
    /** The user typed this SKU - a new code no longer changes it. */
    edited: boolean = false;
    /** The variant this combination already has, if any. */
    variant: ProductVariant = null;
    /** Where the SKU is already used, from the last check. */
    conflict: string = null;
    checking: boolean = false;
}

/**
 * Product form. The main category decides the attributes. A list attribute can be given several values; the
 * backend makes one variant (SKU) per combination of the selected list values when the product is saved - Red,
 * Blue x Cotton, Linen gives 4 - and keeps them in line on every save. A number or text attribute has one value,
 * shared by all variants. The Variants tab lists the generated SKUs (SKU, barcode and status can be changed).
 */
@Component({
    selector: 'product-details',
    templateUrl: './details.component.html',
    animations: fuseAnimations,
    encapsulation: ViewEncapsulation.None
})
export class ProductDetailsComponent implements OnInit, OnDestroy {
    readonly statusActive = PRODUCT_STATUS_ACTIVE;

    isLoading: boolean = false;
    isSaving: boolean = false;
    loadingAttributes: boolean = false;
    errorMessage: string = null;
    selectedTab: number = 0;

    product: Product = null;
    statuses: Array<any> = [];
    categories: Array<ProductCategory> = [];
    brands: Array<Brand> = [];
    productForm: FormGroup;
    categoryFilter: FormControl = new FormControl('');
    brandFilter: FormControl = new FormControl('');

    lines: Array<AttributeLine> = [];
    /** Attributes the product had that its (new) main category doesn't have - they are dropped on save. */
    droppedAttributeNames: Array<string> = [];

    variants: Array<ProductVariant> = [];
    /** One row per combination the current selections make, with its SKU - sent with the product on save. */
    skuRows: Array<SkuRow> = [];
    private skuCheck$: Subject<void> = new Subject<void>();

    private allAttributes: Array<Attribute> = [];
    /** Ids of categories that have sub-categories - a product can only be put in a leaf category. */
    private parentCategoryIds = new Set<number>();
    private valuesByAttribute = new Map<number, Array<AttributeValue>>();
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private service: ProductService,
        private _categoryService: ProductCategoryService,
        private _formBuilder: FormBuilder,
        private _matDialog: MatDialog,
        private _snackBar: MatSnackBar,
        private route: ActivatedRoute,
        private router: Router,
        private cdr: ChangeDetectorRef,
        private _translocoService: TranslocoService
    ) {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    ngOnInit(): void {
        this.productForm = this._formBuilder.group({
            code: [null, [Validators.required, Validators.maxLength(20)]],
            name: [null, [Validators.required, Validators.maxLength(200)]],
            category: [null, [Validators.required, this.leafCategoryValidator]],
            brand: [null, Validators.required],
            status: [null],
            attributes: this._formBuilder.array([]),
        });
        this.productForm.controls['category'].valueChanges
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(categoryId => this.loadCategoryAttributes(categoryId));
        // The suggested SKUs follow the product code (and the name when there is no code).
        merge(this.productForm.controls['code'].valueChanges, this.productForm.controls['name'].valueChanges)
            .pipe(takeUntil(this._unsubscribeAll), debounceTime(150))
            .subscribe(() => this.rebuildSkuRows());
        // A short pause after the rows change, then check all their SKUs at once.
        this.skuCheck$
            .pipe(takeUntil(this._unsubscribeAll), debounceTime(400))
            .subscribe(() => this.checkSkus(this.skuRows));

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
        return !this.product;
    }

    get titleInfo(): string {
        return this.product ? this.product.productName : null;
    }

    get filteredCategories(): Array<ProductCategory> {
        const term = (this.categoryFilter.value || '').trim().toLowerCase();
        return !term ? this.categories : this.categories.filter(x =>
            (x.fullCode || '').toLowerCase().includes(term) || (x.fullName || '').toLowerCase().includes(term));
    }

    isLeafCategory(category: ProductCategory): boolean {
        return !this.parentCategoryIds.has(category.productCategoryId);
    }

    get filteredBrands(): Array<Brand> {
        const term = (this.brandFilter.value || '').trim().toLowerCase();
        return !term ? this.brands : this.brands.filter(x =>
            (x.brandName || '').toLowerCase().includes(term) || (x.brandCode || '').toLowerCase().includes(term));
    }

    get activeVariantCount(): number {
        return this.variants.filter(x => x.status === PRODUCT_STATUS_ACTIVE).length;
    }

    /** How many variants the current selections make - every list attribute with values multiplies them. */
    get combinationCount(): number {
        return this.lines
            .filter(line => line.isList)
            .map(line => (line.form.controls['valueIds'].value || []).length)
            .filter(count => count > 0)
            .reduce((total, count) => total * count, 1);
    }

    get tooManyCombinations(): boolean {
        return this.combinationCount > MAX_VARIANTS;
    }

    /** The variant attributes as stored - what variants are made of (not the unsaved form). */
    get savedVariantAttributes(): Array<VariantAttribute> {
        const ids = (this.product && this.product.variantAttributeIds) || [];
        return ids.map(id => {
            const attribute = this.allAttributes.find(x => x.attributeId === id);
            return <VariantAttribute>{
                attributeId: id,
                attributeName: attribute ? attribute.attributeName : '#' + id,
                values: this.valuesByAttribute.get(id) || []
            };
        });
    }

    get savedVariantAttributeNames(): string {
        return this.savedVariantAttributes.map(x => x.attributeName).join(', ');
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
            this.service.getBrands(),
            this._categoryService.getAttributes(),
            id ? this.service.getProduct(id) : of(null),
            id ? this.service.getVariants(id) : of([]),
        ])
            .pipe(takeUntil(this._unsubscribeAll), finalize(() => this.stopLoading()))
            .subscribe(([statuses, categories, brands, attributes, product, variants]) => {
                this.statuses = statuses || [];
                this.categories = categories || [];
                this.parentCategoryIds = new Set(this.categories.filter(x => x.parentId).map(x => x.parentId));
                this.brands = brands || [];
                this.allAttributes = attributes || [];
                this.variants = variants || [];
                this.product = product;
                this.fillForm(product);
                if (this.route.snapshot.queryParamMap.get('tab') === 'variants' && product)
                    this.selectedTab = 1;
            }, error => this.errorMessage = this.service.errorMessage(error));
    }

    private fillForm(product: Product): void {
        const defaultStatus = this.statuses.find(x => x.isDefault === 1);
        this.productForm.reset({
            code: product ? product.productCode : null,
            name: product ? product.productName : null,
            category: product ? product.categoryId : null,
            brand: product ? product.brandId : null,
            status: product ? product.status : defaultStatus ? defaultStatus.statusId : null,
        }, { emitEvent: false });
        // A product stored on a category that has since got sub-categories: show the error straight away.
        if (this.productForm.controls['category'].hasError('notLeaf'))
            this.productForm.controls['category'].markAsTouched();
        this.loadCategoryAttributes(product ? product.categoryId : null, product);
    }

    /** Arrow function so `this` is the component when the form calls it. */
    private leafCategoryValidator = (control: AbstractControl): ValidationErrors | null =>
        control.value && this.parentCategoryIds.has(control.value) ? { notLeaf: true } : null;

    /**
     * Builds one row per attribute of the main category, keeping what was entered for an attribute the
     * previous category had too (or, for a loaded product, its stored values).
     */
    private loadCategoryAttributes(categoryId: number, stored: Product = null): void {
        const previous = new Map<number, any>(this.lines.map(x => [x.attributeId, x.form.getRawValue()] as [number, any]));
        if (stored) {
            previous.clear();
            // A LIST attribute comes back as one row per selected value - gather them per attribute.
            (stored.attributeValues || []).forEach(v => {
                const entry = previous.get(v.attributeId) || { valueIds: [] };
                if (v.valueId != null)
                    entry.valueIds = [...entry.valueIds, v.valueId];
                entry.valueNum = v.valueNum;
                entry.valueText = v.valueText;
                previous.set(v.attributeId, entry);
            });
        }
        if (!categoryId) {
            this.setLines([], previous, stored);
            return;
        }
        this.loadingAttributes = true;
        this.service.getCategoryAttributes(categoryId)
            .pipe(takeUntil(this._unsubscribeAll), finalize(() => {
                this.loadingAttributes = false;
                this.cdr.detectChanges();
            }))
            .subscribe(rows => {
                const lines = rows.map(row => {
                    const attribute = this.allAttributes.find(x => x.attributeId === row.attributeId);
                    const line = new AttributeLine();
                    line.attributeId = row.attributeId;
                    line.attributeCode = row.attributeCode || (attribute && attribute.attributeCode);
                    line.attributeName = row.attributeName || (attribute && attribute.attributeName);
                    line.dataType = attribute ? attribute.dataType : null;
                    line.unitName = attribute ? attribute.unitName : null;
                    return line;
                });
                this.setLines(lines, previous, stored);
                this.loadListValues(lines);
            }, error => this.errorMessage = this.service.errorMessage(error));
    }

    private setLines(lines: Array<AttributeLine>, previous: Map<number, any>, stored: Product): void {
        lines.forEach(line => {
            const before = previous.get(line.attributeId) || {};
            line.form = this._formBuilder.group({
                valueIds: [before.valueIds ? [...before.valueIds] : []],
                valueNum: [before.valueNum ?? null],
                valueText: [before.valueText ?? null, Validators.maxLength(4000)],
            });
            if (line.isList)
                line.form.controls['valueIds'].valueChanges.pipe(takeUntil(this._unsubscribeAll)).subscribe(() => this.rebuildSkuRows());
        });
        const kept = new Set(lines.map(x => x.attributeId));
        this.droppedAttributeNames = stored || this.lines.length ? Array.from(previous.keys())
            .filter(id => !kept.has(id) && this.hasEntry(previous.get(id)))
            .map(id => (this.allAttributes.find(x => x.attributeId === id) || <Attribute>{ attributeName: '#' + id }).attributeName)
            : [];
        this.lines = lines;
        const array = this.productForm.controls['attributes'] as FormArray;
        array.clear();
        lines.forEach(line => array.push(line.form));
        this.rebuildSkuRows();
        this.cdr.detectChanges();
    }

    /** Loads the values of every LIST attribute shown (and of the stored variant attributes), once each. */
    private loadListValues(lines: Array<AttributeLine>): void {
        const ids = new Set<number>(lines.filter(x => x.isList).map(x => x.attributeId));
        ((this.product && this.product.variantAttributeIds) || []).forEach(id => ids.add(id));
        const missing = Array.from(ids).filter(id => !this.valuesByAttribute.has(id));
        const done = () => {
            lines.forEach(line => line.values = this.valuesByAttribute.get(line.attributeId) || []);
            // The values' names and short codes are known now - the rows' texts and suggestions too.
            this.rebuildSkuRows();
            this.cdr.detectChanges();
        };
        if (!missing.length) {
            done();
            return;
        }
        forkJoin(missing.map(id => this.service.getAttributeValues(id).pipe(
            catchError(() => of([])), map(values => [id, values] as [number, Array<AttributeValue>]))))
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(pairs => {
                pairs.forEach(([id, values]) => this.valuesByAttribute.set(id, values));
                done();
            });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Save
    // -----------------------------------------------------------------------------------------------------

    save(): void {
        this.errorMessage = null;
        if (this.productForm.invalid) {
            this.productForm.markAllAsTouched();
            this.errorMessage = 'There is at least one unfilled element! Please fill all the required elements.';
            return;
        }
        if (this.tooManyCombinations || this.hasSkuErrors)
            return;
        // A last check of every SKU right before saving - the server checks again anyway.
        const rows = this.skuRows;
        if (rows.length) {
            this.isSaving = true;
            this.checkSkus(rows, () => {
                this.isSaving = false;
                if (!this.hasSkuErrors)
                    this.saveNow();
                else
                    this.cdr.detectChanges();
            });
            return;
        }
        this.saveNow();
    }

    private saveNow(): void {
        const controls = this.productForm.controls;
        const product = new Product();
        product.productId = this.product ? this.product.productId : null;
        product.productCode = (controls['code'].value || '').trim();
        product.productName = (controls['name'].value || '').trim();
        product.categoryId = controls['category'].value;
        product.brandId = controls['brand'].value;
        product.status = controls['status'].value;
        // No variant attributes: the server takes them from the list attributes that have values.
        product.attributeValues = <any>this.attributeValues();
        product.variantSkus = this.skuRows.map(row => ({ attributeValueIds: row.valueIds, sku: (row.sku || '').trim() }));

        const isNew = !product.productId;
        this.isSaving = true;
        (isNew ? this.service.createProduct(product) : this.service.editProduct(product))
            .pipe(takeUntil(this._unsubscribeAll), finalize(() => {
                this.isSaving = false;
                this.cdr.detectChanges();
            }))
            .subscribe(saved => {
                this._snackBar.open(isNew ? 'Product registered successfully.' : 'Product updated successfully.', null, { duration: 3000 });
                if (isNew) {
                    // Show the variants the save generated.
                    this.router.navigate(['../details', saved.productId], {
                        relativeTo: this.route, queryParams: { tab: 'variants' }, replaceUrl: true
                    });
                    return;
                }
                this.product = saved;
                this.fillForm(saved);
                this.reloadVariants();
            }, error => this.errorMessage = this.service.errorMessage(error));
    }

    // -----------------------------------------------------------------------------------------------------
    // @ SKUs
    // -----------------------------------------------------------------------------------------------------

    /**
     * One row per combination of the selected list values (a single plain row when there are none). A row keeps
     * a SKU the user typed; otherwise it shows its variant's SKU, or - for a new combination - the suggestion.
     */
    rebuildSkuRows(): void {
        if (!this.productForm || this.tooManyCombinations || (!this.lines.length && !this.productForm.controls['category'].value)) {
            this.skuRows = [];
            return;
        }
        const listLines = this.lines.filter(line => line.isList && (line.form.controls['valueIds'].value || []).length);
        const lists = listLines.map(line => (line.form.controls['valueIds'].value as Array<number>).map(id =>
            line.values.find(v => v.attributeValueId === id) || <AttributeValue>{ attributeValueId: id, attributeValue: '#' + id }));
        let combinations: Array<Array<AttributeValue>> = [[]];
        lists.forEach(list => {
            const next: Array<Array<AttributeValue>> = [];
            combinations.forEach(prefix => list.forEach(value => next.push([...prefix, value])));
            combinations = next;
        });

        const previous = new Map(this.skuRows.map(row => [row.key, row] as [string, SkuRow]));
        const variantByKey = new Map<string, ProductVariant>();
        this.variants.forEach(v => {
            const kept = variantByKey.get(v.combinationKey);
            if (!kept || (kept.status !== PRODUCT_STATUS_ACTIVE && v.status === PRODUCT_STATUS_ACTIVE))
                variantByKey.set(v.combinationKey, v);
        });
        this.skuRows = combinations.map(values => {
            const row = new SkuRow();
            row.valueIds = values.map(v => v.attributeValueId);
            row.key = combinationKey(values.map((v, i) => ({ attributeId: listLines[i].attributeId, valueId: v.attributeValueId })));
            row.text = values.map((v, i) => listLines[i].attributeName + ': ' + v.attributeValue).join(' · ');
            row.variant = variantByKey.get(row.key) || null;
            const before = previous.get(row.key);
            row.edited = !!before && before.edited;
            row.sku = row.edited ? before.sku : row.variant ? row.variant.sku : this.suggestionFor(values);
            row.conflict = before && before.sku === row.sku ? before.conflict : null;
            return row;
        });
        this.skuCheck$.next();
    }

    trackSkuRow(index: number, row: SkuRow): string {
        return row.key;
    }

    /** Leaving a SKU box: keep what was typed and check it. */
    onSkuBlur(row: SkuRow): void {
        row.sku = (row.sku || '').trim();
        row.edited = row.sku !== this.defaultSku(row);
        row.conflict = null;
        this.checkSkus([row]);
    }

    /** Back to the variant's SKU, or the suggestion for a new combination. */
    resetSku(row: SkuRow): void {
        row.edited = false;
        row.sku = this.defaultSku(row);
        row.conflict = null;
        this.checkSkus([row]);
    }

    /** Several rows with the same SKU (compared in upper case, like the database). */
    isDuplicateSku(row: SkuRow): boolean {
        const sku = (row.sku || '').trim().toUpperCase();
        return !!sku && this.skuRows.filter(r => (r.sku || '').trim().toUpperCase() === sku).length > 1;
    }

    get hasSkuErrors(): boolean {
        return this.skuRows.some(row => !(row.sku || '').trim() || (row.sku || '').trim().length > 50 || this.isDuplicateSku(row) || !!row.conflict);
    }

    /** Active variants the save will deactivate: their combination isn't among the rows any more. */
    get variantsToDeactivate(): number {
        const keys = new Set(this.skuRows.map(row => row.key));
        return this.variants.filter(v => v.status === PRODUCT_STATUS_ACTIVE && !keys.has(v.combinationKey)).length;
    }

    get newSkuRowCount(): number {
        return this.skuRows.filter(row => !row.variant).length;
    }

    /**
     * Asks the backend which variants already use these rows' SKUs. A SKU is taken when another product uses it,
     * or another combination of this product does - unless that combination gets another SKU in this save.
     */
    private checkSkus(rows: Array<SkuRow>, done: () => void = null): void {
        const toCheck = rows.filter(row => (row.sku || '').trim());
        if (!toCheck.length) {
            if (done)
                done();
            return;
        }
        toCheck.forEach(row => row.checking = true);
        const productId = this.product ? this.product.productId : null;
        this.service.checkSkus(Array.from(new Set(toCheck.map(row => row.sku.trim()))))
            .pipe(takeUntil(this._unsubscribeAll), finalize(() => {
                toCheck.forEach(row => row.checking = false);
                this.cdr.detectChanges();
                if (done)
                    done();
            }))
            .subscribe(usages => {
                toCheck.forEach(row => {
                    const sku = row.sku.trim().toUpperCase();
                    const taken = usages.find(u => (u.sku || '').trim().toUpperCase() === sku && !this.isOwnOrFreed(u, row, productId));
                    row.conflict = taken ? this.describeUsage(taken, productId) : null;
                });
            }, () => {
                // The check couldn't run - the server checks on save anyway.
            });
    }

    private isOwnOrFreed(usage: ProductVariantSkuUsage, row: SkuRow, productId: number): boolean {
        if (!productId || usage.productId !== productId)
            return false;
        if (usage.combinationKey === row.key)
            return true;
        const other = this.skuRows.find(r => r.key === usage.combinationKey);
        return !!other && (other.sku || '').trim().toUpperCase() !== (usage.sku || '').trim().toUpperCase();
    }

    private describeUsage(usage: ProductVariantSkuUsage, productId: number): string {
        if (productId && usage.productId === productId)
            return this._translocoService.translate('inventory.skuUsedByOtherCombination');
        const product = (usage.productCode ? usage.productCode + ' - ' : '') + (usage.productName || '#' + usage.productId);
        return this._translocoService.translate('inventory.skuUsedBy') + ' ' + product;
    }

    private defaultSku(row: SkuRow): string {
        if (row.variant)
            return row.variant.sku;
        const values = row.valueIds.map(id => {
            for (const list of Array.from(this.valuesByAttribute.values())) {
                const value = list.find(v => v.attributeValueId === id);
                if (value)
                    return value;
            }
            return <AttributeValue>{ attributeValueId: id, attributeValue: '#' + id };
        });
        return this.suggestionFor(values);
    }

    private suggestionFor(values: Array<AttributeValue>): string {
        return suggestedSku({
            productId: this.product ? this.product.productId : null,
            productCode: this.productForm.controls['code'].value,
            productName: this.productForm.controls['name'].value
        }, values);
    }

    cancel(): void {
        this.errorMessage = null;
        this.fillForm(this.product);
    }

    /**
     * The values entered, in the column each data type uses: one entry per selected value of a LIST attribute
     * (the backend stores a row for each and makes the variants from them), one entry for a NUMBER or TEXT one.
     */
    private attributeValues(): Array<ProductAttributeValueInput> {
        const entries: Array<ProductAttributeValueInput> = [];
        this.lines
            .forEach(line => {
                const value = line.form.getRawValue();
                if (line.isList)
                    (value.valueIds || []).forEach((valueId: number) => entries.push({ attributeId: line.attributeId, valueId: valueId }));
                else if (line.isNumber && value.valueNum !== '' && value.valueNum != null)
                    entries.push({ attributeId: line.attributeId, valueNum: Number(value.valueNum) });
                else if (!line.isList && !line.isNumber && (value.valueText || '').trim())
                    entries.push({ attributeId: line.attributeId, valueText: value.valueText.trim() });
            });
        return entries;
    }

    /** "Red, Blue" for the selected values of a LIST attribute row. */
    selectedValueNames(line: AttributeLine): string {
        const ids: Array<number> = line.form.controls['valueIds'].value || [];
        return ids.map(id => (line.values.find(v => v.attributeValueId === id) || <AttributeValue>{ attributeValue: '#' + id }).attributeValue)
            .join(', ');
    }

    private hasEntry(value: any): boolean {
        return !!value && ((value.valueIds || []).length > 0 || value.valueNum != null || !!value.valueText);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Brand
    // -----------------------------------------------------------------------------------------------------

    /** Adds a brand without leaving the form and selects it. */
    addBrand(name: string = null): void {
        const data: BrandDialogData = { name: name, brands: this.brands };
        this._matDialog.open(BrandDialogComponent, {
            data: data, width: '480px', maxWidth: '95vw', panelClass: 'product-brand-dialog', disableClose: true, autoFocus: true
        }).afterClosed().subscribe((brand: Brand) => {
            if (!brand)
                return;
            this.brands = [...this.brands, brand].sort((a, b) => (a.brandName || '').localeCompare(b.brandName || ''));
            const control = this.productForm.controls['brand'];
            control.setValue(brand.brandId);
            control.markAsDirty();
            this._snackBar.open('Brand "' + brand.brandName + '" added.', null, { duration: 3000 });
            this.cdr.detectChanges();
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Variants
    // -----------------------------------------------------------------------------------------------------

    /** "Colour: Red · Size: L" for a variant, from its value ids - also for an old variant of other attributes. */
    combinationText(variant: ProductVariant): string {
        const parts = [];
        for (const valueId of variant.attributeValueIds || []) {
            for (const [attributeId, values] of Array.from(this.valuesByAttribute.entries())) {
                const value = values.find(v => v.attributeValueId === valueId);
                if (value) {
                    const attribute = this.allAttributes.find(x => x.attributeId === attributeId);
                    parts.push((attribute ? attribute.attributeName : value.attributeName) + ': ' + value.attributeValue);
                    break;
                }
            }
        }
        return parts.join(' · ');
    }

    /** Changes a generated variant's SKU, barcode or status - its values come from the product's selections. */
    openVariant(variant: ProductVariant): void {
        const data: VariantDialogData = {
            product: this.product,
            variantAttributes: this.savedVariantAttributes,
            variants: this.variants,
            variant: variant,
            statuses: this.statuses
        };
        this._matDialog.open(VariantDialogComponent, {
            data: data, width: '640px', maxWidth: '95vw', panelClass: 'product-variant-dialog', disableClose: true, autoFocus: true
        }).afterClosed().subscribe(saved => {
            if (saved)
                this.reloadVariants();
        });
    }

    private reloadVariants(): void {
        this.service.getVariants(this.product.productId)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(variants => {
                this.variants = variants;
                this.rebuildSkuRows();
                this.cdr.detectChanges();
            }, error => this.errorMessage = this.service.errorMessage(error));
    }

    onTabChange(index: number): void {
        this.selectedTab = index;
    }

    private stopLoading(): void {
        this.isLoading = false;
        this.cdr.detectChanges();
    }
}
