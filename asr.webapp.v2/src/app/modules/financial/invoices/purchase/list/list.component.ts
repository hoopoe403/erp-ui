import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { Subject, merge, Observable, forkJoin } from 'rxjs';
import { debounceTime, switchMap, map } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';
import { fuseAnimations } from "../../../../../../@fuse/animations";
import { PurchaseInvoiceService } from "../purchase-invoice.service";
import { PurchaseInvoice, PurchaseInvoiceListView } from "../purchase-invoice.types";
import { ActivatedRoute } from '@angular/router';
import {
    PURCHASE_INVOICE_STATUS_APPROVED, PURCHASE_INVOICE_STATUS_CANCELLED, PURCHASE_INVOICE_STATUS_DRAFT,
    PURCHASE_INVOICE_STATUS_PENDING_APPROVAL, PURCHASE_INVOICE_STATUS_POSTED, PURCHASE_INVOICE_STATUS_REJECTED
} from '../../../shared/financial-constants';

/** The statuses each list shows - erp-be enforces the same split (PurchaseInvoiceListView). */
const LIST_STATUSES: Record<PurchaseInvoiceListView, number[]> = {
    OPEN: [PURCHASE_INVOICE_STATUS_DRAFT, PURCHASE_INVOICE_STATUS_PENDING_APPROVAL,
        PURCHASE_INVOICE_STATUS_APPROVED, PURCHASE_INVOICE_STATUS_REJECTED],
    POSTED: [PURCHASE_INVOICE_STATUS_POSTED, PURCHASE_INVOICE_STATUS_CANCELLED],
};
import { Paging } from 'app/core/type/paging/paging.type';
import { FormControl, FormGroup } from '@angular/forms';
import jsPDF from 'jspdf';
import { DecimalPipe, formatDate } from '@angular/common';
import { ExcelService } from 'app/shared/excel/excel.service';
import { ExcelHeader } from 'app/shared/excel/excel.types';

@Component({
    selector: 'purchase-invoices-list',
    templateUrl: './list.component.html',
    styles: [
        /* language=SCSS */
        `
            .invoices-grid {
                grid-template-columns: 130px 100px auto 70px;

                @screen md {
                    grid-template-columns: 130px 100px auto 130px 130px 70px;
                }

                @screen lg {
                    grid-template-columns: 130px 100px auto 130px 100px 100px 110px 130px 130px 70px;
                }
                @screen print{
                    grid-template-columns: 130px 100px auto 130px 100px 100px 110px 130px 130px;
                }
            }
            .invoices-grid.posted-grid {
                grid-template-columns: 130px 100px auto 70px;

                @screen md {
                    grid-template-columns: 130px 100px auto 130px 130px 70px 70px;
                }

                @screen lg {
                    grid-template-columns: 130px 100px auto 130px 100px 100px 110px 130px 130px 70px 70px;
                }
                @screen print{
                    grid-template-columns: 130px 100px auto 130px 100px 100px 110px 130px 130px 70px;
                }
            }
        `
    ],
    animations: fuseAnimations,
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PurchaseInvoiceListComponent implements OnInit, OnDestroy {
    protected _onDestroy = new Subject<void>();
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;
    pagination: Paging;
    selection = new SelectionModel<any>(true, []);
    invoiceInfo: PurchaseInvoice;
    /** OPEN (/invoice/list) or POSTED (/invoice/posted), from the route data. */
    listView: PurchaseInvoiceListView;
    statuses = [];
    defaultStatuses = [];
    frmAdvancedSearch = new FormGroup({
        invoiceNumber: new FormControl(),
        issuer: new FormControl(),
        totalFrom: new FormControl(),
        totalTo: new FormControl(),
        status: new FormControl(),
    });


    searchInputControl: FormControl = new FormControl();

    // Private
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    isLoading: boolean;


    constructor(private service: PurchaseInvoiceService,
        private cdr: ChangeDetectorRef,
        private _decimalPipe: DecimalPipe,
        private excelService: ExcelService,
        private _changeDetectorRef: ChangeDetectorRef,
        route: ActivatedRoute) {
        //this._unsubscribeAll = new Subject();

        this.listView = route.snapshot.data.listView === 'POSTED' ? 'POSTED' : 'OPEN';
        this.invoiceInfo = new PurchaseInvoice;
        this.invoiceInfo.listView = this.listView;
    }

    get isPostedList(): boolean {
        return this.listView === 'POSTED';
    }

    get title(): string {
        return this.isPostedList ? 'Posted Purchase Invoices' : 'Purchase Invoices';
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------
    isOverlayOpen: boolean = true;
    selectedInfoRow: PurchaseInvoice = new PurchaseInvoice();

    invoices$: Observable<PurchaseInvoice[]> = new Observable<PurchaseInvoice[]>();
    invoices: Array<PurchaseInvoice> = [];
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
                    return this.service.getPurchaseInvoices(this.invoiceInfo);
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
                id: '',
                start: 'desc',
                disableClear: true
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
            merge(this._sort.sortChange, this._paginator.page).pipe(
                switchMap(() => {
                    this.isLoading = true;
                    this.pagination.order = this._sort.direction;
                    this.pagination.sort = this._sort.active;
                    this.invoiceInfo.page = this.pagination;
                    return this.service.getPurchaseInvoices(this.invoiceInfo);
                }),
                map(() => {
                    this.isLoading = false;
                })
            ).subscribe();
        }
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
        this.service.disposePurchaseInvoices$();
        this.service.disponsePaginator$();

    }
    private setForkJoinValues(values: Array<any>): void {
        // Only this list's statuses can be picked. The posted list starts with all of them, the open one with
        // the status table's defaults (or all of its statuses when none of them is a default).
        const listStatuses = LIST_STATUSES[this.listView];
        this.statuses = (values[0] || []).filter(s => listStatuses.includes(s.statusId));
        this.defaultStatuses = this.statuses
            .filter(s => this.isPostedList || s.isDefault === 1)
            .map(s => s.statusId);
        if (this.defaultStatuses.length === 0) {
            this.defaultStatuses = this.statuses.map(s => s.statusId);
        }
        this.frmAdvancedSearch.controls["status"].setValue(this.defaultStatuses);
        this.invoiceInfo.statusIdList = this.defaultStatuses;
        this.invoices = values[1].purchaseInvoices;
        this.invoices$ = this.service.purchaseInvoices$;
        this._changeDetectorRef.markForCheck();
        this.cdr.detectChanges();
        this.setPaginatorAndSort();
    }
    private loadData(): void {
        forkJoin(
            this.getStatuses(),
            this.getInvoicesOnInit(),
        ).subscribe(res => {
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

            }
            else if (event.source.value != 0 && !event.source.selected) {
                const index: number = this.invoiceInfo.statusIdList.indexOf(event.source.value);
                if (index !== -1)
                    this.invoiceInfo.statusIdList.splice(index, 1);
                this.frmAdvancedSearch.controls["status"].setValue(this.invoiceInfo.statusIdList);
            }
        }


    }
    private getInvoices(invoiceInfo: PurchaseInvoice) {
        this.isLoading = true;
        this.service.getPurchaseInvoices(invoiceInfo)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((invoices: any) => {
                this.invoices = invoices.purchaseInvoices;
                this.invoices$ = this.service.purchaseInvoices$;
                this.isLoading = false;
                this._changeDetectorRef.markForCheck();
                this.cdr.detectChanges();
            });
    }

    private getInvoicesOnInit(): Observable<any> {
        this.pagination = new Paging();
        this.pagination.flag = true;
        this.pagination.length = 0;
        this.pagination.order = 'desc';
        this.pagination.pageNumber = 1;
        this.pagination.pageSize = 100;
        this.pagination.sort = '';
        this.invoiceInfo.page = this.pagination;
        return this.service.getPurchaseInvoiceInOnInit(this.invoiceInfo);
    }
    public invoicesSearch() {

        this.invoiceInfo.invoiceNumber = this.frmAdvancedSearch.controls["invoiceNumber"].value;
        this.invoiceInfo.creditorName = this.frmAdvancedSearch.controls["issuer"].value;
        this.invoiceInfo.totalFrom = this.frmAdvancedSearch.controls["totalFrom"].value;
        this.invoiceInfo.totalTo = this.frmAdvancedSearch.controls["totalTo"].value;
        this.pagination.flag = true;
        this.pagination.pageNumber = 1;
        this.pagination.length = 0;
        this.invoiceInfo.page = this.pagination;
        this.getInvoices(this.invoiceInfo);
    }


    public resetAdvancedSearch() {
        this.frmAdvancedSearch.controls["invoiceNumber"].setValue("");
        this.frmAdvancedSearch.controls["issuer"].setValue("");
        this.frmAdvancedSearch.controls["totalFrom"].setValue("");
        this.frmAdvancedSearch.controls["totalTo"].setValue("");
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
        pdf.text(this.title, 14, 8);
        pdf.setFontSize(12);
        pdf.setTextColor(99);
        let header = [];
        let tableData = [];
        let footer = [];
        let qty: number = 0;
        let date = formatDate(new Date(), "yyyyMMdd_hhmmss", "en");
        let fileName: string = "PurchaseInvoice_".concat(date.concat(".pdf"));

        header = [
            { header: "Number", dataKey: "invoiceNumber" },
            { header: "Vendor No", dataKey: "creditorCode" },
            { header: "Vendor Name", dataKey: "creditorName" },
            { header: "Vendor Invoice No", dataKey: "vendorInvoiceNumber" },
            { header: "Posting Date", dataKey: "postingDate" },
            { header: "Due Date", dataKey: "dueDate" },
            { header: "Status", dataKey: "statusDescription" },
            { header: "Amount w/o VAT", dataKey: "totalNetAmount" },
            { header: "Amount w/ VAT", dataKey: "totalGrossAmount" }
        ];
        if (this.isPostedList) {
            header.push({ header: "Closed", dataKey: "closed" });
        }

        this.invoices$.subscribe((items) =>
            items.forEach((element: any) => {
                qty = qty + 1;
                const row = [
                    element.invoiceNumber,
                    element.creditorCode,
                    element.creditorName,
                    element.vendorInvoiceNumber,
                    element.postingDate,
                    element.dueDate,
                    element.statusDescription,
                    this.transformDecimal(element.totalNetAmount),
                    this.transformDecimal(element.totalGrossAmount),
                ];
                if (this.isPostedList) {
                    row.push(this.closedText(element));
                }
                tableData.push(row);
            })
        );
        footer = [
            ["QTY", ...header.slice(2).map(() => ""), qty]
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
        let obj: Array<PurchaseInvoice> = new Array<PurchaseInvoice>();
        let qty: number = 0;
        let date = formatDate(new Date(), "yyyyMMdd_hhmmss", "en");
        let fileName: string = "PurchaseInvoice_".concat(date.toString());

        columns.push({ basedColumnName: "invoiceNumber", excelColumnName: "Number" });
        columns.push({
            basedColumnName: "creditorCode",
            excelColumnName: "Vendor No",
        });
        columns.push({
            basedColumnName: "creditorName",
            excelColumnName: "Vendor Name",
        });
        columns.push({
            basedColumnName: "vendorInvoiceNumber",
            excelColumnName: "Vendor Invoice No",
        });
        columns.push({
            basedColumnName: "postingDate",
            excelColumnName: "Posting Date",
        });
        columns.push({
            basedColumnName: "dueDate",
            excelColumnName: "Due Date",
        });
        columns.push({
            basedColumnName: "statusDescription",
            excelColumnName: "Status",
        });
        columns.push({
            basedColumnName: "totalNetAmount",
            excelColumnName: "Amount w/o VAT",
        });
        columns.push({
            basedColumnName: "totalGrossAmount",
            excelColumnName: "Amount w/ VAT",
        });
        if (this.isPostedList) {
            columns.push({
                basedColumnName: "closedText",
                excelColumnName: "Closed",
            });
        }

        this.invoices$.subscribe((items) =>
            items.forEach((element) => {
                qty = qty + 1;
                obj.push({ ...element, closedText: this.closedText(element) } as PurchaseInvoice);
            })
        );
        let footerData = [];

        footerData.push([...columns.slice(2).map(() => ""), "QTY", qty]);

        this.excelService.exportAsExcelFile(
            this.isPostedList ? "PostedPurchaseInvoice" : "PurchaseInvoice",
            "",
            columns,
            obj,
            footerData,
            fileName,
            "Sheet1"
        );

        obj = [];

    }

    /** Yes when nothing is left to pay. */
    closedText(invoice: PurchaseInvoice): string {
        return invoice.closed ? 'Yes' : 'No';
    }

    transformDecimal(num) {
        return num === 0 || num === undefined || num === null ? 0 : this._decimalPipe.transform(num, "1.0-5");
    }

}
