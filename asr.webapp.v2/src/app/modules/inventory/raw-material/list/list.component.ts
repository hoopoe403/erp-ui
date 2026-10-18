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
import { Subject, merge, forkJoin, fromEvent, of } from "rxjs";
import { catchError, debounceTime, switchMap, distinctUntilChanged, takeUntil, finalize } from "rxjs/operators";
import { FormControl, FormGroup } from "@angular/forms";
import { fuseAnimations } from "../../../../../@fuse/animations";
import { Paging } from "app/core/type/paging/paging.type";
import { RawMaterialCategoryService } from "../../raw-material-category/raw-material-category.service";
import { RawMaterialCategory } from "../../raw-material-category/raw-material-category.types";
import { RawMaterialService } from "../raw-material.service";
import { RawMaterial, RawMaterialSearch } from "../raw-material.types";
import { AttributeService } from "../../attribute/attribute.service";
import { Units } from "app/modules/configuration/measurement/unit/unit.types";

@Component({
  selector: "raw-material-list",
  templateUrl: "./list.component.html",
  styles: [
    /* language=SCSS */
    `
      .raw-materials-grid {
        grid-template-columns: 110px auto 60px;

        @screen sm {
          grid-template-columns: 120px auto 160px 60px;
        }

        @screen lg {
          grid-template-columns: 140px auto 240px 140px 100px 120px 60px;
        }
        @screen print {
          grid-template-columns: 140px auto 240px 140px 100px 120px;
        }
      }
    `,
  ],
  animations: fuseAnimations,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RawMaterialListComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) private _paginator: MatPaginator;
  @ViewChild(MatSort) private _sort: MatSort;
  @ViewChild('filter') filter: ElementRef;

  pagination: Paging;
  searchInfo: RawMaterialSearch = new RawMaterialSearch();
  rawMaterials: Array<RawMaterial> = [];
  allRawMaterials: Array<RawMaterial> = [];
  categories: Array<RawMaterialCategory> = [];
  units: Array<Units> = [];
  statuses: Array<any> = [];
  selectedInfoRow: RawMaterial = new RawMaterial();
  isLoading: boolean;
  errorMessage: string;

  frmAdvancedSearch = new FormGroup({
    code: new FormControl(),
    name: new FormControl(),
    category: new FormControl(),
    technicalNumber: new FormControl(),
    unit: new FormControl(),
    status: new FormControl(),
  });
  searchInputControl: FormControl = new FormControl();

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  constructor(
    private service: RawMaterialService,
    private _categoryService: RawMaterialCategoryService,
    private _attributeService: AttributeService,
    private _changeDetectorRef: ChangeDetectorRef
  ) {
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
    this.service.disposeRawMaterials$();
    this.service.disposePaginator$();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Data
  // -----------------------------------------------------------------------------------------------------

  private loadData(): void {
    // Statuses first: the initial list is filtered by the default statuses. Categories and units only feed
    // the advanced search, so the list still loads without them.
    forkJoin([
      this.service.getStatuses(),
      this._categoryService.getAllCategories().pipe(catchError(() => of([]))),
      this._attributeService.getUnits().pipe(catchError(() => of([])))
    ])
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(([statuses, categories, units]) => {
        this.statuses = statuses || [];
        this.categories = categories || [];
        this.units = units || [];
        this.searchInfo.statusIdList = this.defaultStatusIds();
        this.frmAdvancedSearch.controls['status'].setValue([...this.searchInfo.statusIdList]);
        this.getRawMaterialsOnInit();
      }, error => this.showError(error));
  }

  private getRawMaterialsOnInit(): void {
    this.pagination = new Paging();
    this.pagination.flag = true;
    this.pagination.length = 0;
    this.pagination.order = "desc";
    this.pagination.pageNumber = 1;
    this.pagination.pageSize = 400;
    this.pagination.sort = "";
    this.searchInfo.page = this.pagination;
    this.service.getRawMaterialsOnInit(this.searchInfo)
      .pipe(takeUntil(this._unsubscribeAll), finalize(() => this.stopLoading()))
      .subscribe(res => this.setRawMaterials(res.rawMaterials), error => this.showError(error));
  }

  private getRawMaterials(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.service.getRawMaterials(this.searchInfo)
      .pipe(takeUntil(this._unsubscribeAll), finalize(() => this.stopLoading()))
      .subscribe(res => this.setRawMaterials(res.rawMaterials), error => this.showError(error));
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
          return this.service.getRawMaterials(this.searchInfo).pipe(finalize(() => this.stopLoading()));
        })
      )
      .subscribe(res => this.setRawMaterials(res.rawMaterials), error => this.showError(error));
  }

  private setRawMaterials(rawMaterials: Array<RawMaterial>): void {
    this.allRawMaterials = rawMaterials || [];
    this.applyQuickFilter();
  }

  private applyQuickFilter(): void {
    const term = (this.filter.nativeElement.value || '').toLowerCase();
    this.rawMaterials = !term ? this.allRawMaterials : this.allRawMaterials.filter(x =>
      (x.rawMaterialCode || '').toLowerCase().includes(term) ||
      (x.rawMaterialName || '').toLowerCase().includes(term) ||
      (x.categoryFullName || '').toLowerCase().includes(term) ||
      (x.categoryFullCode || '').toLowerCase().includes(term) ||
      (x.technicalNumber || '').toLowerCase().includes(term) ||
      (x.unitName || '').toLowerCase().includes(term) ||
      (x.statusDescription || '').toLowerCase().includes(term));
    this._changeDetectorRef.markForCheck();
  }

  private defaultStatusIds(): Array<number> {
    return this.statuses.filter(x => x.isDefault === 1).map(x => x.statusId);
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

  public rawMaterialSearch(): void {
    const controls = this.frmAdvancedSearch.controls;
    this.searchInfo.rawMaterialCode = controls['code'].value || null;
    this.searchInfo.rawMaterialName = controls['name'].value || null;
    this.searchInfo.categoryId = controls['category'].value || null;
    this.searchInfo.technicalNumber = controls['technicalNumber'].value || null;
    this.searchInfo.unitId = controls['unit'].value || null;
    this.searchInfo.statusIdList = controls['status'].value || [];
    this.pagination.flag = true;
    this.pagination.pageNumber = 1;
    this.pagination.length = 0;
    this.searchInfo.page = this.pagination;
    if (this._paginator)
      this._paginator.pageIndex = 0;
    this.getRawMaterials();
  }

  public resetAdvancedSearch(): void {
    this.frmAdvancedSearch.reset();
    this.frmAdvancedSearch.controls['status'].setValue(this.defaultStatusIds());
  }

  trackByFn(index: number, item: RawMaterial): any {
    return item.rawMaterialId || index;
  }
}
