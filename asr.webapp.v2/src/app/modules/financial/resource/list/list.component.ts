import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from "@angular/core";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { SelectionModel } from "@angular/cdk/collections";
import { Subject, merge, Observable, forkJoin, fromEvent } from "rxjs";
import {
  debounceTime,
  switchMap,
  map,
  distinctUntilChanged,
} from "rxjs/operators";
import { takeUntil } from "rxjs/operators";
import { fuseAnimations } from "../../../../../@fuse/animations";
import { FinancialResourceService } from "../resource.service";
import { FinancialResource } from "../resource.types";
import { Paging } from "app/core/type/paging/paging.type";
import { FormControl, FormGroup } from "@angular/forms";
import { MatMenuTrigger } from "@angular/material/menu";

@Component({
  selector: "resources-list",
  templateUrl: "./list.component.html",
  styles: [
    /* language=SCSS */
    `
      .resources-grid {
        grid-template-columns: 112px auto 40px;

        @screen sm {
          grid-template-columns: 112px auto 100px 70px;
        }

        @screen md {
          grid-template-columns: 112px auto 150px 370px 150px 70px;
        }

        @screen lg {
          grid-template-columns: 70px auto 250px 250px 250px 70px 70px;
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
export class ResourceListComponent implements OnInit, OnDestroy {
  protected _onDestroy = new Subject<void>();
  @ViewChild(MatPaginator) private _paginator: MatPaginator;
  @ViewChild(MatSort) private _sort: MatSort;
  pagination: Paging;
  selection = new SelectionModel<any>(true, []);
  resourceInfo: FinancialResource;
  statuses = [];
  defaultStatuses = [];
  frmAdvancedSearch = new FormGroup({
    code: new FormControl(),
    name: new FormControl(),
    owner: new FormControl(),
    beneficiary: new FormControl(),
    status: new FormControl(),
  });

  searchInputControl: FormControl = new FormControl();

  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
  @ViewChild("filter", { static: true })
  filter: ElementRef;
  // Private
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  isLoading: boolean;

  constructor(
    private service: FinancialResourceService,
    private cdr: ChangeDetectorRef,
    private _changeDetectorRef: ChangeDetectorRef
  ) {
    //this._unsubscribeAll = new Subject();

    this.resourceInfo = new FinancialResource();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------
  isOverlayOpen: boolean = true;
  selectedInfoRow: FinancialResource = new FinancialResource();

  resources: Array<FinancialResource> = [];

  get resources$(): Observable<FinancialResource[]> {
    return this.service.resources$;
  }
  /**
   * On init
   */
  ngOnInit(): void {
    this.isLoading = true;
    this.service.pagination$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((pagination: Paging) => {
        // Update the pagination
        this.pagination = pagination;

        // Mark for check
        this._changeDetectorRef.markForCheck();
      });

    fromEvent(this.filter.nativeElement, "keyup")
      .pipe(
        takeUntil(this._unsubscribeAll),
        debounceTime(150),
        distinctUntilChanged()
      )
      .subscribe(() => {
        if (!this.resources) {
          return;
        }

        this.resources$
          .pipe(
            map((items) =>
              items.filter(
                (x) =>
                  x.financialResourceCode
                    .toLowerCase()
                    .includes(this.filter.nativeElement.value) ||
                  x.financialResourceName
                    .toLowerCase()
                    .includes(this.filter.nativeElement.value) ||
                  x.ownerName
                    .toLowerCase()
                    .includes(this.filter.nativeElement.value) ||
                  x.beneficiaryName
                    .toLowerCase()
                    .includes(this.filter.nativeElement.value) ||
                  x.statusDescription
                    .toLowerCase()
                    .includes(this.filter.nativeElement.value)
              )
            )
          )
          .subscribe((elements) => {
            this.resources = elements as FinancialResource[];
            this._changeDetectorRef.markForCheck();
            this.cdr.detectChanges();
          });
      });
    this.loadData();
  }

  private setPaginatorAndSort(): void {
    if (this._sort && this._paginator) {
      // Set the initial sort
      this._sort.sort({
        id: "",
        start: "desc",
        disableClear: true,
      });

      // Mark for check
      this._changeDetectorRef.markForCheck();

      // If the user changes the sort order...
      this._sort.sortChange
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(() => {
          // Reset back to the first page
          this._paginator.pageIndex = 0;
        });

      // Get products if sort or page changes
      merge(this._sort.sortChange, this._paginator.page)
        .pipe(
          switchMap(() => {
            this.isLoading = true;
            this.pagination.order = this._sort.direction;
            this.pagination.sort = this._sort.active;
            this.resourceInfo.page = this.pagination;
            return this.service.getResources(this.resourceInfo);
          }),
          map(() => {
            this.isLoading = false;
          })
        )
        .subscribe();
    }
  }

  /**
   * On destroy
   */
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
    this.service.disposeResources$();
    this.service.disponsePaginator$();
  }
  private setForkJoinValues(values: Array<any>): void {
    this.statuses = values[0].data;
    this.defaultStatuses = [];
    this.statuses.forEach((element) => {
      if (element.isDefault === 1) this.defaultStatuses.push(element.statusId);
    });
    this.frmAdvancedSearch.controls["status"].setValue(this.defaultStatuses);
    this.resourceInfo.statusIdList = this.defaultStatuses;
    this.resources = values[1].data.resources;
    this._changeDetectorRef.markForCheck();
    this.cdr.detectChanges();
    this.setPaginatorAndSort();
  }
  private loadData(): void {
    forkJoin(this.getStatuses(), this.getResourcesOnInit()).subscribe((res) => {
      this.setForkJoinValues(res);
      this.isLoading = false;
      this.cdr.detectChanges();
    });
  }

  private getStatuses(): Observable<any> {
    return this.service.getStatuses();
  }

  setStatusValue(event: {
    isUserInput: any;
    source: { value: any; selected: any };
  }) {
    if (event.isUserInput) {
      if (event.source.value != 0 && event.source.selected) {
        this.resourceInfo.statusIdList.push(event.source.value);
      } else if (event.source.value != 0 && !event.source.selected) {
        const index: number = this.resourceInfo.statusIdList.indexOf(
          event.source.value
        );
        if (index !== -1) this.resourceInfo.statusIdList.splice(index, 1);
        this.frmAdvancedSearch.controls["status"].setValue(
          this.resourceInfo.statusIdList
        );
      }
    }
  }
  private getResources(resourceInfo: FinancialResource) {
    this.isLoading = true;
    this.service
      .getResources(resourceInfo)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((resources: any) => {
        this.resources = resources.data.resources;
        this.isLoading = false;
        this._changeDetectorRef.markForCheck();
        this.cdr.detectChanges();
      });
  }

  private getResourcesOnInit(): Observable<any> {
    this.pagination = new Paging();
    this.pagination.flag = true;
    this.pagination.length = 0;
    this.pagination.order = "desc";
    this.pagination.pageNumber = 1;
    this.pagination.pageSize = 400;
    this.pagination.sort = "";
    this.resourceInfo.page = this.pagination;
    return this.service.getResourcesOnInit(this.resourceInfo);
  }
  public resourcesSearch() {
    this.resourceInfo.financialResourceCode =
      this.frmAdvancedSearch.controls["code"].value;
    this.resourceInfo.ownerName =
      this.frmAdvancedSearch.controls["owner"].value;
    this.resourceInfo.beneficiaryName =
      this.frmAdvancedSearch.controls["beneficiary"].value;
    this.resourceInfo.financialResourceName =
      this.frmAdvancedSearch.controls["name"].value;
    this.resourceInfo.statusIdList =
      this.frmAdvancedSearch.controls["status"].value;
    this.pagination.flag = true;
    this.pagination.pageNumber = 1;
    this.pagination.length = 0;
    this.resourceInfo.page = this.pagination;
    this.getResources(this.resourceInfo);
  }

  public resetAdvancedSearch() {
    this.frmAdvancedSearch.controls["code"].setValue(null);
    this.frmAdvancedSearch.controls["name"].setValue(null);
    this.frmAdvancedSearch.controls["owner"].setValue(null);
    this.frmAdvancedSearch.controls["beneficiary"].setValue(null);
    this.frmAdvancedSearch.controls["status"].setValue(this.defaultStatuses);
  }

  handlePageEvent(event: PageEvent) {
    this.pagination.length = event.length;
    this.pagination.pageSize = event.pageSize;
    this.pagination.pageNumber = event.pageIndex + 1;
    this.pagination.flag = false;
    this.resourceInfo.page = this.pagination;
    this.getResources(this.resourceInfo);
  }
  trackByFn(index: number, item: any): any {
    return item.id || index;
  }
}
