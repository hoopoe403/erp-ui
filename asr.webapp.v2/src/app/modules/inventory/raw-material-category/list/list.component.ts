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
import { Subject, merge, forkJoin, fromEvent } from "rxjs";
import { debounceTime, switchMap, distinctUntilChanged, takeUntil, finalize } from "rxjs/operators";
import { FormControl, FormGroup } from "@angular/forms";
import { fuseAnimations } from "../../../../../@fuse/animations";
import { Paging } from "app/core/type/paging/paging.type";
import { RawMaterialCategoryService } from "../raw-material-category.service";
import { RawMaterialCategory, RawMaterialCategorySearch, RawMaterialCategoryStatus } from "../raw-material-category.types";

@Component({
  selector: "raw-material-category-list",
  templateUrl: "./list.component.html",
  styles: [
    /* language=SCSS */
    `
      .raw-material-categories-grid {
        grid-template-columns: 120px auto 60px;

        @screen sm {
          grid-template-columns: 120px auto 120px 60px;
        }

        @screen lg {
          grid-template-columns: 150px auto 250px 100px 100px 120px 60px;
        }
        @screen print {
          grid-template-columns: 150px auto 250px 100px 100px 120px;
        }
      }
    `,
  ],
  animations: fuseAnimations,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RawMaterialCategoryListComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) private _paginator: MatPaginator;
  @ViewChild(MatSort) private _sort: MatSort;
  @ViewChild('filter') filter: ElementRef;

  pagination: Paging;
  searchInfo: RawMaterialCategorySearch = new RawMaterialCategorySearch();
  categories: Array<RawMaterialCategory> = [];
  allCategories: Array<RawMaterialCategory> = [];
  parents: Array<RawMaterialCategory> = [];
  statuses: Array<RawMaterialCategoryStatus> = [];
  selectedInfoRow: RawMaterialCategory = new RawMaterialCategory();
  isLoading: boolean;
  errorMessage: string;

  frmAdvancedSearch = new FormGroup({
    code: new FormControl(),
    name: new FormControl(),
    fullCode: new FormControl(),
    fullName: new FormControl(),
    parent: new FormControl(),
    level: new FormControl(),
    status: new FormControl(),
  });
  searchInputControl: FormControl = new FormControl();

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  constructor(
    private service: RawMaterialCategoryService,
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
    this.service.disposeCategories$();
    this.service.disposePaginator$();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Data
  // -----------------------------------------------------------------------------------------------------

  private loadData(): void {
    // Statuses first: the initial list is filtered by the default statuses.
    forkJoin([this.service.getStatuses(), this.service.getAllCategories()])
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(([statuses, parents]) => {
        this.statuses = statuses;
        this.parents = parents || [];
        this.searchInfo.statusIdList = this.defaultStatusIds();
        this.frmAdvancedSearch.controls['status'].setValue([...this.searchInfo.statusIdList]);
        this.getCategoriesOnInit();
      }, error => this.showError(error));
  }

  private getCategoriesOnInit(): void {
    this.pagination = new Paging();
    this.pagination.flag = true;
    this.pagination.length = 0;
    this.pagination.order = "asc";
    this.pagination.pageNumber = 1;
    this.pagination.pageSize = 400;
    this.pagination.sort = "fullCode";
    this.searchInfo.page = this.pagination;
    this.service.getCategoriesOnInit(this.searchInfo)
      .pipe(takeUntil(this._unsubscribeAll), finalize(() => this.stopLoading()))
      .subscribe(res => this.setCategories(res.rawMaterialCategories), error => this.showError(error));
  }

  private getCategories(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.service.getCategories(this.searchInfo)
      .pipe(takeUntil(this._unsubscribeAll), finalize(() => this.stopLoading()))
      .subscribe(res => this.setCategories(res.rawMaterialCategories), error => this.showError(error));
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
          return this.service.getCategories(this.searchInfo).pipe(finalize(() => this.stopLoading()));
        })
      )
      .subscribe(res => this.setCategories(res.rawMaterialCategories), error => this.showError(error));
  }

  private setCategories(categories: Array<RawMaterialCategory>): void {
    this.allCategories = categories || [];
    this.applyQuickFilter();
  }

  private applyQuickFilter(): void {
    const term = (this.filter.nativeElement.value || '').toLowerCase();
    this.categories = !term ? this.allCategories : this.allCategories.filter(x =>
      (x.fullCode || '').toLowerCase().includes(term) ||
      (x.rawMaterialCategoryName || '').toLowerCase().includes(term) ||
      (x.fullName || '').toLowerCase().includes(term) ||
      (x.parentFullName || '').toLowerCase().includes(term) ||
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

  public categorySearch(): void {
    const controls = this.frmAdvancedSearch.controls;
    this.searchInfo.rawMaterialCategoryCode = controls['code'].value || null;
    this.searchInfo.rawMaterialCategoryName = controls['name'].value || null;
    this.searchInfo.fullCode = controls['fullCode'].value || null;
    this.searchInfo.fullName = controls['fullName'].value || null;
    this.searchInfo.parentId = controls['parent'].value || null;
    this.searchInfo.levelId = controls['level'].value || null;
    this.searchInfo.statusIdList = controls['status'].value || [];
    this.pagination.flag = true;
    this.pagination.pageNumber = 1;
    this.pagination.length = 0;
    this.searchInfo.page = this.pagination;
    if (this._paginator)
      this._paginator.pageIndex = 0;
    this.getCategories();
  }

  public resetAdvancedSearch(): void {
    this.frmAdvancedSearch.reset();
    this.frmAdvancedSearch.controls['status'].setValue(this.defaultStatusIds());
  }

  trackByFn(index: number, item: RawMaterialCategory): any {
    return item.rawMaterialCategoryId || index;
  }
}
