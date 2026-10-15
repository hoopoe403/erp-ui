import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { forkJoin, Observable, of, Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { fuseAnimations } from "../../../../../@fuse/animations";
import { FuseAlertService } from '@fuse/components/alert';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OpResult } from 'app/core/type/result/result.types';
import { Paging } from 'app/core/type/paging/paging.type';
import { Units } from 'app/modules/configuration/measurement/unit/unit.types';
import { AttributeService } from "../attribute.service";
import { Attribute, AttributeValue, AttributeValueSearch, ATTRIBUTE_DATA_TYPES } from '../attribute.types';

@Component({
  selector: 'attribute-details',
  templateUrl: './details.component.html',
  animations: fuseAnimations,
  encapsulation: ViewEncapsulation.None
})
export class AttributeDetailsComponent implements OnInit, OnDestroy {
  id: number;
  pageType: string;
  titleInfo: string;
  isLoading: boolean = false;
  attributeInfo: Attribute = new Attribute();
  attributeForm: FormGroup;
  _result: OpResult = new OpResult();

  units: Array<Units> = [];
  statuses: Array<any> = [];
  dataTypes = ATTRIBUTE_DATA_TYPES;

  // Values tab
  values: Array<AttributeValue> = [];
  valueStatuses: Array<any> = [];
  valueForm: FormGroup;
  editingValue: AttributeValue = null;
  isValueLoading: boolean = false;
  /** Row briefly highlighted after it was added / edited (instead of a success message that shifts the list). */
  highlightedValueId: number = null;

  private _highlightTimer: any;
  private _unsubscribeAll: Subject<any> = new Subject<any>();

  constructor(
    private service: AttributeService,
    private _formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private _fuseAlertService: FuseAlertService,
    private _snackBar: MatSnackBar
  ) {
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  ngOnInit(): void {
    this.attributeForm = this._formBuilder.group({
      code: [null, [Validators.required, Validators.maxLength(50)]],
      name: [null, [Validators.required, Validators.maxLength(100)]],
      dataType: [null, [Validators.required]],
      unit: [null],
      status: [null],
    });
    this.valueForm = this._formBuilder.group({
      value: [null, [Validators.required, Validators.maxLength(100)]],
      sortOrder: [0, [Validators.min(0), Validators.max(99999)]],
      status: [null],
    });

    this.id = Number(this.route.snapshot.paramMap.get('id'));
    if (this.id > 0) {
      this.pageType = 'edit';
    }
    else {
      this.pageType = 'new';
      this.titleInfo = 'Register New Attribute';
    }
    this.loadData();
  }

  ngOnDestroy(): void {
    clearTimeout(this._highlightTimer);
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Attribute
  // -----------------------------------------------------------------------------------------------------

  private loadData(): void {
    this.isLoading = true;
    forkJoin([
      this.service.getUnits(),
      this.service.getStatuses(),
      this.service.getValueStatuses(),
      this.pageType === 'edit' ? this.service.getAttribute(this.id) : of(null),
    ])
      .pipe(takeUntil(this._unsubscribeAll), finalize(() => this.stopLoading()))
      .subscribe(([units, statuses, valueStatuses, attribute]) => {
        this.units = units || [];
        this.statuses = statuses || [];
        this.valueStatuses = valueStatuses || [];
        if (attribute) {
          this.setAttribute(attribute);
          this.loadValues();
        }
        this.resetValueForm();
      }, error => this.showResult(false, this.service.errorMessage(error)));
  }

  private setAttribute(attribute: Attribute): void {
    this.attributeInfo = attribute;
    this.titleInfo = attribute.attributeName;
    this.attributeForm.patchValue({
      code: attribute.attributeCode,
      name: attribute.attributeName,
      dataType: attribute.dataType,
      unit: attribute.unitId,
      status: attribute.status,
    });
  }

  private buildAttribute(): Attribute {
    const controls = this.attributeForm.controls;
    const attribute = new Attribute();
    attribute.attributeId = this.pageType === 'edit' ? this.id : null;
    attribute.attributeCode = controls['code'].value;
    attribute.attributeName = controls['name'].value;
    attribute.dataType = controls['dataType'].value;
    attribute.unitId = controls['unit'].value;
    attribute.status = controls['status'].value;
    return attribute;
  }

  save(): void {
    this.dismissAlert('successMessage');
    this.dismissAlert('errorMessage');
    if (this.attributeForm.invalid) {
      this.attributeForm.markAllAsTouched();
      this.showResult(false, 'There is at least one unfilled element! Please fill all the required elements.');
      return;
    }

    const attribute = this.buildAttribute();
    const request$: Observable<Attribute> = this.pageType === 'new'
      ? this.service.createAttribute(attribute)
      : this.service.editAttribute(attribute);

    this.isLoading = true;
    request$
      .pipe(takeUntil(this._unsubscribeAll), finalize(() => this.stopLoading()))
      .subscribe(saved => {
        const wasNew = this.pageType === 'new';
        this.setAttribute(saved);
        if (wasNew) {
          // Stay on the page as an edit of the new attribute, so its values can be added right away.
          this.id = saved.attributeId;
          this.pageType = 'edit';
          this.location.replaceState(
            this.router.createUrlTree(['../details', this.id], { relativeTo: this.route }).toString());
          this.loadValues();
        }
        this.showResult(true, wasNew ? 'Attribute registered successfully.' : 'Attribute updated successfully.');
      }, error => this.showResult(false, this.service.errorMessage(error)));
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Attribute values
  // -----------------------------------------------------------------------------------------------------

  /** Reloads the attribute's values and prepares the form for the next new value. */
  private loadValues(): void {
    const search = new AttributeValueSearch();
    search.attributeId = this.id;
    search.statusIdList = [];
    search.page = new Paging();
    search.page.flag = true;
    search.page.length = 0;
    search.page.pageNumber = 1;
    search.page.pageSize = 2000;
    search.page.sort = 'sortOrder';
    search.page.order = 'asc';

    this.isValueLoading = true;
    this.service.getAttributeValues(search)
      .pipe(takeUntil(this._unsubscribeAll), finalize(() => this.stopValueLoading()))
      .subscribe(res => {
        this.values = (res.attributeValues || [])
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.attributeValue.localeCompare(b.attributeValue));
        if (!this.editingValue)
          this.resetValueForm();
      }, error => this.showValueError(this.service.errorMessage(error)));
  }

  editValue(value: AttributeValue): void {
    this.editingValue = value;
    this.valueForm.reset({
      value: value.attributeValue,
      sortOrder: value.sortOrder ?? 0,
      status: value.status,
    });
  }

  resetValueForm(): void {
    this.editingValue = null;
    const nextSort = this.values.length > 0
      ? Math.max(...this.values.map(x => x.sortOrder ?? 0)) + 1
      : 0;
    const defaultStatus = this.valueStatuses.find(x => x.isDefault === 1);
    this.valueForm.reset({
      value: null,
      sortOrder: Math.min(nextSort, 99999),
      status: defaultStatus ? defaultStatus.statusId : null,
    });
  }

  saveValue(): void {
    if (this.valueForm.invalid) {
      // The fields show their own mat-error messages.
      this.valueForm.markAllAsTouched();
      return;
    }

    const controls = this.valueForm.controls;
    const value = new AttributeValue();
    value.attributeValueId = this.editingValue ? this.editingValue.attributeValueId : null;
    value.attributeId = this.id;
    value.attributeValue = controls['value'].value;
    value.sortOrder = controls['sortOrder'].value ?? 0;
    value.status = controls['status'].value;

    const isNew = !this.editingValue;
    const request$: Observable<AttributeValue> = isNew
      ? this.service.createAttributeValue(value)
      : this.service.editAttributeValue(value);

    this.isValueLoading = true;
    request$
      .pipe(takeUntil(this._unsubscribeAll), finalize(() => this.stopValueLoading()))
      .subscribe(saved => {
        this.highlightValue((saved && saved.attributeValueId) || value.attributeValueId);
        this.editingValue = null;
        this.loadValues();
      }, error => this.showValueError(this.service.errorMessage(error)));
  }

  trackByValue(index: number, item: AttributeValue): any {
    return item.attributeValueId || index;
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Helpers
  // -----------------------------------------------------------------------------------------------------

  private stopLoading(): void {
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  private stopValueLoading(): void {
    this.isValueLoading = false;
    this.cdr.detectChanges();
  }

  private showResult(succeed: boolean, message: string): void {
    this._result.succeed = succeed;
    this._result.message = message;
    this.cdr.detectChanges();
    this.showAlert(succeed ? 'successMessage' : 'errorMessage');
  }

  private highlightValue(id: number): void {
    clearTimeout(this._highlightTimer);
    this.highlightedValueId = id;
    this._highlightTimer = setTimeout(() => {
      this.highlightedValueId = null;
      this.cdr.detectChanges();
    }, 2000);
  }

  private showValueError(message: string): void {
    this._snackBar.open(message, 'OK', { duration: 5000, panelClass: 'bg-red-600' });
  }

  private showAlert(name: string): void {
    this._fuseAlertService.show(name);
  }

  private dismissAlert(name: string): void {
    this._fuseAlertService.dismiss(name);
  }
}
