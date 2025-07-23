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
import { WarehouseService } from "../warehouse.service";
import { Paging } from "app/core/type/paging/paging.type";
import { FormControl, FormGroup } from "@angular/forms";
import { MatMenuTrigger } from "@angular/material/menu";
import { Warehouse } from "../warehouse.types";
import { Units } from "app/modules/configuration/measurement/unit/unit.types";

@Component({
  selector: "warehouse-list",
  templateUrl: "./list.component.html",
  styles: [
    /* language=SCSS */
    `
      .warehouses-grid {
        grid-template-columns: 112px auto 40px;

        @screen sm {
          grid-template-columns: 112px auto 100px 70px;
        }

        @screen md {
          grid-template-columns: 112px 150px 370px 150px 70px;
        }

        @screen lg {
          grid-template-columns: 100px 300px auto  100px 60px;
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
export class WarehouseListComponent implements OnInit, OnDestroy {
  protected _onDestroy = new Subject<void>();
  @ViewChild(MatPaginator) private _paginator: MatPaginator;
  @ViewChild(MatSort) private _sort: MatSort;
  pagination: Paging;
  selection = new SelectionModel<any>(true, []);
  warehouseInfo: Warehouse;
  dimUnitData: Array<Units>;
  massUnitData: Array<Units>;
  statuses = [];
  defaultStatuses = [];
  frmAdvancedSearch = new FormGroup({
    Code: new FormControl(),
    Name: new FormControl(),
    status: new FormControl(),
    length: new FormControl(),
    width: new FormControl(),
    height: new FormControl(),
    dimensionUnit: new FormControl(),
    weight: new FormControl(),
    weightUnit: new FormControl(),
  });

  searchInputControl: FormControl = new FormControl();

  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
  @ViewChild('filter', { static: true }) filter: ElementRef;
  // Private
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  isLoading: boolean;

  constructor(
    private service: WarehouseService,
    private cdr: ChangeDetectorRef,
    private _changeDetectorRef: ChangeDetectorRef
  ) {
    //this._unsubscribeAll = new Subject();

    this.warehouseInfo = new Warehouse();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------
  isOverlayOpen: boolean = true;
  selectedInfoRow: Warehouse = new Warehouse();

  warehouses: Array<Warehouse> = [];

  get warehouses$(): Observable<Warehouse[]> {
    return this.service.warehouses$;
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

    fromEvent(this.filter.nativeElement, 'keyup')
      .pipe(
        takeUntil(this._unsubscribeAll),
        debounceTime(150),
        distinctUntilChanged()
      )
      .subscribe(() => {
        if (!this.warehouses)
          return;


        this.warehouses$.pipe(map(items => items.filter(x =>
          x.warehouseCode.toString().includes(this.filter.nativeElement.value) ||
          x.warehouseName.toLowerCase().includes(this.filter.nativeElement.value) ||
          x.ownerName.toLowerCase().includes(this.filter.nativeElement.value) ||
          x.ownerTypeName.toLowerCase().includes(this.filter.nativeElement.value) ||
          x.status.toString().includes(this.filter.nativeElement.value)))).subscribe(elements => {
            this.warehouses = elements as Warehouse[];
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
            this.warehouseInfo.page = this.pagination;
            return this.service.getWarehouses(this.warehouseInfo);
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
    this.service.disposeWarehouses$();
    this.service.disponsePaginator$();
  }
  private setForkJoinValues(values: Array<any>): void {
    this.warehouses = values[0].data.warehouses;
    this.dimUnitData = values[1].data.filter(x => x.unitType === 1);
    this.massUnitData  = values[1].data.filter(x => x.unitType === 2);
    this.statuses = values[2].data;
    this.defaultStatuses = [];
    this.statuses.forEach((element) => {
      if (element.isDefault === 1) this.defaultStatuses.push(element.statusId);
    });
    this.frmAdvancedSearch.controls["status"].setValue(this.defaultStatuses);
    this.warehouseInfo.statusIdList = this.defaultStatuses;
    this._changeDetectorRef.markForCheck();
    this.cdr.detectChanges();
    this.setPaginatorAndSort();
  }
  private loadData(): void {
    forkJoin(
      this.getWarehousesOnInit(),
      this.getUnits(),
      this.getStatuses()
    ).subscribe((res) => {
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
        this.warehouseInfo.statusIdList.push(event.source.value);
      } else if (event.source.value != 0 && !event.source.selected) {
        const index: number = this.warehouseInfo.statusIdList.indexOf(
          event.source.value
        );
        if (index !== -1) this.warehouseInfo.statusIdList.splice(index, 1);
        this.frmAdvancedSearch.controls["status"].setValue(
          this.warehouseInfo.statusIdList
        );
      }
    }
  }
  private getUnits(): Observable<any> {
    return this.service.getUnits();
  }


  private getWarehouses(warehouseInfo: Warehouse) {
    this.isLoading = true;
    this.service
      .getWarehouses(warehouseInfo)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((warehouses: any) => {
        this.warehouses = warehouses.data.warehouses;
        this.isLoading = false;
        this._changeDetectorRef.markForCheck();
        this.cdr.detectChanges();
      });
  }

  private getWarehousesOnInit(): Observable<any> {
    this.pagination = new Paging();
    this.pagination.flag = true;
    this.pagination.length = 0;
    this.pagination.order = "desc";
    this.pagination.pageNumber = 1;
    this.pagination.pageSize = 400;
    this.pagination.sort = "";
    this.warehouseInfo.page = this.pagination;
    return this.service.getWarehousesOnInit(this.warehouseInfo);
  }
  public warehouseSearch() {
    this.warehouseInfo.warehouseCode =
      this.frmAdvancedSearch.controls["Code"].value;
    this.warehouseInfo.warehouseName =
      this.frmAdvancedSearch.controls["Name"].value;
    this.warehouseInfo.warehouseLength =
      this.frmAdvancedSearch.controls["length"].value;
    this.warehouseInfo.warehouseWidth =
      this.frmAdvancedSearch.controls["width"].value;
    this.warehouseInfo.warehouseHeight =
      this.frmAdvancedSearch.controls["height"].value;
    this.warehouseInfo.dimensiondUnitName =
      this.frmAdvancedSearch.controls["dimensionUnit"].value;
    this.warehouseInfo.weightCapacity =
      this.frmAdvancedSearch.controls["weight"].value;
    this.warehouseInfo.weightUnitId =
      this.frmAdvancedSearch.controls["weightUnit"].value;
    this.pagination.flag = true;
    this.pagination.pageNumber = 1;
    this.pagination.length = 0;
    this.warehouseInfo.page = this.pagination;
    this.getWarehouses(this.warehouseInfo);
  }

  public resetAdvancedSearch() {
    this.frmAdvancedSearch.controls["Code"].setValue(null);
    this.frmAdvancedSearch.controls["Name"].setValue("");
    this.frmAdvancedSearch.controls["status"].setValue("");
    this.frmAdvancedSearch.controls["length"].setValue("");
    this.frmAdvancedSearch.controls["width"].setValue("");
    this.frmAdvancedSearch.controls["height"].setValue("");
    this.frmAdvancedSearch.controls["dimensionUnit"].setValue(null);
    this.frmAdvancedSearch.controls["weight"].setValue("");
    this.frmAdvancedSearch.controls["weightUnit"].setValue("");

  }

  handlePageEvent(event: PageEvent) {
    this.pagination.length = event.length;
    this.pagination.pageSize = event.pageSize;
    this.pagination.pageNumber = event.pageIndex + 1;
    this.pagination.flag = false;
    this.warehouseInfo.page = this.pagination;
    this.getWarehouses(this.warehouseInfo);
  }
  trackByFn(index: number, item: any): any {
    return item.id || index;
  }
}
