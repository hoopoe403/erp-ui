import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  ChangeDetectionStrategy,
} from "@angular/core";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { FormControl, FormGroup } from "@angular/forms";
import { Paging } from "app/core/type/paging/paging.type";
import { forkJoin, Observable, Subject, merge } from "rxjs";
import { debounceTime, distinctUntilChanged, map, switchMap, takeUntil } from "rxjs/operators";
import { fuseAnimations } from "@fuse/animations";
import { VendorService } from "../vendor.service";
import { Vendor, VendorSearch, VendorStatus } from "../vendor.types";

const ACTIVE_STATUS = 1000001;

@Component({
  templateUrl: "./list.component.html",
  styles: [
    `
      .customers-grid {
        grid-template-columns: 112px auto 40px;

        @screen sm {
          grid-template-columns: 112px auto 100px 70px;
        }

        @screen md {
          grid-template-columns: 112px auto 150px 150px 370px 150px 70px;
        }

        @screen lg {
          grid-template-columns: 150px auto 150px 150px 300px 70px 70px;
        }
        @screen print {
          grid-template-columns: 112px 370px 370px 70px;
        }
      }
    `,
  ],
  animations: fuseAnimations,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorsListComponent implements OnInit, OnDestroy {
  isLoading: boolean;
  searchInputControl: FormControl = new FormControl();
  pagination: Paging;
  search: VendorSearch = { page: null };
  private _unsubscribeAll: Subject<any> = new Subject<any>();

  vendors: Vendor[] = [];
  selectedInfoRow: Vendor = new Vendor();
  statuses: VendorStatus[] = [];

  formAdvanceSearch = new FormGroup({
    status: new FormControl(ACTIVE_STATUS),
    code: new FormControl(),
    name: new FormControl(),
  });

  constructor(
    public service: VendorService,
    private cdr: ChangeDetectorRef
  ) {}

  @ViewChild(MatPaginator) private _paginator: MatPaginator;
  @ViewChild(MatSort) private _sort: MatSort;

  get vendors$(): Observable<Vendor[]> {
    return this.service.vendors$;
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.service.pagination$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((pagination: Paging) => {
        if (pagination) {
          this.pagination = pagination;
        }
        this.cdr.markForCheck();
      });

    this.searchInputControl.valueChanges
      .pipe(takeUntil(this._unsubscribeAll), debounceTime(150), distinctUntilChanged())
      .subscribe(() => {
        const value: string = (this.searchInputControl.value || "").toLowerCase();
        this.vendors$.pipe(takeUntil(this._unsubscribeAll)).subscribe((items) => {
          this.vendors = (items || []).filter(
            (x) =>
              (x.vendorName || "").toLowerCase().includes(value) ||
              (x.vendorCode || "").toLowerCase().includes(value) ||
              (x.vendorTypeName || "").toLowerCase().includes(value)
          );
          this.cdr.detectChanges();
        });
      });

    this.loadData();
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
    this.service.disposeVendors$();
    this.service.disposePaginator$();
  }

  handlePageEvent(event: PageEvent) {
    this.pagination.length = event.length;
    this.pagination.pageSize = event.pageSize;
    this.pagination.pageNumber = event.pageIndex + 1;
    this.pagination.flag = false;
    this.search.page = this.pagination;
    this.getVendors();
  }

  trackByFn(index: number, item: any): any {
    return item.vendorId || index;
  }

  private loadData(): void {
    this.pagination = new Paging();
    this.pagination.flag = true;
    this.pagination.length = 0;
    this.pagination.order = "desc";
    this.pagination.pageNumber = 1;
    this.pagination.pageSize = 400;
    this.pagination.sort = "";
    this.search = { statusIdList: [ACTIVE_STATUS], page: this.pagination };

    forkJoin([this.service.getStatuses(), this.service.getVendors(this.search)]).subscribe({
      next: ([statuses, list]) => {
        this.statuses = statuses || [];
        this.vendors = list.vendors || [];
        this.isLoading = false;
        this.cdr.detectChanges();
        this.setPaginatorAndSort();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private setPaginatorAndSort(): void {
    if (this._sort && this._paginator) {
      this._sort.sort({ id: "", start: "desc", disableClear: true });
      this.cdr.markForCheck();

      this._sort.sortChange.pipe(takeUntil(this._unsubscribeAll)).subscribe(() => {
        this._paginator.pageIndex = 0;
      });

      merge(this._sort.sortChange, this._paginator.page)
        .pipe(
          switchMap(() => {
            this.isLoading = true;
            this.pagination.order = this._sort.direction;
            this.pagination.sort = this._sort.active;
            this.search.page = this.pagination;
            return this.service.getVendors(this.search);
          }),
          map((list) => {
            this.vendors = list.vendors || [];
            this.isLoading = false;
            this.cdr.detectChanges();
          }),
          takeUntil(this._unsubscribeAll)
        )
        .subscribe();
    }
  }

  private getVendors() {
    this.isLoading = true;
    this.service
      .getVendors(this.search)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: (list) => {
          this.vendors = list.vendors || [];
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  public vendorSearch() {
    const value = this.formAdvanceSearch.value;
    this.search.vendorCode = value.code || null;
    this.search.vendorName = value.name || null;
    this.search.statusIdList = value.status ? [value.status] : [];
    this.pagination.flag = true;
    this.pagination.pageNumber = 1;
    this.pagination.length = 0;
    this.search.page = this.pagination;
    this.getVendors();
  }

  public resetAdvancedSearch() {
    this.formAdvanceSearch.reset({ status: null, code: null, name: null });
  }
}
