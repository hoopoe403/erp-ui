import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { Subject, merge, Observable, forkJoin } from 'rxjs';
import { debounceTime, switchMap, map } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';
import { fuseAnimations } from "../../../../../../@fuse/animations";
import { ManualInvoiceService } from "../manual-invoice.service";
import { ManualInvoice } from "../manual-invoice.types";
import { Paging } from 'app/core/type/paging/paging.type';
import { FormControl, FormGroup } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
import jsPDF from 'jspdf';
import { DecimalPipe, formatDate } from '@angular/common';
import { ExcelService } from 'app/shared/excel/excel.service';
import { ExcelHeader } from 'app/shared/excel/excel.types';
import { HierarchicalKeyValue } from 'app/core/type/key-value/key-value.type';

@Component({
    selector: 'invoices-list',
    templateUrl: './list.component.html',
    styles: [
        /* language=SCSS */
        `
            .invoices-grid {
                grid-template-columns:100px auto 40px;

                @screen sm {
                    grid-template-columns:100px auto 100px 70px;
                }

                @screen md {
                    grid-template-columns: 100px auto 150px 370px 150px 70px;
                }

                @screen lg {
                    grid-template-columns: 100px auto 300px 200px 100px 70px;
                }
                @screen print{
                    grid-template-columns: 100px 370px 370px 70px;
                }
            }
        `
    ],
    animations: fuseAnimations,
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManualInvoiceListComponent implements OnInit, OnDestroy {
    protected _onDestroy = new Subject<void>();
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;
    pagination: Paging;
    selection = new SelectionModel<any>(true, []);
    invoiceInfo: ManualInvoice;
    statuses = [];
    menuArray = [];
    selectedCat: number = 0;
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
        dateFrom: new FormControl(),
        dateTo: new FormControl(),
    });


    searchInputControl: FormControl = new FormControl();

    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;

    // Private
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    isLoading: boolean;


    constructor(private service: ManualInvoiceService,
        private cdr: ChangeDetectorRef,
        private _decimalPipe: DecimalPipe,
        private excelService: ExcelService,
        private _changeDetectorRef: ChangeDetectorRef) {
        //this._unsubscribeAll = new Subject();

        this.invoiceInfo = new ManualInvoice;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------
    isOverlayOpen: boolean = true;
    selectedInfoRow: ManualInvoice = new ManualInvoice();

    invoices$: Observable<ManualInvoice[]> = new Observable<ManualInvoice[]>();
    invoices: Array<ManualInvoice> = [];
    /**
     * On init
     */
    ngOnInit(): void {
        this.isLoading = true;
        this.getManualInvoiceCat();
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
                    return this.service.getManualInvoices(this.invoiceInfo);
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
                    return this.service.getManualInvoices(this.invoiceInfo);
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
        this.service.disposeManualInvoices$();
        this.service.disponsePaginator$();

    }
    private setForkJoinValues(values: Array<any>): void {
        this.statuses = values[0].data;
        this.defaultStatuses = [];
        this.statuses.forEach(element => {
            if (element.isDefault === 1)
                this.defaultStatuses.push(element.statusId);
        });
        this.frmAdvancedSearch.controls["status"].setValue(this.defaultStatuses);
        this.invoiceInfo.statusIdList = this.defaultStatuses;
        this.invoices = values[1].data.invoices;
        this.invoices$ = this.service.manualInvoices$;
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
    private getInvoices(invoiceInfo: ManualInvoice) {
        this.isLoading = true;
        this.service.getManualInvoices(invoiceInfo)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((invoices: any) => {
                this.invoices = invoices.data.invoices;
                this.invoices$ = this.service.manualInvoices$;
                this.isLoading = false;
                this._changeDetectorRef.markForCheck();
                this.cdr.detectChanges();
            });
    }

    private resetManualInvoiceCatBotton() {
        let obj = new HierarchicalKeyValue();
        obj.id = this.menuArray[0].id;
        obj.item = this.menuArray[0].item;
        obj.parentId = this.menuArray[0].parentId;
        obj.children = [];
        for (var i = 0; i < this.menuArray[0].children.length; i++) {
            obj.children.push(this.menuArray[0].children[i]);
        }
        this.menuArray = [];
        this.menuArray.push(obj);
        this.selectedCat = 0;
    }

    private addSelectanItemToCatMenu() {
        let obj = new HierarchicalKeyValue();
        obj.id = 0;
        obj.item = "Select a category";
        obj.parentId = -1;
        obj.children = [];
        for (var i = 0; i < this.menuArray.length; i++) {
            obj.children.push(this.menuArray[i]);
        }
        this.menuArray = [];
        this.menuArray.push(obj);
    }

    private getManualInvoiceCat() {
        return this.service.getFinancialCategories()
            .subscribe(res => {
                this.menuArray = res.data;
                this.addSelectanItemToCatMenu();
            })
    }

    public setSelectedCat(selectedId: number) {

        this.selectedCat = selectedId;
        if (selectedId > 0)
            this.trigger.closeMenu();
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
        return this.service.getManualInvoiceInOnInit(this.invoiceInfo);
    }
    public invoicesSearch() {

        this.invoiceInfo.invoiceNumber = this.frmAdvancedSearch.controls["invoiceNumber"].value;
        this.invoiceInfo.creditorTypeIdList = this.frmAdvancedSearch.controls["issuerType"].value;
        this.invoiceInfo.creditorName = this.frmAdvancedSearch.controls["issuer"].value;
        this.invoiceInfo.totalFrom = this.frmAdvancedSearch.controls["totalFrom"].value;
        this.invoiceInfo.totalTo = this.frmAdvancedSearch.controls["totalTo"].value;
        this.invoiceInfo.localDateFrom = this.frmAdvancedSearch.controls["dateFrom"].value;
        this.invoiceInfo.localDateTo = this.frmAdvancedSearch.controls["dateTo"].value;
        this.invoiceInfo.financialCategoryId = this.selectedCat;
        this.pagination.flag = true;
        this.pagination.pageNumber = 1;
        this.pagination.length = 0;
        this.invoiceInfo.page = this.pagination;
        this.getInvoices(this.invoiceInfo);
    }


    public resetAdvancedSearch() {
        this.frmAdvancedSearch.controls["invoiceNumber"].setValue("");
        this.frmAdvancedSearch.controls["issuerType"].setValue([]);
        this.frmAdvancedSearch.controls["issuer"].setValue("");
        this.frmAdvancedSearch.controls["sourceCode"].setValue("");
        this.frmAdvancedSearch.controls["referenceNo"].setValue("");
        this.frmAdvancedSearch.controls["totalFrom"].setValue("");
        this.frmAdvancedSearch.controls["totalTo"].setValue("");
        this.frmAdvancedSearch.controls["dateFrom"].setValue("");
        this.frmAdvancedSearch.controls["dateTo"].setValue("");
        this.frmAdvancedSearch.controls["status"].setValue(this.defaultStatuses);
        this.resetManualInvoiceCatBotton();
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
        pdf.text("ManualInvoice", 14, 8);
        pdf.setFontSize(12);
        pdf.setTextColor(99);
        let header = [];
        let tableData = [];
        let footer = [];
        let qty: number = 0;
        let date = formatDate(new Date(), "yyyyMMdd_hhmmss", "en");
        let fileName: string = "ManualInvoice_".concat(date.concat(".pdf"));

        header = [
            { header: "Number", dataKey: "invoiceNumber" },
            { header: "Creditor", dataKey: "creditorName" },
            { header: "Debtor", dataKey: "debtorName" },
            { header: "Total", dataKey: "total" },
            { header: "Status", dataKey: "statusDescription" }
        ];

        this.invoices$.subscribe((items) =>
            items.forEach((element) => {
                qty = qty + 1;
                tableData.push([
                    element.invoiceNumber,
                    element.creditorName,
                    element.debtorName,
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
        let obj: Array<ManualInvoice> = new Array<ManualInvoice>();
        let qty: number = 0;
        let date = formatDate(new Date(), "yyyyMMdd_hhmmss", "en");
        let fileName: string = "ManualInvoice_".concat(date.toString());

        columns.push({ basedColumnName: "invoiceNumber", excelColumnName: "Number" });
        columns.push({
            basedColumnName: "creditorName",
            excelColumnName: "Creditor",
        });
        columns.push({
            basedColumnName: "debtorName",
            excelColumnName: "Debtor",
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
            "ManualInvoice",
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


