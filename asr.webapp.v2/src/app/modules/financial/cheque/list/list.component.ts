import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  ViewEncapsulation,
} from "@angular/core";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { Subject, merge, Observable, forkJoin, Subscription, fromEvent } from "rxjs";
import { switchMap, map, filter, take } from "rxjs/operators";
import { takeUntil } from "rxjs/operators";
import { fuseAnimations } from "../../../../../@fuse/animations";
import { ChequeService } from "../cheque.service";
import { Cheque } from "../cheque.types";
import { Paging } from "app/core/type/paging/paging.type";
import { FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { MatMenuTrigger } from "@angular/material/menu";
import { Bank } from "../../transactions/revenue/revenue.types";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { DecimalPipe, formatDate } from "@angular/common";
import { ExcelService } from "app/shared/excel/excel.service";
import { ExcelHeader } from "app/shared/excel/excel.types";
import { DialogService } from "../details/dialog.service";
import { HistoryDialogService } from "../details/dialog.service";
import { ChequeInfoDialogService } from "../details/dialog.service";
import { OwnerType } from "app/modules/configuration/owner/owner.types";
import { ChequeType } from "../../shared/financial.types";
import { Overlay, OverlayRef } from "@angular/cdk/overlay";
import { TemplatePortal } from '@angular/cdk/portal';


@Component({
  selector: "cheque-list",
  templateUrl: "./list.component.html",
  styles: [
    /* language=SCSS */
    `
      .cheques-grid {
        grid-template-columns: auto 100px 100px 70px;

        @screen sm {
          grid-template-columns: auto 100px 100px 70px;
        }

        @screen md {
          grid-template-columns: auto 100px 100px 70px;
        }

        @screen lg {
          grid-template-columns: auto 200px 200px 120px 90px 100px 130px 90px 30px;
        }
        @screen print {
          grid-template-columns: 100px 370px 370px 70px;
        }
      }
    `,
  ],
  styleUrls: ['../../../../layout/common/right-click-menu/right-click.scss'],
  animations: fuseAnimations,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChequeListComponent implements OnInit, OnDestroy {
  protected _onDestroy = new Subject<void>();
  @ViewChild(MatPaginator) private _paginator: MatPaginator;
  @ViewChild(MatSort) private _sort: MatSort;
  @ViewChild('userMenu') userMenu: TemplateRef<any>;
  statuses = [];
  defaultStatuses = [];
  pagination: Paging;
  chequeInfo: Cheque;
  banks: Array<Bank> = [];
  ownerTypes: Array<OwnerType> = [];
  chequeTypes: Array<ChequeType> = [];
  amountFrom: number;
  amountTo: number;
  sub: Subscription;
  overlayRef: OverlayRef | null;
  frmAdvancedSearch = new FormGroup({
    status: new FormControl(),
    bank: new FormControl(),
    payerType: new FormControl(),
    payer: new FormControl(),
    chequeType: new FormControl([]),
    recipientType: new FormControl(),
    recipient: new FormControl(),
    firstPayerType: new FormControl(),
    firstPayer: new FormControl(),
    chequeNumber: new FormControl(),
    dueDateFrom: new FormControl(),
    dueDateTo: new FormControl(),
    amountFrom: new FormControl(),
    amountTo: new FormControl(),
  });

  searchInputControl: FormControl = new FormControl();

  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;

  // Private
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  isLoading: boolean;

  constructor(
    public overlay: Overlay,
    private service: ChequeService,
    private cdr: ChangeDetectorRef,
    private _formBuilder: FormBuilder,
    public viewContainerRef: ViewContainerRef,
    private _decimalPipe: DecimalPipe,
    private excelService: ExcelService,
    private _dialogService: DialogService,
    private _HistoryDialogService: HistoryDialogService,
    private _ChequeInfoDialogService: ChequeInfoDialogService,
    private _changeDetectorRef: ChangeDetectorRef
  ) {
    //this._unsubscribeAll = new Subject();
    this.chequeInfo = new Cheque();
    this.chequeInfo.statusIdList = [];
    this.chequeInfo.bankIdList = [];
    this.chequeInfo.payerTypeIdList = [];
    this.chequeInfo.recipientTypeIdList = [];
    this.chequeInfo.chequeTypeIdList = [];
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------
  selectedInfoDetailRow: Cheque = new Cheque();

  cheques: Array<Cheque> = [];
  /**
   * On init
   */

  get cheques$(): Observable<Cheque[]> {
    return this.service.cheques$;
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

    this.loadData();
  }

  private setPaginatorAndSort(): void {
    if (this._sort && this._paginator) {
      // Set the initial sort
      this._sort.sort({
        id: "",
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
            this.pagination.sort = this._sort.active;

            this.chequeInfo.page = this.pagination;
            return this.service.getCheques(this.chequeInfo);
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
    this.service.disposeCheques$();
    this.service.disponsePaginator$();
  }
  private setForkJoinValues(values: Array<any>): void {
    this.statuses = values[0].data;
    this.defaultStatuses = [];
    this.statuses.forEach((element) => {
      if (element.isDefault === 1) this.defaultStatuses.push(element.statusId);
    });
    this.frmAdvancedSearch.controls["status"].setValue(this.defaultStatuses);
    this.chequeInfo.statusIdList = this.defaultStatuses;
    this.cheques = values[1].data.cheques;
    this.banks = values[2].data;
    this.ownerTypes = values[3].data;
    this.chequeTypes = values[4].data;
    this._changeDetectorRef.markForCheck();
    this.cdr.detectChanges();
    this.setPaginatorAndSort();
  }
  private loadData(): void {
    forkJoin(
      this.getStatuses(),
      this.getChequesOnInit(),
      this.getBanks(),
      this.getOwnerTypes(),
      this.getChequeTypes(),
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
        this.chequeInfo.statusIdList.push(event.source.value);
      } else if (event.source.value != 0 && !event.source.selected) {
        const index: number = this.chequeInfo.statusIdList.indexOf(
          event.source.value
        );
        if (index !== -1) this.chequeInfo.statusIdList.splice(index, 1);
        this.frmAdvancedSearch.controls["status"].setValue(
          this.chequeInfo.statusIdList
        );
      }
    }
  }

  setChequeTypeValue(event: {
    isUserInput: any;
    source: { value: any; selected: any };
  }) {
    if (event.isUserInput) {
      if (event.source.value != 0 && event.source.selected) {
        this.chequeInfo.chequeTypeIdList.push(event.source.value);
      } else if (event.source.value != 0 && !event.source.selected) {
        const index: number = this.chequeInfo.chequeTypeIdList.indexOf(
          event.source.value
        );
        if (index !== -1) this.chequeInfo.chequeTypeIdList.splice(index, 1);
        this.frmAdvancedSearch.controls["status"].setValue(
          this.chequeInfo.chequeTypeIdList
        );
      }
    }
  }

  setBankValue(event: {
    isUserInput: any;
    source: { value: any; selected: any };
  }) {
    if (event.isUserInput) {
      if (event.source.value != 0 && event.source.selected) {
        this.chequeInfo.bankIdList.push(event.source.value);
      } else if (event.source.value != 0 && !event.source.selected) {
        const index: number = this.chequeInfo.bankIdList.indexOf(
          event.source.value
        );
        if (index !== -1) this.chequeInfo.bankIdList.splice(index, 1);
        this.frmAdvancedSearch.controls["bank"].setValue(
          this.chequeInfo.bankIdList
        );
      }
    }
  }

  setPayerTypeValue(event: {
    isUserInput: any;
    source: { value: any; selected: any };
  }) {
    if (event.isUserInput) {
      if (event.source.value != 0 && event.source.selected) {
        this.chequeInfo.payerTypeIdList.push(event.source.value);
      } else if (event.source.value != 0 && !event.source.selected) {
        const index: number = this.chequeInfo.payerTypeIdList.indexOf(
          event.source.value
        );
        if (index !== -1) this.chequeInfo.payerTypeIdList.splice(index, 1);
        this.frmAdvancedSearch.controls["payerType"].setValue(
          this.chequeInfo.payerTypeIdList
        );
      }
    }
  }

  setRecipientTypeValue(event: {
    isUserInput: any;
    source: { value: any; selected: any };
  }) {
    if (event.isUserInput) {
      if (event.source.value != 0 && event.source.selected) {
        this.chequeInfo.recipientTypeIdList.push(event.source.value);
      } else if (event.source.value != 0 && !event.source.selected) {
        const index: number = this.chequeInfo.recipientTypeIdList.indexOf(
          event.source.value
        );
        if (index !== -1) this.chequeInfo.recipientTypeIdList.splice(index, 1);
        this.frmAdvancedSearch.controls["recipientType"].setValue(
          this.chequeInfo.recipientTypeIdList
        );
      }
    }
  }
  setFirstPayerTypeValue(event: {
    isUserInput: any;
    source: { value: any; selected: any };
  }) {
    if (event.isUserInput) {
      if (event.source.value != 0 && event.source.selected) {
        this.chequeInfo.firstPayerTypeIdList.push(event.source.value);
      } else if (event.source.value != 0 && !event.source.selected) {
        const index: number = this.chequeInfo.firstPayerTypeIdList.indexOf(
          event.source.value
        );
        if (index !== -1) this.chequeInfo.firstPayerTypeIdList.splice(index, 1);
        this.frmAdvancedSearch.controls["firstPayerType"].setValue(
          this.chequeInfo.firstPayerTypeIdList
        );
      }
    }
  }

  private getCheques(chequeInfo: Cheque) {
    this.isLoading = true;
    this.service.getCheques(chequeInfo).subscribe((cheques: any) => {
      this.cheques = cheques.data.cheques;
      this._changeDetectorRef.markForCheck();
      this.cdr.detectChanges();
      this.isLoading = false;
      this.setPaginatorAndSort();
    });
  }

  private getChequesOnInit(): Observable<any> {
    this.pagination = new Paging();
    this.pagination.flag = true;
    this.pagination.length = 0;
    this.pagination.order = "asc";
    this.pagination.pageNumber = 1;
    this.pagination.pageSize = 2000;
    this.pagination.sort = "";
    this.chequeInfo.page = this.pagination;
    return this.service.getChequesOnInit(this.chequeInfo);
  }
  private getBanks(): Observable<any> {
    return this.service.getBanks();
  }
  private getOwnerTypes(): Observable<any> {
    return this.service.getOwnerTypes();
  }
  private getChequeTypes(): Observable<any> {
    return this.service.getChequeTypes();
  }
  public chequesSearch() {
    this.pagination.flag = true;
    this.pagination.pageNumber = 1;
    this.pagination.length = 0;

    this.chequeInfo.payerName = this.frmAdvancedSearch.controls["payer"].value;
    this.chequeInfo.recipientName =
      this.frmAdvancedSearch.controls["recipient"].value;
    this.chequeInfo.firstPayerName =
      this.frmAdvancedSearch.controls["firstPayer"].value;
    this.chequeInfo.chequeNumber =
      this.frmAdvancedSearch.controls["chequeNumber"].value;
    this.chequeInfo.chequeLocalDateFrom =
      this.frmAdvancedSearch.controls["dueDateFrom"].value;
    this.chequeInfo.chequeLocalDateTo =
      this.frmAdvancedSearch.controls["dueDateTo"].value;
    this.chequeInfo.amountFrom = this.amountFrom;
    this.chequeInfo.amountTo = this.amountTo;
    this.chequeInfo.page = this.pagination;
    console.log(this.chequeInfo);
    this.getCheques(this.chequeInfo);
  }

  public resetAdvancedSearch() {
    this.frmAdvancedSearch.controls["status"].setValue(this.defaultStatuses);
    this.chequeInfo.statusIdList = this.defaultStatuses;
    this.frmAdvancedSearch.controls["bank"].setValue([]);
    this.chequeInfo.bankIdList = [];
    this.frmAdvancedSearch.controls["payerType"].setValue([]);
    this.frmAdvancedSearch.controls["chequeTypeId"].setValue([]);
    this.chequeInfo.payerTypeIdList = [];
    this.frmAdvancedSearch.controls["recipientType"].setValue([]);
    this.chequeInfo.recipientTypeIdList = [];
    this.frmAdvancedSearch.controls["payer"].setValue("");
    this.frmAdvancedSearch.controls["recipient"].setValue("");
    this.frmAdvancedSearch.controls["chequeNumber"].setValue("");
    this.frmAdvancedSearch.controls["dueDateFrom"].setValue("");
    this.frmAdvancedSearch.controls["dueDateTo"].setValue("");
    this.frmAdvancedSearch.controls["amountFrom"].setValue("");
    this.frmAdvancedSearch.controls["amountTo"].setValue("");
  }

  handlePageEvent(event: PageEvent) {
    this.pagination.length = event.length;
    this.pagination.pageSize = event.pageSize;
    this.pagination.pageNumber = event.pageIndex + 1;
    this.pagination.flag = false;
    this.chequeInfo.page = this.pagination;
    this.getCheques(this.chequeInfo);
  }
  trackByFn(index: number, item: any): any {
    return item.id || index;
  }

  exportTable() {
    let columns: Array<ExcelHeader> = new Array<ExcelHeader>();
    let obj: Array<Cheque> = new Array<Cheque>();
    let amount: number = 0;
    let qty: number = 0;
    let date = formatDate(new Date(), "yyyyMMdd_hhmmss", "en");
    let fileName: string = "Cheque_".concat(date.toString());

    columns.push({ basedColumnName: "payerName", excelColumnName: "Payer" });
    columns.push({
      basedColumnName: "payerTypeName",
      excelColumnName: "Payer Type",
    });
    columns.push({
      basedColumnName: "recipientName",
      excelColumnName: "Recipient",
    });
    columns.push({
      basedColumnName: "recipientTypeName",
      excelColumnName: "Recipient Type",
    });
    columns.push({
      basedColumnName: "firstPayerName",
      excelColumnName: "First Payer",
    });
    columns.push({
      basedColumnName: "firstPayerTypeName",
      excelColumnName: "First Payer Type",
    });
    columns.push({
      basedColumnName: "chequeNumber",
      excelColumnName: "Number",
    });
    columns.push({ basedColumnName: "bankName", excelColumnName: "Bank" });
    columns.push({ basedColumnName: "amount", excelColumnName: "Amount" });
    columns.push({
      basedColumnName: "chequeLocalDate",
      excelColumnName: "Due Date",
    });
    columns.push({
      basedColumnName: "financialResourceName",
      excelColumnName: "Resource",
    });
    columns.push({
      basedColumnName: "chequeTypeName",
      excelColumnName: "Cheque Type",
    });
    columns.push({
      basedColumnName: "statusDescription",
      excelColumnName: "Status",
    });

    this.cheques$.subscribe((items) =>
      items.forEach((element) => {
        qty = qty + 1;
        amount = amount + element.amount;
        obj.push(element);
      })
    );

    let footerData = [];

    footerData.push(["", "", "", "", "", "", "", "", "", "", "", "QTY", qty]);
    footerData.push(["", "", "", "", "", "", "", "", "", "", "", "AMOUNT", amount.toString().concat(" IRR"),]);

    this.excelService.exportAsExcelFile(
      "Cheque",
      "",
      columns,
      obj,
      footerData,
      fileName,
      "Sheet1"
    );

    obj = [];
  }
  download() {
    var pdf = new jsPDF("l");

    pdf.setFontSize(20);
    pdf.text("Cheque", 14, 8);
    pdf.setFontSize(12);
    pdf.setTextColor(99);
    let header = [];
    let tableData = [];
    let footer = [];
    let amount: number = 0;
    let qty: number = 0;
    let date = formatDate(new Date(), "yyyyMMdd_hhmmss", "en");
    let fileName: string = "Cheque_".concat(date.concat(".pdf"));

    header = [
      { header: "Payer", dataKey: "payerName" },
      { header: "Recipient", dataKey: "recipientName" },
      { header: "First Payer", dataKey: "firstPayerName" },
      { header: "Number", dataKey: "chequeNumber" },
      { header: "Bank", dataKey: "bankName" },
      { header: "Amount", dataKey: "amount" },
      { header: "Due Date", dataKey: "chequeLocalDate" },
      { header: "Cheque Type", dataKey: "chequeTypeName" },
      { header: "Status", dataKey: "statusDescription" },
    ];

    this.cheques$.subscribe((items) =>
      items.forEach((element) => {
        qty = qty + 1;
        amount = amount + element.amount;
        tableData.push([
          element.payerName,
          element.recipientName,
          element.firstPayerName,
          element.chequeNumber,
          element.bankName,
          this.transformDecimal(element.amount),
          element.chequeLocalDate,
          element.chequeTypeName,
          element.statusDescription,
        ]);
      })
    );

    footer = [
      ["QTY", "", "", "", "", "", "", "", qty],
      ["AMOUNT", "", "", "", "", "", "", "", this.transformDecimal(amount).toString().concat(" IRR"),
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

    // Open PDF document in browser's new tab
    pdf.output("dataurlnewwindow");

    // Download PDF doc
    pdf.save(fileName);
  }

  openDialog(chequeId: number, status: number, requestType: string) {
    let title: string;
    let bottomLabel: string;
    if (requestType === "cash") {
      title = "Cash The Cheque";
      bottomLabel = "Cash";
    } else if (requestType === "bounce") {
      title = "Bounce The Cheque";
      bottomLabel = "Bounce";
    } else if (requestType === "refund") {
      title = "Refund Cheque";
      bottomLabel = "Refund";
    }
    let configForm: FormGroup = this._formBuilder.group({
      chequeId: chequeId,
      title: title,
      requestType: requestType,
      actions: this._formBuilder.group({
        cash: this._formBuilder.group({
          show: true,
          label: bottomLabel,
          color: "primary",
          disabled:
            status !== 1000082 && status !== 1000085 && status !== 1000084 && status !== 1000087
              ? true
              : false,
        }),
        cancel: this._formBuilder.group({
          show: true,
          label: status !== 1000082 && status !== 1000085 ? "Close" : "Cancel",
        }),
      }),
      dismissible: this._formBuilder.group({
        show: true,
        disabled:
          status !== 1000082 && status !== 1000085 && status !== 1000084
            ? false
            : true,
      }),
    });
    const dialogRef = this._dialogService.open(configForm.value);
    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.getCheques(this.chequeInfo);
    });
  }

  openChequeHistoryDialog(chequeId: number) {
    let title: string;
    title = 'Cheque History';
    let configForm: FormGroup = this._formBuilder.group({
      chequeId: chequeId,
      title: title,
      dismissible: this._formBuilder.group({
        show: true,
        disabled: false
      })
    });
    this.close();
    const dialogRef = this._HistoryDialogService.open(configForm.value);
    dialogRef.afterClosed().subscribe((result) => {


    });
  }
  openChequeInfoDialog(chequeId: number) {
    let title: string;
    title = 'Cheque Information';
    let configForm: FormGroup = this._formBuilder.group({
      chequeId: chequeId,
      title: title,
      dismissible: this._formBuilder.group({
        show: true,
        disabled: false
      })
    });
    this.close();
    const dialogRef = this._ChequeInfoDialogService.open(configForm.value);
    dialogRef.afterClosed().subscribe((result) => {


    });
  }


  transformDecimal(num) {
    return num === 0 ? 0 : this._decimalPipe.transform(num, "1.0-5");
  }
  processAmountFrom(amount: string) {
    let result: string;
    let counter: number = 0;
    amount = amount.replace(/,/g, '');
    if (!/^\d+$/.test(amount)) {
      result = amount.substring(0, amount.length - 1);
      this.amountFrom = 0;
    }
    else {
      this.amountFrom = Number(amount);
      for (let index = amount.length; index > 0; index--) {

        if (index === amount.length)
          result = amount.substring(index - 1, index);
        else {
          if (counter % 3 === 0)
            result = ','.concat(result);

          result = amount.substring(index - 1, index).concat(result);
        }
        counter = counter + 1;
      }
    }

    this.frmAdvancedSearch.controls["amountFrom"].setValue(result);
  }

  processAmountTo(amount: string) {
    let result: string;
    let counter: number = 0;
    amount = amount.replace(/,/g, '');
    if (!/^\d+$/.test(amount)) {
      result = amount.substring(0, amount.length - 1);
      this.amountTo = 0;
    }
    else {
      this.amountTo = Number(amount);
      for (let index = amount.length; index > 0; index--) {

        if (index === amount.length)
          result = amount.substring(index - 1, index);
        else {
          if (counter % 3 === 0)
            result = ','.concat(result);

          result = amount.substring(index - 1, index).concat(result);
        }
        counter = counter + 1;
      }
    }

    this.frmAdvancedSearch.controls["amountTo"].setValue(result);
  }
  open({ x, y }: MouseEvent, customer) {
    this.close();
    const positionStrategy = this.overlay.position()
      .flexibleConnectedTo({ x, y })
      .withPositions([
        {
          originX: 'end',
          originY: 'bottom',
          overlayX: 'end',
          overlayY: 'top',
        }
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.close()
    });

    this.overlayRef.attach(new TemplatePortal(this.userMenu, this.viewContainerRef, {
      $implicit: customer
    }));


    this.sub = fromEvent<MouseEvent>(document, 'click')
      .pipe(
        filter(event => {
          const clickTarget = event.target as HTMLElement;
          return !!this.overlayRef && !this.overlayRef.overlayElement.contains(clickTarget);
        }),
        take(1)
      ).subscribe(() => this.close())
  }
  close() {
    this.sub && this.sub.unsubscribe();
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }
}
