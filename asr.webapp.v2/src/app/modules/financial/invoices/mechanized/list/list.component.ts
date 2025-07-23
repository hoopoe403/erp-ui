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
import { InvoiceService } from "../invoice.service";
import { Invoice } from "../invoice.types";
import { Paging } from "app/core/type/paging/paging.type";
import { FormControl, FormGroup } from "@angular/forms";
import { MatMenuTrigger } from "@angular/material/menu";
import { ExcelHeader } from "app/shared/excel/excel.types";
import { DecimalPipe, formatDate } from "@angular/common";
import { ExcelService } from "app/shared/excel/excel.service";
import jsPDF from "jspdf";

@Component({
  selector: "invoices-list",
  templateUrl: "./list.component.html",
  styles: [
    /* language=SCSS */
    `
      .invoices-grid {
        grid-template-columns: 100px auto 40px;

        @screen sm {
          grid-template-columns: 100px auto 100px 70px;
        }

        @screen md {
          grid-template-columns: 100px auto 150px 370px 150px 70px;
        }

        @screen lg {
          grid-template-columns: 100px auto 150px 300px 100px 70px;
        }
        @screen print {
          grid-template-columns: 100px 370px 370px 70px;
        }
      }
    `,
  ],
  animations: fuseAnimations,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceListComponent implements OnInit, OnDestroy {
  protected _onDestroy = new Subject<void>();
  @ViewChild(MatPaginator) private _paginator: MatPaginator;
  @ViewChild(MatSort) private _sort: MatSort;
  pagination: Paging;
  selection = new SelectionModel<any>(true, []);
  invoiceInfo: Invoice;
  statuses = [];
  defaultStatuses = [];
  frmAdvancedSearch = new FormGroup({
    invoiceNumber: new FormControl(),
    issuerType: new FormControl(),
    issuer: new FormControl(),
    sourceCode: new FormControl(),
    referenceNo: new FormControl(),
    totalFrom: new FormControl(),
    totalTo: new FormControl(),
    status: new FormControl(),
  });

  searchInputControl: FormControl = new FormControl();

  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;

  // Private
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  isLoading: boolean;

  constructor(
    private service: InvoiceService,
    private _decimalPipe: DecimalPipe,
    private excelService: ExcelService,
    private cdr: ChangeDetectorRef,
    private _changeDetectorRef: ChangeDetectorRef
  ) {
    //this._unsubscribeAll = new Subject();

    this.invoiceInfo = new Invoice();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------
  isOverlayOpen: boolean = true;
  selectedInfoRow: Invoice = new Invoice();

  invoices$: Observable<Invoice[]> = new Observable<Invoice[]>();
  invoices: Array<Invoice> = [];
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

    this.searchInputControl.valueChanges
      .pipe(
        takeUntil(this._unsubscribeAll),
        debounceTime(300),
        switchMap((query) => {
          this.isLoading = true;
          return this.service.getInvoices(this.invoiceInfo);
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
            this.invoiceInfo.page = this.pagination;
            return this.service.getInvoices(this.invoiceInfo);
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
    this.service.disposeInvoices$();
    this.service.disponsePaginator$();
  }
  private setForkJoinValues(values: Array<any>): void {
    this.statuses = values[0].data;
    this.defaultStatuses = [];
    this.statuses.forEach((element) => {
      if (element.isDefault === 1) this.defaultStatuses.push(element.statusId);
    });
    this.frmAdvancedSearch.controls["status"].setValue(this.defaultStatuses);
    this.invoiceInfo.statusIdList = this.defaultStatuses;
    this.invoices = values[1].data.invoices;
    this.invoices$ = this.service.invoices$;
    this._changeDetectorRef.markForCheck();
    this.cdr.detectChanges();
    this.setPaginatorAndSort();
  }
  private loadData(): void {
    forkJoin(this.getStatuses(), this.getInvoicesOnInit()).subscribe((res) => {
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
        this.invoiceInfo.statusIdList.push(event.source.value);
      } else if (event.source.value != 0 && !event.source.selected) {
        const index: number = this.invoiceInfo.statusIdList.indexOf(
          event.source.value
        );
        if (index !== -1) this.invoiceInfo.statusIdList.splice(index, 1);
        this.frmAdvancedSearch.controls["status"].setValue(
          this.invoiceInfo.statusIdList
        );
      }
    }
  }
  private getInvoices(invoiceInfo: Invoice) {
    this.isLoading = true;
    this.service
      .getInvoices(invoiceInfo)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((invoices: any) => {
        this.invoices = invoices.data.invoices;
        this.invoices$ = this.service.invoices$;
        this._changeDetectorRef.markForCheck();
        this.cdr.detectChanges();
        this.isLoading = false;
      });
  }

  private getInvoicesOnInit(): Observable<any> {
    this.pagination = new Paging();
    this.pagination.flag = true;
    this.pagination.length = 0;
    this.pagination.order = "desc";
    this.pagination.pageNumber = 1;
    this.pagination.pageSize = 400;
    this.pagination.sort = "";
    this.invoiceInfo.page = this.pagination;
    return this.service.getInvoicesInOnInit(this.invoiceInfo);
  }
  public invoicesSearch() {
    this.invoiceInfo.invoiceNumber =
      this.frmAdvancedSearch.controls["invoiceNumber"].value;
    this.invoiceInfo.ownerTypeIdList =
      this.frmAdvancedSearch.controls["issuerType"].value;
    this.invoiceInfo.ownerName =
      this.frmAdvancedSearch.controls["issuer"].value;
    this.invoiceInfo.requestCode =
      this.frmAdvancedSearch.controls["sourceCode"].value;
    this.invoiceInfo.referenceNo =
      this.frmAdvancedSearch.controls["referenceNo"].value;
    this.invoiceInfo.totalFrom =
      this.frmAdvancedSearch.controls["totalFrom"].value;
    this.invoiceInfo.totalTo = this.frmAdvancedSearch.controls["totalTo"].value;
    this.pagination.flag = true;
    this.pagination.pageNumber = 1;
    this.pagination.length = 0;
    this.invoiceInfo.page = this.pagination;
    this.getInvoices(this.invoiceInfo);
  }

  public resetAdvancedSearch() {
    this.frmAdvancedSearch.controls["code"].setValue(null);
    this.frmAdvancedSearch.controls["name"].setValue(null);
    this.frmAdvancedSearch.controls["parentCode"].setValue(null);
    this.frmAdvancedSearch.controls["parentName"].setValue(null);
    this.frmAdvancedSearch.controls["status"].setValue(this.defaultStatuses);
  }

  handlePageEvent(event: PageEvent) {
    this.pagination.length = event.length;
    this.pagination.pageSize = event.pageSize;
    this.pagination.pageNumber = event.pageIndex + 1;
    this.pagination.flag = false;
  }
  trackByFn(index: number, item: any): any {
    return item.id || index;
  }

  download() {
    var pdf = new jsPDF("l");

    pdf.setFontSize(20);
    pdf.text("MechanizedInvoice", 14, 8);
    pdf.setFontSize(12);
    pdf.setTextColor(99);
    let header = [];
    let tableData = [];
    let footer = [];
    let qty: number = 0;
    let date = formatDate(new Date(), "yyyyMMdd_hhmmss", "en");
    let fileName: string = "MechanizedInvoice_".concat(date.concat(".pdf"));

    header = [
      { header: "Number", dataKey: "invoiceNumber" },
      { header: "Issuer", dataKey: "ownerName" },
      { header: "Source", dataKey: "requestTypeName" },
      { header: "Total", dataKey: "total" },
      { header: "Status", dataKey: "statusDescription" }
    ];

    this.invoices$.subscribe((items) =>
      items.forEach((element) => {
        qty = qty + 1;
        tableData.push([
          element.invoiceNumber,
          element.ownerName,
          element.requestTypeName,
          this.transformDecimal(element.total),
          element.statusDescription,
        ]);
      })
    );
    footer = [
      ["QTY", "", "", "", qty]
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


  exportTable() {
    let columns: Array<ExcelHeader> = new Array<ExcelHeader>();
    let obj: Array<Invoice> = new Array<Invoice>();
    let qty: number = 0;
    let date = formatDate(new Date(), "yyyyMMdd_hhmmss", "en");
    let fileName: string = "MechanizedInvoice_".concat(date.toString());

    columns.push({ basedColumnName: "invoiceNumber", excelColumnName: "Number" });
    columns.push({
      basedColumnName: "ownerName",
      excelColumnName: "Issuer",
    });
    columns.push({
      basedColumnName: "requestTypeName",
      excelColumnName: "Source",
    });
    columns.push({
      basedColumnName: "total",
      excelColumnName: "Total",
    });
    columns.push({
      basedColumnName: "statusDescription",
      excelColumnName: "Status",
    });

    this.invoices$.subscribe((items) =>
      items.forEach((element) => {
        qty = qty + 1;
        obj.push(element);
      })
    );
    let footerData = [];

    footerData.push(["", "", "", "QTY", qty]);

    this.excelService.exportAsExcelFile(
      "MechanizedInvoice",
      "",
      columns,
      obj,
      footerData,
      fileName,
      "Sheet1"
    );

    obj = [];

  }

  transformDecimal(num) {
    return num === 0 ? 0 : this._decimalPipe.transform(num, "1.0-5");
  }
}
