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
import { takeUntil } from "rxjs/operators";
import { ContractorService } from "../contractor.service";
import { Contractor } from "../contractor.type";
import {
  debounceTime,
  switchMap,
  map,
  distinctUntilChanged,
} from "rxjs/operators";

import { fuseAnimations } from "@fuse/animations";
import { SettlementType } from "app/modules/financial/shared/financial.types";

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
export class ContractorsListComponent implements OnInit, OnDestroy {
  isLoading: boolean;
  searchInputControl: FormControl = new FormControl();
  pagination: Paging;
  contractorInfo: Contractor;
  private _unsubscribeAll: Subject<any> = new Subject<any>();

  contractors: Contractor[] = [];

  selectedInfoRow: Contractor = new Contractor();

  // contract: Observable<Contractor[]>;
  statuses = [];
  contractorTypes = [];
  settlementTypes: [];

  formAdvanceSearch = new FormGroup({
    status: new FormControl(1000001),
    type: new FormControl([]),
    code: new FormControl(),
    name: new FormControl(),
    organization: new FormControl(),
    settlementType: new FormControl(),
  });

  constructor(
    public service: ContractorService,
    private cdr: ChangeDetectorRef,
    private _changeDetectorRef: ChangeDetectorRef
  ) {
    //this._unsubscribeAll = new Subject();
    this.contractorInfo = new Contractor();
    this.contractorInfo.contractorTypeIdList = [];
    this.contractorInfo.settlementTypeIdList = [];
  }

  @ViewChild(MatPaginator) private _paginator: MatPaginator;
  @ViewChild(MatSort) private _sort: MatSort;

  get contractors$(): Observable<Contractor[]> {
    return this.service.contractors$;
  }

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

    this.searchInputControl.valueChanges
      .pipe(
        takeUntil(this._unsubscribeAll),
        debounceTime(150),
        distinctUntilChanged()
      )
      .subscribe(() => {
        let value: string = this.searchInputControl.value.toLowerCase();

        this.contractors$.subscribe((items) => {
          this.contractors = items.filter(
            (x) =>
              x.contractorName.toLowerCase().includes(value) ||
              x.contractorCode.includes(value) ||
              x.contractorTypeName.toLowerCase().includes(value) ||
              x.organizationName.toLowerCase().includes(value)
          );
          this.cdr.detectChanges();
        });
      });

    this.loadData();
  }
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
    this.service.disposeContractors$();
    this.service.disponsePaginator$();
  }
  handlePageEvent(event: PageEvent) {
    this.pagination.length = event.length;
    this.pagination.pageSize = event.pageSize;
    this.pagination.pageNumber = event.pageIndex + 1;
    this.pagination.flag = false;
    this.contractorInfo.page = this.pagination;
    this.getContractors(this.contractorInfo);
  }
  trackByFn(index: number, item: any): any {
    return item.id || index;
  }
  private getContractorsOnInit(): Observable<any> {
    this.pagination = new Paging();
    this.pagination.flag = true;
    this.pagination.length = 0;
    this.pagination.order = "desc";
    this.pagination.pageNumber = 1;
    this.pagination.pageSize = 400;
    this.pagination.sort = "";
    this.contractorInfo.page = this.pagination;
    this.contractorInfo.status = 1000001;
    return this.service.getContractorsOnInit(this.contractorInfo);
  }
  private setForkJoinValues(values: Array<any>): void {
    this.statuses = values[0].data;
    this.contractorTypes = values[1].data;
    this.contractors = values[2].data.contractors;
    this.settlementTypes = values[3].data;
    this.formAdvanceSearch.controls['status'].setValue(this.contractorInfo.status);
    this._changeDetectorRef.markForCheck();
    this.cdr.detectChanges();
    this.setPaginatorAndSort();
  }
  private loadData(): void {
    forkJoin(
      this.getStatuses(),
      this.getCustomerTypes(),
      this.getContractorsOnInit(),
      this.getSettlementTypes(),
    ).subscribe((res) => {
      this.setForkJoinValues(res);
      this.isLoading = false;
      this.cdr.detectChanges();
    });
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
            this.contractorInfo.page = this.pagination;
            return this.service.getContractors(this.contractorInfo);
          }),
          map(() => {
            this.isLoading = false;
          })
        )
        .subscribe();
    }
  }

  private getContractors(contractorInfo: Contractor) {
    this.isLoading = true;
    this.service
      .getContractors(contractorInfo)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((contractors: any) => {
        this.contractors = contractors.data.contractors;
        this.isLoading = false;
        this._changeDetectorRef.markForCheck();
        this.cdr.detectChanges();
      });
  }

  public contractorSearch() {
    this.contractorInfo.contractorCode =
      this.formAdvanceSearch.controls["code"].value;
    this.contractorInfo.contractorName =
      this.formAdvanceSearch.controls["name"].value;
    this.contractorInfo.status =
      this.formAdvanceSearch.controls["status"].value;
    this.contractorInfo.organizationId =
      this.formAdvanceSearch.controls["organization"].value;
    this.pagination.flag = true;
    this.pagination.pageNumber = 1;
    this.pagination.length = 0;
    this.contractorInfo.page = this.pagination;
    // console.log(this.contractorInfo);
    this.getContractors(this.contractorInfo);
  }

  public resetAdvancedSearch() {
    this.formAdvanceSearch.controls["code"].setValue(null);
    this.formAdvanceSearch.controls["name"].setValue(null);
    this.formAdvanceSearch.controls["organization"].setValue(null);
    this.formAdvanceSearch.controls["status"].setValue(null);
    this.formAdvanceSearch.controls["type"].setValue(null);
  }

  private getStatuses(): Observable<any> {
    return this.service.getStatuses();
  }
  private getCustomerTypes(): Observable<any> {
    return this.service.getContractorTypes();
  }
  private getSettlementTypes(): Observable<any> {
    return this.service.getSettlementType();
  }
  setTypeValue(event: {
    isUserInput: any;
    source: { value: any; selected: any };
  }) {
    if (event.isUserInput) {
      if (event.source.value != 0 && event.source.selected) {
        this.contractorInfo.contractorTypeIdList.push(event.source.value);
      } else if (event.source.value != 0 && !event.source.selected) {
        const index: number = this.contractorInfo.contractorTypeIdList.indexOf(
          event.source.value
        );
        if (index !== -1)
          this.contractorInfo.contractorTypeIdList.splice(index, 1);
        this.formAdvanceSearch.controls["status"].setValue(
          this.contractorInfo.contractorTypeIdList
        );
      }
    }
  }

  setSettlementTypeValue(event: {
    isUserInput: any;
    source: { value: any; selected: any };
  }) {
    if (event.isUserInput) {
      if (event.source.value != 0 && event.source.selected) {
        this.contractorInfo.settlementTypeIdList.push(event.source.value);
      } else if (event.source.value != 0 && !event.source.selected) {
        const index: number = this.contractorInfo.settlementTypeIdList.indexOf(
          event.source.value
        );
        if (index !== -1)
          this.contractorInfo.settlementTypeIdList.splice(index, 1);
        this.formAdvanceSearch.controls["settlementType"].setValue(
          this.contractorInfo.settlementTypeIdList
        );
      }
    }
  }
}
