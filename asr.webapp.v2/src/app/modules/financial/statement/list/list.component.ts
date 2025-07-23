import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from "@angular/core";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { SelectionModel } from "@angular/cdk/collections";
import { Subject, merge, Observable, forkJoin } from "rxjs";
import { debounceTime, switchMap, map, startWith } from "rxjs/operators";
import { takeUntil } from "rxjs/operators";
import { fuseAnimations } from "../../../../../@fuse/animations";
import { StatementService } from "../statement.service";
import { Statement, StatementDetail } from "../statement.types";
import { Paging } from "app/core/type/paging/paging.type";
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidatorFn,
} from "@angular/forms";
import { MatMenuTrigger } from "@angular/material/menu";
import { DialogService } from "../details/dialog.service";
import { Owner, OwnerType } from "app/modules/configuration/owner/owner.types";
import { FinancialResource } from "../../resource/resource.types";
import { DecimalPipe, formatDate } from "@angular/common";
import { ExcelHeader } from "app/shared/excel/excel.types";
import { ExcelService } from "app/shared/excel/excel.service";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { FinancialYear } from "../../shared/financial.types";
import { Meta } from '@angular/platform-browser';
@Component({
  selector: "statement-list",
  templateUrl: "./list.component.html",
  styles: [
    /* language=SCSS */
    `
      .statement-grid3 {
        grid-template-columns:  auto 250px 200px 150px 150px 30px;

        @screen sm {
          grid-template-columns: auto 250px 200px 150px 150px 30px;
        }

        @screen md {
          grid-template-columns: auto 250px 200px 150px 150px 30px;
        }

        @screen lg {
          grid-template-columns: auto 250px 200px 150px 150px 30px;
        }
        @screen print {
          grid-template-columns: auto 250px 200px 150px 150px 30px;
        }
      }
    `,
    `
      .statement-detail-grid {
        grid-template-columns:  120px 170px 170px 130px 170px auto 30px;

        @screen sm {
          grid-template-columns: auto 100px 100px 70px;
        }

        @screen md {
          grid-template-columns: auto 100px 100px 70px;
        }

        @screen lg {
          grid-template-columns: 120px 170px 170px 130px 170px auto 30px;
        }
        @screen print {
          grid-template-columns: 100px 370px 370px 70px;
        }
      }
    `,
  ],
  animations: fuseAnimations,
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatementListComponent implements OnInit, OnDestroy {
  protected _onDestroy = new Subject<void>();
  @ViewChild(MatPaginator) private _paginator: MatPaginator;
  @ViewChild(MatSort) private _sort: MatSort;
  public ownersMultiFilterCtrl: FormControl = new FormControl();
  public ownersMultiCtrl: FormControl = new FormControl();
  public filteredOwnersMulti: Array<Owner> = new Array<Owner>();
  statuses = [];
  defaultStatuses = [];
  pagination: Paging;
  selection = new SelectionModel<any>(true, []);
  statementDetailInfo: StatementDetail;
  statementInfo: Statement;
  ownerTypes: Array<OwnerType>;
  owners: Array<Owner>;
  public selectedOwners: Array<Owner> = new Array<Owner>();
  financialResources: Array<FinancialResource>;
  financialResourceControl = new FormControl();
  financialResourceFilteredOptions: Observable<FinancialResource[]>;
  reportType: number;
  financialYears: Array<FinancialYear>;
  frmAdvancedSearch = new FormGroup({
    reportType: new FormControl(),
    year: new FormControl(),
    ownerType: new FormControl(),
    resourceType: new FormControl(),
    credit: new FormControl(),
    transactionType: new FormControl(),
    dateFrom: new FormControl(),
    dateTo: new FormControl(),
    amountFrom: new FormControl(),
    amountTo: new FormControl(),
    balanceFrom: new FormControl(),
    balanceTo: new FormControl(),
  });

  searchInputControl: FormControl = new FormControl();

  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;

  // Private
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  isLoading: boolean;

  constructor(
    private meta: Meta,
    private service: StatementService,
    private _decimalPipe: DecimalPipe,
    private excelService: ExcelService,
    private _dialogService: DialogService,
    private cdr: ChangeDetectorRef,
    private _formBuilder: FormBuilder,
    private _changeDetectorRef: ChangeDetectorRef
  ) {
    //this._unsubscribeAll = new Subject();
    this.statementDetailInfo = new StatementDetail();
    this.statementInfo = new Statement();
    this.statementDetailInfo.financialTransactionTypeIdList = [];
    this.statementDetailInfo.partitionKeyList = [];
    this.owners = new Array<Owner>();
    this.financialResources = new Array<FinancialResource>();
    this.meta.updateTag({ name: 'Cache-Control', content: 'no-store, no-cache, must-revalidate, max-age=0' });
    this.meta.updateTag({ name: 'Pragma', content: 'no-cache' });
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------
  isOverlayOpen: boolean = true;
  selectedInfoDetailRow: StatementDetail = new StatementDetail();

  statements: Array<Statement> = [];
  statementDetails: Array<StatementDetail> = [];
  /**
   * On init
   */

  get statementDetails$(): Observable<StatementDetail[]> {
    return this.service.statementDetails$;
  }

  get statements$(): Observable<Statement[]> {
    return this.service.statements$;
  }
  ngOnInit(): void {
    this.reportType = 1;
    this.isLoading = true;
    this.financialResourceFilteredOptions =
      this.financialResourceControl.valueChanges.pipe(
        startWith(""),
        map((value) => this._financialResourceFilter(value))
      );

    this.service.pagination$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((pagination: Paging) => {
        // Update the pagination
        this.pagination = pagination;

        // Mark for check
        this._changeDetectorRef.markForCheck();
      });
    this.ownersMultiFilterCtrl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterOwnersMulti();
      });
    this.searchInputControl.valueChanges
      .pipe(
        takeUntil(this._unsubscribeAll),
        debounceTime(300),
        switchMap((query) => {
          this.isLoading = true;
          return this.service.getStatements(this.statementInfo);
        }),
        map(() => {
          this.isLoading = false;
        })
      )
      .subscribe();
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
            if (this.reportType === 1) {
              this.statementInfo.page = this.pagination;
              return this.service.getStatements(this.statementInfo);
            } else {
              this.statementDetailInfo.page = this.pagination;
              return this.service.getStatementDetails(this.statementDetailInfo);
            }
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
    this.service.disposeStatements$();
    this.service.disponsePaginator$();
  }
  private setForkJoinValues(values: Array<any>): void {
    this.statements = values[0].data.statements;
    this.ownerTypes = values[1].data;
    this.financialYears = values[2].data;
    this.statementDetailInfo.partitionKeyList.push(this.financialYears.filter(x => x.isCurrent === 1)[0].partitionKey);
    this.frmAdvancedSearch.controls['year'].setValue(this.statementDetailInfo.partitionKeyList);
    this.changeReportType({
      isUserInput: true,
      source: { value: 1, selected: true },
    });
    this.frmAdvancedSearch.controls["reportType"].setValue(1);
    this._changeDetectorRef.markForCheck();
    this.cdr.detectChanges();
    this.setPaginatorAndSort();
  }
  private loadData(): void {
    forkJoin(this.getStatementsOnInit(),
      this.getOwnerTypes(),
      this.getFinancialYears()).subscribe(
        (res) => {
          this.setForkJoinValues(res);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      );
  }
  private getOwners(ownerTypeId: number) {
    this.selectedOwners = [];
    this.ownersMultiCtrl.disable();
    this.service.getOwners(ownerTypeId).subscribe(res => {
      this.owners = res.data;
      this.filteredOwnersMulti = res.data;
      this.ownersMultiCtrl.enable();
    });
  }

  private getFinancialYears(): Observable<any> {
    return this.service.getFinancialYears();
  }
  protected filterOwnersMulti() {
    if (this.owners.length === 0) {
      return;
    }
    // get the search keyword
    let search = this.ownersMultiFilterCtrl.value;
    if (search && search.length > 2) {
      this.filteredOwnersMulti = [];
      const owners = this.owners.filter(x => x.ownerName.toLocaleLowerCase().includes(search.toLowerCase()));
      owners.forEach(element => {
        const selectedIndx = this.selectedOwners.findIndex(x => x.ownerId === element.ownerId);
        if (selectedIndx === -1)
          this.filteredOwnersMulti.push(element);
      });

    }
    if (!search && search.length < 2) {
      return this.filteredOwnersMulti = this.owners;
    }
  }

  private getFinancialResources(
    ownerId: number,
    financialResourceTypeId: number
  ) {
    this.isLoading = true;
    this.financialResources = [];
    this.financialResourceControl.setValue("");
    this.financialResourceFilteredOptions =
      this.financialResourceControl.valueChanges.pipe(
        startWith(""),
        map((value) => this._financialResourceFilter(value))
      );
    this.financialResourceControl.setValidators(
      financialResourceForbiddenNamesValidator(this.financialResources)
    );

    let obj: FinancialResource = new FinancialResource();
    obj.ownerId = ownerId;
    obj.financialResourceTypeId = financialResourceTypeId;
    this.service.getFinancialResources(obj).subscribe((res) => {
      this.financialResources = res.data;
      this.financialResourceControl.setValidators(
        financialResourceForbiddenNamesValidator(this.financialResources)
      );
      this.isLoading = false;
      this.cdr.detectChanges();
    });
  }
  modifyOwners(event: {
    isUserInput: any;
    source: { value: any; selected: any, group: any };
  }, action: string) {

    if (event.isUserInput) {
      if (action === 'add') {
        const indx = this.filteredOwnersMulti.findIndex(x => x.ownerId === event.source.value);
        this.selectedOwners.push(this.filteredOwnersMulti[indx]);
        this.statementInfo.ownerIdList.push(this.filteredOwnersMulti[indx].ownerId);
        this.statementDetailInfo.ownerIdList.push(this.filteredOwnersMulti[indx].ownerId);
        this.filteredOwnersMulti.splice(indx, 1);

      }
      else {
        const indx = this.selectedOwners.findIndex(x => x.ownerId === event.source.value);
        this.filteredOwnersMulti.push(this.selectedOwners[indx]);
        this.statementInfo.ownerIdList.splice(indx, 1);
        this.statementDetailInfo.ownerIdList.splice(indx, 1);
        this.selectedOwners.splice(indx, 1);

      }

    }

  }
  setOwnerTypeValue(event: { isUserInput: any; source: { value: any } }) {
    if (event.isUserInput) {
      this.statementDetailInfo.ownerTypeId = event.source.value;
      this.statementInfo.ownerTypeId = event.source.value;
      this.statementDetailInfo.ownerIdList = [];
      this.statementInfo.ownerIdList = [];
      this.getOwners(event.source.value);
    }


  }
  setFinancialResourceTypeValue(event: {
    isUserInput: any;
    source: { value: any };
  }) {
    if (event.isUserInput) {
      this.statementDetailInfo.financialResourceTypeId = event.source.value;
      this.statementInfo.financialResourceTypeId = event.source.value;
      this.getFinancialResources(
        this.statementDetailInfo.ownerId,
        this.statementDetailInfo.financialResourceTypeId
      );
    }
  }
  setCreditValue(event: {
    isUserInput: any;
    source: { value: any };
  }) {
    if (event.isUserInput) {
      this.statementDetailInfo.credit = event.source.value;
      this.statementInfo.credit = event.source.value;
    }
  }

  setTransactionTypeValue(event: {
    isUserInput: any;
    source: { value: any; selected: any };
  }) {
    if (event.isUserInput) {
      if (event.source.value != 0 && event.source.selected) {
        this.statementDetailInfo.financialTransactionTypeIdList.push(
          event.source.value
        );
      } else if (event.source.value != 0 && !event.source.selected) {
        const index: number =
          this.statementDetailInfo.financialTransactionTypeIdList.indexOf(
            event.source.value
          );
        if (index !== -1)
          this.statementDetailInfo.financialTransactionTypeIdList.splice(
            index,
            1
          );
        this.frmAdvancedSearch.controls["transactionType"].setValue(
          this.statementDetailInfo.financialTransactionTypeIdList
        );
      }
    }
  }
  setFinancialResourceValue(event: {
    isUserInput: any;
    source: { value: any };
  }) {
    if (event.isUserInput) {
      const indx = this.financialResources.findIndex(
        (x) =>
          x.drpName.toLowerCase().replace(/\s/g, "") ===
          event.source.value.toLowerCase().replace(/\s/g, "")
      );
      if (indx === -1) {
        return;
      }
      this.statementInfo.financialResourceId =
        this.financialResources[indx].financialResourceId;
      this.statementDetailInfo.financialResourceId =
        this.financialResources[indx].financialResourceId;
    }
  }
  setFinancialYearValue(event: {
    isUserInput: any;
    source: { value: any; selected: any };
  }) {

    if (event.isUserInput) {
      if (event.source.selected) {
        this.statementDetailInfo.partitionKeyList.push(event.source.value);
      }
      else if (!event.source.selected) {
        const index: number = this.statementDetailInfo.partitionKeyList.indexOf(event.source.value);
        if (index !== -1)
          this.statementDetailInfo.partitionKeyList.splice(index, 1);

        this.frmAdvancedSearch.controls["year"].setValue(this.statementDetailInfo.partitionKeyList);
      }
    }


  }

  private getStatements(statements: Statement) {
    this.isLoading = true;
    this.service.getStatements(statements).subscribe((statements: any) => {
      this.reportType = this.frmAdvancedSearch.controls["reportType"].value;
      this.statementDetails = [];
      this.statements = statements.data.statements;
      this.isLoading = false;
      // this.setPaginatorAndSort();
      this._changeDetectorRef.markForCheck();
      this.cdr.detectChanges();
    });
  }

  private getStatementDetails(statementDetails: StatementDetail) {
    this.isLoading = true;
    this.service
      .getStatementDetails(statementDetails)
      .subscribe((statementDetails: any) => {
        this.reportType = this.frmAdvancedSearch.controls["reportType"].value;
        this.statements = [];
        this.statementDetails = statementDetails.data.statementDetails;
        this.isLoading = false;
        //this.setPaginatorAndSort();
        this._changeDetectorRef.markForCheck();
        this.cdr.detectChanges();
      });
  }

  private getOwnerTypes(): Observable<any> {
    return this.service.getOwnerTypes();
  }
  private getStatementsOnInit(): Observable<any> {
    this.pagination = new Paging();
    this.pagination.flag = true;
    this.pagination.length = 0;
    this.pagination.order = "desc";
    this.pagination.pageNumber = 1;
    this.pagination.pageSize = 2000;
    this.pagination.sort = "";
    this.statementInfo.page = this.pagination;
    return this.service.getStatementsOnInit(this.statementInfo);
  }
  public statementSearch() {
    this.pagination.flag = true;
    this.pagination.pageNumber = 1;
    this.pagination.length = 0;
    if (this.frmAdvancedSearch.controls["reportType"].value === 1) {
      this.pagination.order = "desc";
      this.statementInfo.balanceFrom =
        this.frmAdvancedSearch.controls["balanceFrom"].value;
      this.statementInfo.balanceTo =
        this.frmAdvancedSearch.controls["balanceTo"].value;
      this.statementInfo.page = this.pagination;
      this.getStatements(this.statementInfo);
    } else {
      this.pagination.order = "asc";
      this.statementDetailInfo.transactionLocalDateFrom =
        this.frmAdvancedSearch.controls["dateFrom"].value;
      this.statementDetailInfo.transactionLocalDateTo =
        this.frmAdvancedSearch.controls["dateTo"].value;
      this.statementDetailInfo.amountFrom =
        this.frmAdvancedSearch.controls["amountFrom"].value;
      this.statementDetailInfo.amountTo =
        this.frmAdvancedSearch.controls["amountTo"].value;
      this.statementDetailInfo.balanceFrom =
        this.frmAdvancedSearch.controls["balanceFrom"].value;
      this.statementDetailInfo.balanceTo =
        this.frmAdvancedSearch.controls["balanceTo"].value;
      this.statementDetailInfo.page = this.pagination;
      this.getStatementDetails(this.statementDetailInfo);
    }
  }

  public resetAdvancedSearch() {
    this.frmAdvancedSearch.controls["reportType"].setValue(1);
    this.frmAdvancedSearch.controls["year"].setValue(0);
    this.frmAdvancedSearch.controls["name"].setValue(null);
    this.frmAdvancedSearch.controls["parentCode"].setValue(null);
    this.frmAdvancedSearch.controls["parentName"].setValue(null);
  }
  changeReportType(event: {
    isUserInput: any;
    source: { value: any; selected: any };
  }) {
    if (event.isUserInput) {
      if (event.source.value === 1) {
        this.frmAdvancedSearch.controls["transactionType"].setValue("");
        this.frmAdvancedSearch.controls["dateFrom"].setValue("");
        this.frmAdvancedSearch.controls["dateTo"].setValue("");
        this.frmAdvancedSearch.controls["amountFrom"].setValue("");
        this.frmAdvancedSearch.controls["amountTo"].setValue("");
        this.frmAdvancedSearch.controls["transactionType"].disable();
        this.frmAdvancedSearch.controls["dateFrom"].disable();
        this.frmAdvancedSearch.controls["dateTo"].disable();
        this.frmAdvancedSearch.controls["amountFrom"].disable();
        this.frmAdvancedSearch.controls["amountTo"].disable();
      } else {
        this.frmAdvancedSearch.controls["transactionType"].enable();
        this.frmAdvancedSearch.controls["dateFrom"].enable();
        this.frmAdvancedSearch.controls["dateTo"].enable();
        this.frmAdvancedSearch.controls["amountFrom"].enable();
        this.frmAdvancedSearch.controls["amountTo"].enable();
      }
    }
  }
  handlePageEvent(event: PageEvent) {
    this.pagination.length = event.length;
    this.pagination.pageSize = event.pageSize;
    this.pagination.pageNumber = event.pageIndex + 1;
    this.pagination.flag = false;
    if (this.reportType == 1) {
      this.statementInfo.page = this.pagination;
      this.getStatements(this.statementInfo);
    } else {
      this.statementDetailInfo.page = this.pagination;
      this.getStatementDetails(this.statementDetailInfo);
    }
  }
  trackByFn(index: number, item: any): any {
    return item.id || index;
  }
  private _ownerFilter(value: string): Owner[] {
    const filterValue = value.toLowerCase().replace(" ", "");
    return this.owners.filter((option) =>
      option.ownerName.toLowerCase().replace(" ", "").includes(filterValue)
    );
  }
  private _financialResourceFilter(value: string): FinancialResource[] {
    const filterValue = value.toLowerCase().replace(" ", "");
    return this.financialResources.filter((option) =>
      option.financialResourceName
        .toLowerCase()
        .replace(" ", "")
        .includes(filterValue)
    );
  }
  exportTable() {
    let columns: Array<ExcelHeader> = new Array<ExcelHeader>();
    let obj: Array<Statement> = new Array<Statement>();
    let detailObj: Array<StatementDetail> = new Array<StatementDetail>();
    let amount: number = 0;
    let balance: number = 0;
    let qty: number = 0;
    let date = formatDate(new Date(), "yyyyMMdd_hhmmss", "en");
    let fileName: string = "Statement_".concat(date.toString());
    let logId: number = 0;

    if (this.reportType === 1) {
      columns.push({
        basedColumnName: "financialResourceName",
        excelColumnName: "Financial Resource",
      });
      columns.push({
        basedColumnName: "accountHolder",
        excelColumnName: "Account Holder",
      });
      columns.push({ basedColumnName: "bankName", excelColumnName: "Bank" });
      columns.push({
        basedColumnName: "chequeNumber",
        excelColumnName: "Cheque Number",
      });
      columns.push({ basedColumnName: "balance", excelColumnName: "Balance" });
    } else {
      columns.push({
        basedColumnName: "requestTypeName",
        excelColumnName: "Applicant",
      });
      columns.push({
        basedColumnName: "localChangeDate",
        excelColumnName: "Date",
      });
      columns.push({
        basedColumnName: "localChangeTime",
        excelColumnName: "Time",
      });
      columns.push({ basedColumnName: "amount", excelColumnName: "Amount" });
      columns.push({
        basedColumnName: "financialTransactionTypeName",
        excelColumnName: "Type",
      });
      columns.push({ basedColumnName: "balance", excelColumnName: "Balance" });
      columns.push({
        basedColumnName: "statementDescription",
        excelColumnName: "Description",
      });
    }

    if (this.reportType === 1)
      this.statements$.subscribe((items) =>
        items.forEach((element) => {
          qty = qty + 1;
          balance = balance + element.balance;
          obj.push(element);
        })
      );
    else
      this.statementDetails$.subscribe((items) =>
        items.forEach((element) => {
          qty = qty + 1;
          if (element.logId > logId) balance = element.balance;
          if (element.financialTransactionTypeId == 1001121)
            amount = amount + element.amount;
          else amount = amount - element.amount;
          detailObj.push(element);
        })
      );

    let footerData = [];
    if (this.reportType === 1) {
      footerData.push(["", "", "", "QTY", qty]);
      footerData.push([
        "",
        "",
        "",
        "BALANCE",
        balance.toString().concat(" IRR"),
      ]);
    } else {
      footerData.push(["", "", "", "", "", "QTY", qty]);
      footerData.push([
        "",
        "",
        "",
        "",
        "",
        "AMOUNT",
        amount.toString().concat(" IRR"),
      ]);
      footerData.push([
        "",
        "",
        "",
        "",
        "",
        "BALANCE",
        balance.toString().concat(" IRR"),
      ]);
    }
    if (this.reportType === 1)
      this.excelService.exportAsExcelFile(
        "Statement",
        "",
        columns,
        obj,
        footerData,
        fileName,
        "Sheet1"
      );
    else
      this.excelService.exportAsExcelFile(
        "Statement",
        "",
        columns,
        detailObj,
        footerData,
        fileName,
        "Sheet1"
      );

    obj = [];
    detailObj = [];
  }
  download() {
    let logId: number = 0;
    let ownerIndex: number;
    let financialResourceIndex: number;
    var pdf = new jsPDF("l");
    pdf.setFontSize(20);
    ownerIndex = this.owners.findIndex(
      (x) => x.ownerId === this.statementDetailInfo.ownerId
    );
    financialResourceIndex = this.financialResources.findIndex(
      (x) => x.financialResourceId === this.statementInfo.financialResourceId
    );
    if (this.reportType == 1)
      pdf.text("Statement-".concat(this.owners[ownerIndex].ownerName), 14, 8);
    else
      pdf.text(
        "Statement-"
          .concat(
            this.financialResources[financialResourceIndex]
              .financialResourceName
          )
          .concat("-")
          .concat(this.financialResources[financialResourceIndex].accountHolder)
          .concat("-")
          .concat(this.financialResources[financialResourceIndex].bankName),
        14,
        8
      );

    pdf.setFontSize(12);
    pdf.setTextColor(99);
    let header = [];
    let tableData = [];
    let footer = [];
    let balance: number = 0;
    let amount: number = 0;
    let qty: number = 0;
    let date = formatDate(new Date(), "yyyyMMdd_hhmmss", "en");
    let fileName: string = "Statement_".concat(date.concat(".pdf"));
    if (this.reportType === 1)
      header = [
        { header: "Financial Resource", dataKey: "financialResourceName" },
        { header: "Account Holder", dataKey: "accountHolder" },
        { header: "Bank", dataKey: "bankName" },
        { header: "Cheque Number", dataKey: "chequeNumber" },
        { header: "Balance", dataKey: "balance" },
      ];
    else
      header = [
        { header: "Applicant", dataKey: "requestTypeName" },
        { header: "Date", dataKey: "localChangeDate" },
        { header: "Time", dataKey: "localChangeTime" },
        { header: "Amount", dataKey: "amount" },
        { header: "Type", dataKey: "financialTransactionTypeName" },
        { header: "Balance", dataKey: "balance" },
        { header: "Description", dataKey: "statementDescription" },
      ];

    if (this.reportType == 1)
      this.statements$.subscribe((items) =>
        items.forEach((element) => {
          qty = qty + 1;
          balance = balance + element.balance;
          tableData.push([
            element.financialResourceName,
            element.accountHolder,
            element.bankName,
            element.chequeNumber,
            this.transformDecimal(element.balance),
          ]);
        })
      );
    else
      this.statementDetails$.subscribe((items) =>
        items.forEach((element) => {
          qty = qty + 1;
          if (element.logId > logId) balance = element.balance;
          if (element.financialTransactionTypeId == 1001121)
            amount = amount + element.amount;
          else amount = amount - element.amount;
          tableData.push([
            element.requestTypeName,
            element.localChangeDate,
            element.localChangeTime,
            this.transformDecimal(element.amount),
            element.financialTransactionTypeName,
            this.transformDecimal(element.balance),
            element.statementDescription,
          ]);
        })
      );

    if (this.reportType === 1)
      footer = [
        ["QTY", "", "", "", qty],
        [
          "TOTAL",
          "",
          "",
          "",
          this.transformDecimal(balance).toString().concat(" IRR"),
        ],
      ];
    else
      footer = [
        ["QTY", "", "", "", "", "", qty],
        [
          "AMOUNT",
          "",
          "",
          "",
          "",
          "",
          this.transformDecimal(amount).toString().concat(" IRR"),
        ],
        [
          "BALANCE",
          "",
          "",
          "",
          "",
          "",
          this.transformDecimal(balance).toString().concat(" IRR"),
        ],
      ];

    (pdf as any).autoTable({
      columns: header,
      columnStyles: { name: { cellWidth: 50 } },
      body: tableData,
      foot: footer,
      footStyles: { fillColor: [223, 223, 223], textColor: [0, 0, 0] },
      theme: "grid",
      showFoot: "lastPage",
    });

    pdf.output("dataurlnewwindow");

    // Download PDF doc
    pdf.save(fileName);
  }

  transformDecimal(num) {
    return num === 0 ? 0 : this._decimalPipe.transform(num, "1.0-5");
  }
  openDetailDialog(requestId: number, requestDetailId: number, requestTypeId: number, chequeId: string) {
    let configForm: FormGroup = this._formBuilder.group({
      requestId: requestId,
      requestTypeId: requestTypeId,
      requestDetailId: requestDetailId,
      chequeId: chequeId,
      title: 'Transaction Detail'
    });
    const dialogRef = this._dialogService.open(configForm.value);
    dialogRef.afterClosed().subscribe((result) => {
      /*    if (result !== 'cancelled')
             this.categoryTreeModification(result, 0, 0, 'new'); */
    });
  }
}

export function ownerForbiddenNamesValidator(owners: Owner[]): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    // below findIndex will check if control.value is equal to one of our options or not
    const index = owners.findIndex((debtor) => {
      return (
        debtor.ownerName.toLowerCase().replace(/\s/g, "") ==
        control.value.toLowerCase().replace(/\s/g, "")
      );
    });
    return index < 0 ? { forbiddenNames: { value: control.value } } : null;
  };
}
export function financialResourceForbiddenNamesValidator(
  financialResources: FinancialResource[]
): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    // below findIndex will check if control.value is equal to one of our options or not
    const index = financialResources.findIndex((financialResource) => {
      return (financialResource.financialResourceName
        .toLowerCase()
        .replace(/\s/g, "") ==
        control.value) ==
        null
        ? ""
        : control.value.toLowerCase().replace(/\s/g, "");
    });
    return index < 0 && control.value.toString().length > 0
      ? { forbiddenNames: { value: control.value } }
      : null;
  };
}
