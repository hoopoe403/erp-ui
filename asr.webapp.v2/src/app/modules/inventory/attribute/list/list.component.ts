import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { Subject, merge, Observable, forkJoin, fromEvent } from "rxjs";
import { debounceTime, switchMap, distinctUntilChanged, takeUntil, finalize } from "rxjs/operators";
import { FormControl, FormGroup } from "@angular/forms";
import { fuseAnimations } from "../../../../../@fuse/animations";
import { Paging } from "app/core/type/paging/paging.type";
import { Units } from "app/modules/configuration/measurement/unit/unit.types";
import { AttributeService } from "../attribute.service";
import { Attribute, AttributeSearch, ATTRIBUTE_DATA_TYPES } from "../attribute.types";

@Component({
  selector: "attribute-list",
  templateUrl: "./list.component.html",
  styles: [
    /* language=SCSS */
    `
      .attributes-grid {
        grid-template-columns: 100px auto 60px;

        @screen sm {
          grid-template-columns: 100px auto 100px 60px;
        }

        @screen lg {
          grid-template-columns: 120px auto 120px 140px 120px 60px;
        }
        @screen print {
          grid-template-columns: 120px auto 120px 140px 120px;
        }
      }
    `,
  ],
  animations: fuseAnimations,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributeListComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) private _paginator: MatPaginator;
  @ViewChild(MatSort) private _sort: MatSort;
  @ViewChild('filter') filter: ElementRef;

  pagination: Paging;
  searchInfo: AttributeSearch = new AttributeSearch();
  attributes: Array<Attribute> = [];
  allAttributes: Array<Attribute> = [];
  units: Array<Units> = [];
  statuses: Array<any> = [];
  dataTypes = ATTRIBUTE_DATA_TYPES;
  selectedInfoRow: Attribute = new Attribute();
  isLoading: boolean;
  errorMessage: string;

  frmAdvancedSearch = new FormGroup({
    code: new FormControl(),
    name: new FormControl(),
    dataType: new FormControl(),
    unit: new FormControl(),
    status: new FormControl(),
  });
  searchInputControl: FormControl = new FormControl();

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  constructor(
    private service: AttributeService,
    private _changeDetectorRef: ChangeDetectorRef
  ) {
  }

  get attributes$(): Observable<Attribute[]> {
    return this.service.attributes$;
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  ngOnInit(): void {
    this.isLoading = true;
    this.service.pagination$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((pagination: Paging) => {
        if (pagination)
          this.pagination = pagination;
        this._changeDetectorRef.markForCheck();
      });

    this.loadData();
  }

  ngAfterViewInit(): void {
    // #filter lives inside the *transloco embedded view, so it is only available after view init.
    fromEvent(this.filter.nativeElement, 'keyup')
      .pipe(
        takeUntil(this._unsubscribeAll),
        debounceTime(150),
        distinctUntilChanged()
      )
      .subscribe(() => this.applyQuickFilter());

    this.setPaginatorAndSort();
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
    this.service.disposeAttributes$();
    this.service.disposePaginator$();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Data
  // -----------------------------------------------------------------------------------------------------

  private loadData(): void {
    // Statuses first: the initial list is filtered by the default statuses.
    forkJoin([this.service.getStatuses(), this.service.getUnits()])
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(([statuses, units]) => {
        this.statuses = statuses || [];
        this.units = units || [];
        this.searchInfo.statusIdList = this.statuses
          .filter(x => x.isDefault === 1)
          .map(x => x.statusId);
        this.frmAdvancedSearch.controls['status'].setValue([...this.searchInfo.statusIdList]);
        this.getAttributesOnInit();
      }, error => this.showError(error));
  }

  private getAttributesOnInit(): void {
    this.pagination = new Paging();
    this.pagination.flag = true;
    this.pagination.length = 0;
    this.pagination.order = "desc";
    this.pagination.pageNumber = 1;
    this.pagination.pageSize = 400;
    this.pagination.sort = "";
    this.searchInfo.page = this.pagination;
    this.service.getAttributesOnInit(this.searchInfo)
      .pipe(takeUntil(this._unsubscribeAll), finalize(() => this.stopLoading()))
      .subscribe(res => this.setAttributes(res.attributes), error => this.showError(error));
  }

  private getAttributes(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.service.getAttributes(this.searchInfo)
      .pipe(takeUntil(this._unsubscribeAll), finalize(() => this.stopLoading()))
      .subscribe(res => this.setAttributes(res.attributes), error => this.showError(error));
  }

  private setPaginatorAndSort(): void {
    if (!this._sort || !this._paginator)
      return;

    this._sort.sortChange
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(() => this._paginator.pageIndex = 0);

    merge(this._sort.sortChange, this._paginator.page)
      .pipe(
        takeUntil(this._unsubscribeAll),
        switchMap(() => {
          this.isLoading = true;
          this.pagination = this.pagination || new Paging();
          this.pagination.order = this._sort.direction;
          this.pagination.sort = this._sort.active;
          this.pagination.pageSize = this._paginator.pageSize;
          this.pagination.pageNumber = this._paginator.pageIndex + 1;
          this.pagination.flag = false;
          this.searchInfo.page = this.pagination;
          return this.service.getAttributes(this.searchInfo).pipe(finalize(() => this.stopLoading()));
        })
      )
      .subscribe(res => this.setAttributes(res.attributes), error => this.showError(error));
  }

  private setAttributes(attributes: Array<Attribute>): void {
    this.allAttributes = attributes || [];
    this.applyQuickFilter();
  }

  private applyQuickFilter(): void {
    const term = (this.filter.nativeElement.value || '').toLowerCase();
    this.attributes = !term ? this.allAttributes : this.allAttributes.filter(x =>
      (x.attributeCode || '').toLowerCase().includes(term) ||
      (x.attributeName || '').toLowerCase().includes(term) ||
      (x.dataType || '').toLowerCase().includes(term) ||
      (x.unitName || '').toLowerCase().includes(term) ||
      (x.statusDescription || '').toLowerCase().includes(term));
    this._changeDetectorRef.markForCheck();
  }

  private stopLoading(): void {
    this.isLoading = false;
    this._changeDetectorRef.markForCheck();
  }

  private showError(error: any): void {
    this.errorMessage = this.service.errorMessage(error);
    this.stopLoading();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Search
  // -----------------------------------------------------------------------------------------------------

  public attributeSearch(): void {
    const controls = this.frmAdvancedSearch.controls;
    this.searchInfo.attributeCode = controls['code'].value || null;
    this.searchInfo.attributeName = controls['name'].value || null;
    this.searchInfo.dataType = controls['dataType'].value || null;
    this.searchInfo.unitId = controls['unit'].value || null;
    this.searchInfo.statusIdList = controls['status'].value || [];
    this.pagination.flag = true;
    this.pagination.pageNumber = 1;
    this.pagination.length = 0;
    this.searchInfo.page = this.pagination;
    if (this._paginator)
      this._paginator.pageIndex = 0;
    this.getAttributes();
  }

  public resetAdvancedSearch(): void {
    this.frmAdvancedSearch.reset();
    this.frmAdvancedSearch.controls['status'].setValue(
      this.statuses.filter(x => x.isDefault === 1).map(x => x.statusId));
  }

  trackByFn(index: number, item: Attribute): any {
    return item.attributeId || index;
  }
}
