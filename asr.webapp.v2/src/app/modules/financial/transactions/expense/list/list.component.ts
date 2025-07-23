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
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { SelectionModel } from "@angular/cdk/collections";
import { Subject, merge, Observable, forkJoin } from "rxjs";
import { debounceTime, switchMap, map } from "rxjs/operators";
import { takeUntil } from "rxjs/operators";
import { fuseAnimations } from "../../../../../../@fuse/animations";
import { ExpenseService } from "../expense.service";
import { Expense } from "../expense.types";
import { Owner } from "app/modules/configuration/owner/owner.types";
import { Paging } from "app/core/type/paging/paging.type";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatMenuTrigger } from "@angular/material/menu";
import { KeyValue } from "app/core/type/key-value/key-value.type";
import { AuthorizedPaymentParty } from "app/modules/financial/shared/financial.types";
import { MatSnackBar } from "@angular/material/snack-bar";

@Component({
  selector: "expenses-list",
  templateUrl: "./list.component.html",
  styles: [
    /* language=SCSS */
    `
      .expenses-grid {
        grid-template-columns: 112px auto 40px;

        @screen sm {
          grid-template-columns: 112px auto 100px 70px;
        }

        @screen md {
          grid-template-columns: 112px 370px auto 130px 150px 70px;
        }

        @screen lg {
          grid-template-columns: auto 170px 170px 130px 150px 70px 70px;
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
export class ExpenseListComponent implements OnInit, AfterViewInit, OnDestroy {
  protected _onDestroy = new Subject<void>();
  @ViewChild(MatPaginator) private _paginator: MatPaginator;
  @ViewChild(MatSort) private _sort: MatSort;
  pagination: Paging;
  selection = new SelectionModel<any>(true, []);
  expenseInfo: Expense;
  _paging: Paging;
  public payersMultiCtrl: FormControl = new FormControl();
  public payersMultiFilterCtrl: FormControl = new FormControl();
  public filteredPayersMulti: Array<Owner> = new Array<Owner>();
  public selectedPayers: Array<Owner> = new Array<Owner>();
  length: number;
  pageSize: number;
  pageIndex: number;
  menuArray = [];
  statuses = [];
  payers: Array<Owner>;
  recipients: Array<Owner>;
  paymentTypes: Array<KeyValue> = [];
  defaultStatuses = [];
  frmAdvancedSearch = new FormGroup({
    payers: new FormControl(),
    paymentType: new FormControl(),
    amountFrom: new FormControl(),
    amountTo: new FormControl(),
    dateFrom: new FormControl(),
    dateTo: new FormControl(),
    status: new FormControl(),
  });

  searchInputControl: FormControl = new FormControl();

  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;

  // Private
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  isLoading: boolean;

  constructor(
    private expenseService: ExpenseService,
    private cdr: ChangeDetectorRef,
    private snack: MatSnackBar,
    private _changeDetectorRef: ChangeDetectorRef
  ) {
    //this._unsubscribeAll = new Subject();
    this._paging = new Paging();
    this.expenseInfo = new Expense();
    this.expenseInfo.payerIdList = [];
    this.expenseInfo.paymentTypeIdList = [];
    this.payers = new Array<Owner>();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------
  isOverlayOpen: boolean = true;
  selectedInfoRow: Expense = new Expense();

  expenses: Array<Expense> = [];
  /**
   * On init
   */
  get expenses$(): Observable<Expense[]> {
    return this.expenseService.expenses$;
  }
  /**
   * On init
   */
  ngOnInit(): void {
    this.isLoading = true;
    this.payersMultiFilterCtrl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterPayersMulti();
      });

    this.expenseService.pagination$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((pagination: Paging) => {
        // Update the pagination
        this.pagination = pagination;

        // Mark for check
        this._changeDetectorRef.markForCheck();
      });

    this.loadData();
  }

  ngAfterViewInit(): void {
    if (this._sort && this._paginator) {
      // Set the initial sort
      this._sort.sort({
        id: "payerName",
        start: "asc",
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
            //this.expenseInfo.page = new Paging();
            this.expenseInfo.page.flag = this.pagination.flag;
            this.expenseInfo.page.length = this.pagination.length;
            this.expenseInfo.page.order = this._sort.direction;
            this.expenseInfo.page.pageNumber = this.pagination.pageNumber;
            this.expenseInfo.page.pageSize = this.pagination.pageSize;
            this.expenseInfo.page.sort = this._sort.active;
            return this.expenseService.getExpenses(this.expenseInfo);
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
    this.expenseService.disposeExpense$();
    this.expenseService.disponsePaginator$();
  }
  private loadData(): void {
    this.getPayers();
    this.getRecipients();
    this.getPaymentType();
    forkJoin(this.getExpenseOnInit(), this.getStatuses()).subscribe((res) => {
      this.setForkJoinValues(res);
      this.isLoading = false;
      this._changeDetectorRef.markForCheck();
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

            this.expenseInfo.page = this.pagination;
            return this.expenseService.getExpenses(this.expenseInfo);
          }),
          map(() => {
            this.isLoading = false;
          })
        )
        .subscribe();
    }
  }
  private setForkJoinValues(values: Array<any>): void {
    this.expenses = values[0].data.expenses;
    this.statuses = values[1].data;
    this.defaultStatuses = [];
    this.statuses.forEach((element) => {
      if (element.isDefault === 1) this.defaultStatuses.push(element.statusId);
    });
    this.frmAdvancedSearch.controls["status"].setValue(this.defaultStatuses);
    this.expenseInfo.statusIdList = this.defaultStatuses;
    this.setPaginatorAndSort();
  }
  private getExpenseOnInit(): Observable<any> {
    this.pagination = new Paging();
    this.pagination.flag = true;
    this.pagination.length = 0;
    this.pagination.order = "desc";
    this.pagination.pageNumber = 1;
    this.pagination.pageSize = 400;
    this.pagination.sort = "";
    this.expenseInfo.page = this.pagination;
    return this.expenseService.getExpensesOnInit(this.expenseInfo);
  }

  private getStatuses(): Observable<any> {
    return this.expenseService.getStatuses();
  }
  private getPayers() {
    this.expenseService.getPayers().subscribe((res) => {
      this.payers = res.data;
    });
  }

  private getRecipients() {
    let obj: AuthorizedPaymentParty = new AuthorizedPaymentParty();
    this.expenseService.getRecipients(obj).subscribe((res) => {
      this.recipients = res.data;
    });
  }

  private getPaymentType() {
    this.expenseService.getPaymentTypes().subscribe((res) => {
      this.paymentTypes = res.data;
    });
  }

  protected filterPayersMulti() {
    if (this.payers.length === 0) {
      return;
    }
    // get the search keyword
    let search = this.payersMultiFilterCtrl.value;
    if (search && search.length > 2) {
      this.filteredPayersMulti = [];
      const payers = this.payers.filter((x) =>
        x.ownerName.toLocaleLowerCase().includes(search.toLowerCase())
      );
      payers.forEach((element) => {
        const selectedIndx = this.selectedPayers.findIndex(
          (x) => x.ownerId === element.ownerId
        );
        if (selectedIndx === -1) this.filteredPayersMulti.push(element);
      });
    }
  }
  modifyPayers(
    event: {
      isUserInput: any;
      source: { value: any; selected: any; group: any };
    },
    action: string
  ) {
    if (event.isUserInput) {
      if (action === "add") {
        const indx = this.filteredPayersMulti.findIndex(
          (x) => x.ownerId === event.source.value
        );
        this.selectedPayers.push(this.filteredPayersMulti[indx]);
        this.expenseInfo.payerIdList.push(
          this.filteredPayersMulti[indx].ownerId
        );
        this.filteredPayersMulti.splice(indx, 1);
      } else {
        const indx = this.selectedPayers.findIndex(
          (x) => x.ownerId === event.source.value
        );
        this.filteredPayersMulti.push(this.filteredPayersMulti[indx]);
        this.expenseInfo.payerIdList.splice(indx, 1);
        this.selectedPayers.splice(indx, 1);
      }
    }
  }
  setPaymentTypeValue(event: {
    isUserInput: any;
    source: { value: any; selected: any };
  }) {
    if (event.isUserInput) {
      if (event.source.value != 0 && event.source.selected) {
        this.expenseInfo.paymentTypeIdList.push(event.source.value);
      } else if (event.source.value != 0 && !event.source.selected) {
        const index: number = this.expenseInfo.paymentTypeIdList.indexOf(
          event.source.value
        );
        if (index !== -1) this.expenseInfo.paymentTypeIdList.splice(index, 1);
        this.frmAdvancedSearch.controls["paymentType"].setValue(
          this.expenseInfo.paymentTypeIdList
        );
      }
    }
  }

  setStatusValue(event: {
    isUserInput: any;
    source: { value: any; selected: any };
  }) {
    if (event.isUserInput) {
      if (event.source.value != 0 && event.source.selected) {
        this.expenseInfo.statusIdList.push(event.source.value);
      } else if (event.source.value != 0 && !event.source.selected) {
        const index: number = this.expenseInfo.statusIdList.indexOf(
          event.source.value
        );
        if (index !== -1) this.expenseInfo.statusIdList.splice(index, 1);
        this.frmAdvancedSearch.controls["status"].setValue(
          this.expenseInfo.statusIdList
        );
      }
    }
  }
  private getExpenses(expenseInfo: Expense) {
    this.isLoading = true;
    this.expenseInfo.status = 0;
    this.expenseService
      .getExpenses(expenseInfo)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((expenses: any) => {
        this.expenses = expenses.data.expenses;
        this._changeDetectorRef.markForCheck();
        this.isLoading = false;
        this.cdr.detectChanges();
      });
  }
  public expenseSearch() {
    this.pagination.flag = true;
    this.pagination.pageNumber = 1;
    this.pagination.length = 0;
    this.pagination.sort = "";
    this.pagination.order = "desc";


    this.expenseInfo.amountFrom = this.frmAdvancedSearch.controls["amountFrom"].value;
    this.expenseInfo.amountTo = this.frmAdvancedSearch.controls["amountTo"].value;
    this.expenseInfo.expenseLocalDateFrom = this.frmAdvancedSearch.controls["dateFrom"].value;
    this.expenseInfo.expenseLocalDateTo = this.frmAdvancedSearch.controls["dateTo"].value;
    this.expenseInfo.page = this.pagination;
    this.getExpenses(this.expenseInfo);
  }

  public resetAdvancedSearch() {
    /*      this.frmAdvancedSearch.controls["code"].setValue(null);
             this.frmAdvancedSearch.controls["name"].setValue(null);
             this.frmAdvancedSearch.controls["orderDeadline"].setValue(null);
             this.frmAdvancedSearch.controls["status"].setValue(null);
             this.frmAdvancedSearch.controls["weight"].setValue(null);
             this.frmAdvancedSearch.controls["weightUnit"].setValue(null); */
  }

  handlePageEvent(event: PageEvent) {
    this.pagination.length = event.length;
    this.pagination.pageSize = event.pageSize;
    this.pagination.pageNumber = event.pageIndex + 1;
    this.pagination.flag = false;
    this.expenseInfo.page = this.pagination;
    this.getExpenses(this.expenseInfo);
  }
  trackByFn(index: number, item: any): any {
    return item.id || index;
  }
  createDraft() {
    this.isLoading = true;
    this.expenseService.createDraft(this.selectedInfoRow).subscribe(res => {
      this.isLoading = false;
      this.snack.open(res.message, null, { duration: 5000 });
      if (res.succeed)
        this.expenseSearch();
      this.cdr.detectChanges();
    });
  }
}
