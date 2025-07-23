import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, TemplateRef, ViewChild, ViewContainerRef, ViewEncapsulation } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { Subject, merge, Observable, forkJoin, combineLatest, Subscription, fromEvent, of } from 'rxjs';
import { debounceTime, switchMap, map, startWith, filter, take, shareReplay } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';
import { fuseAnimations } from "../../../../../../@fuse/animations";
import { ManualInvoiceService } from "../manual-invoice.service";
import { ManualInvoiceAccumulative, ManualInvoiceProfitLossCategory, advancedSearchHistory } from "../manual-invoice.types";
import { Paging, SortItem } from 'app/core/type/paging/paging.type';
import { FormControl, FormGroup } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
import jsPDF from 'jspdf';
import { DecimalPipe, formatDate } from '@angular/common';
import { ExcelService } from 'app/shared/excel/excel.service';
import { ExcelHeader } from 'app/shared/excel/excel.types';
import { HierarchicalKeyValue } from 'app/core/type/key-value/key-value.type';
import { ManualInvoice, ManualInvoiceDetail } from 'app/modules/financial/invoices/manual/manual-invoice.types';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';

@Component({
    selector: 'invoices-list',
    templateUrl: './list.component.html',
    styles: [
        /* language=SCSS */
        `
        .accumulative-invoice-fin-cat-month-year-grid2 {
            grid-template-columns:auto  500px 120px 150px 200px ;

            @screen sm {
                grid-template-columns:100px auto 100px 70px;
            }

            @screen md {
                grid-template-columns: 100px auto 150px 370px 150px 70px;
            }

            @screen lg {
                grid-template-columns: auto  500px 120px 150px 200px ;
            }
            @screen print{
                grid-template-columns: 100px 370px 370px 70px;
            }
        }
    `
        ,
        `
        .accumulative-invoice-fin-cat-total-grid {
            grid-template-columns:auto  500px 150px 200px ;

            @screen sm {
                grid-template-columns:100px auto 100px 70px;
            }

            @screen md {
                grid-template-columns: 100px auto 150px 370px 150px 70px;
            }

            @screen lg {
                grid-template-columns: auto  500px 150px 200px ;
            }
            @screen print{
                grid-template-columns: 100px 370px 370px 70px;
            }
        }
    ` ,
        `
    .accumulative-invoice-profit-loss-cat-month-year-grid {
        grid-template-columns:  auto 150px 150px 200px;

            @screen sm {
                grid-template-columns:100px auto 100px 70px;
            }

            @screen md {
                grid-template-columns: 100px auto 150px 370px 150px 70px;
            }

            @screen lg {
                grid-template-columns:   auto 150px 150px 200px;
            }
            @screen print{
                grid-template-columns: 100px 370px 370px 70px;
            }
    }
`
        ,
        `
.accumulative-invoice-profit-loss-cat-total-grid {
grid-template-columns:  auto   150px 200px;

    @screen sm {
        grid-template-columns:100px auto 100px 70px;
    }

    @screen md {
        grid-template-columns: 100px auto 150px 370px 150px 70px;
    }

    @screen lg {
        grid-template-columns:   auto   150px 200px;
    }
    @screen print{
        grid-template-columns: 100px 370px 370px 70px;
    }
}
` ,
        `
            .invoices-grid {
                grid-template-columns: 70px auto 350px 350px 200px 100px 200px ;

                @screen sm {
                    grid-template-columns:100px auto 100px 70px;
                }

                @screen md {
                    grid-template-columns: 100px auto 300px 370px 150px 70px;
                }

                @screen lg {
                    grid-template-columns: 70px auto 350px 350px 200px 100px 200px ;
                }
                @screen print{
                    grid-template-columns: 100px 370px 370px 70px;
                }
            }
        `
        ,
        `
        .invoices-details-grid {
            grid-template-columns:20px 100px auto 250px 250px 150px 100px 100px 150px;

            @screen sm {
                grid-template-columns:30px auto 70px 50px 70px ;
            }

            @screen md {
                grid-template-columns: 100px auto 150px 370px 150px 70px;
            }

            @screen lg {
                 grid-template-columns: 20px 100px auto 250px 250px 150px 100px 100px 150px;
            }
            @screen print{
                grid-template-columns: 100px 370px 370px 70px ;
            }
        }
    `
    ],
    styleUrls: ['../../../../../layout/common/right-click-menu/right-click.scss'],
    animations: fuseAnimations,
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManualInvoiceListComponent implements OnInit, OnDestroy {
    selectedRow: any;
    protected _onDestroy = new Subject<void>();
    reportMode: number;
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;
    @ViewChild('userMenu') userMenu: TemplateRef<any>;
    pagination: Paging;
    selection = new SelectionModel<any>(true, []);
    sub: Subscription;
    overlayRef: OverlayRef | null;
    invoiceInfo: ManualInvoice;
    invoiceDetailInfo: ManualInvoiceDetail;
    invoiceAccumalativeInfo: ManualInvoiceAccumulative;
    menuArray = [];
    proftLossCategories: Array<ManualInvoiceProfitLossCategory>;
    hoveredItem: any = null;
    sortItems: Array<SortItem> = new Array<SortItem>();
    dateFormatPlaceHolder: 'YYYY' | 'YYYY/MM' | 'YYYY/MM/DD' = 'YYYY/MM';
    datePattern: string = '';
    searchHistoryList: Array<advancedSearchHistory> = new Array<advancedSearchHistory>();
    searchHistorySelectedIndex: number = -1;
    private financialCategoryIdList: Array<number> = new Array<number>();
    private profitLossCategoryIdList: Array<number> = new Array<number>();
    combinedInvoices$: Observable<any[]> = combineLatest([
        this.invoiceAccumulative$.pipe(startWith(null)),
        this.invoices$.pipe(startWith(null)),
        this.invoicesDetails$.pipe(startWith(null)),
    ]).pipe(
        map(([accumulative, invoices, details]) => {
            return [accumulative, invoices, details].find(arr => Array.isArray(arr) && arr.length) || [];
        }),
        shareReplay(1) // 🔁 Cache the latest emitted value
    );
    frmAdvancedSearch = new FormGroup({
        invoiceNumber: new FormControl(),
        issuerType: new FormControl(),
        issuer: new FormControl(),
        totalFrom: new FormControl(),
        totalTo: new FormControl(),
        dateFrom: new FormControl(),
        dateTo: new FormControl(),
        reportType: new FormControl(),
        accumulativeMode: new FormControl(),
        groupingMode: new FormControl(),
        profitLossCategory: new FormControl(),
    });


    searchInputControl: FormControl = new FormControl();

    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
    @ViewChild('scrollContainer', { static: false }) scrollContainer: ElementRef;
    // Private
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    isLoading: boolean;

    selectedInfoRow: ManualInvoice = new ManualInvoice();
    selectedInfoDetailRow: ManualInvoiceDetail = new ManualInvoiceDetail();
    constructor(private service: ManualInvoiceService,
        public overlay: Overlay,
        private cdr: ChangeDetectorRef,
        public viewContainerRef: ViewContainerRef,
        private _decimalPipe: DecimalPipe,
        private excelService: ExcelService,
        private _changeDetectorRef: ChangeDetectorRef) {
        //this._unsubscribeAll = new Subject();
        this.proftLossCategories = [];
        this.invoiceInfo = new ManualInvoice();
        this.invoiceDetailInfo = new ManualInvoiceDetail();
        this.invoiceAccumalativeInfo = new ManualInvoiceAccumulative();
        this.invoiceInfo.financialCategoryIdList = [];
        this.invoiceInfo.profitLossCategoryIdList = [];
        this.invoiceDetailInfo.financialCategoryIdList = [];
        this.invoiceDetailInfo.profitLossCategoryIdList = [];
        this.invoiceAccumalativeInfo.financialCategoryIdList = [];
        this.invoiceAccumalativeInfo.profitLossCategoryIdList = [];

    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------
    isOverlayOpen: boolean = true;




    get invoices$(): Observable<ManualInvoice[]> {
        return this.service.manualInvoices$;
    }
    get invoicesDetails$(): Observable<ManualInvoiceDetail[]> {
        return this.service.manualInvoicesDetails$;
    }
    get invoiceAccumulative$(): Observable<ManualInvoiceAccumulative[]> {
        return this.service.manualInvoicesAccumulative$;
    }


    /**
     * On init
     */
    ngOnInit(): void {
        this.setSortItems();
        this.isLoading = true;
        this.datePattern = '^\\d{4}/(0[1-9]|1[0-2])$';
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
    private setSortItems(): void {
        this.sortItems.push({
            reportMode: 1, items: [
                { sortItem: 'Financial Category', sortValue: 'FINANCIAL_CATEGORY_NAME', checked: true, orderNumber: 1, orderType: 'ASC' },
                { sortItem: 'Profit Loss Category', sortValue: 'PROFIT_LOSS_CATEGORY_NAME', checked: false, orderNumber: 3, orderType: 'ASC' },
                { sortItem: 'Date', sortValue: 'INVOICE_LOCAL_DATE', checked: true, orderNumber: 0, orderType: 'DESC' },
                { sortItem: 'Total', sortValue: 'TOTAL', checked: false, orderNumber: 2, orderType: 'DESC' }]
        }, {
            reportMode: 2, items: [
                { sortItem: 'Financial Category', sortValue: 'FINANCIAL_CATEGORY_NAME', checked: true, orderNumber: 1, orderType: 'ASC' },
                { sortItem: 'Profit Loss Category', sortValue: 'PROFIT_LOSS_CATEGORY_NAME', checked: false, orderNumber: 3, orderType: 'ASC' },
                { sortItem: 'Date', sortValue: 'INVOICE_LOCAL_DATE', checked: true, orderNumber: 0, orderType: 'DESC' },
                { sortItem: 'Total', sortValue: 'TOTAL', checked: false, orderNumber: 2, orderType: 'DESC' }]
        }, {
            reportMode: 3, items: [
                { sortItem: 'Financial Category', sortValue: 'FINANCIAL_CATEGORY_NAME', checked: true, orderNumber: 0, orderType: 'ASC' },
                { sortItem: 'Profit Loss Category', sortValue: 'PROFIT_LOSS_CATEGORY_NAME', checked: false, orderNumber: 2, orderType: 'ASC' },
                { sortItem: 'Total', sortValue: 'TOTAL', checked: true, orderNumber: 3, orderType: 'DESC' }]
        }, {
            reportMode: 4, items: [
                { sortItem: 'Profit Loss Category', sortValue: 'PROFIT_LOSS_CATEGORY_NAME', checked: true, orderNumber: 1, orderType: 'ASC' },
                { sortItem: 'Date', sortValue: 'INVOICE_LOCAL_DATE', checked: true, orderNumber: 0, orderType: 'DESC' },
                { sortItem: 'Total', sortValue: 'TOTAL', checked: false, orderNumber: 2, orderType: 'DESC' }]
        }, {
            reportMode: 5, items: [
                { sortItem: 'Profit Loss Category', sortValue: 'PROFIT_LOSS_CATEGORY_NAME', checked: true, orderNumber: 1, orderType: 'ASC' },
                { sortItem: 'Date', sortValue: 'INVOICE_LOCAL_DATE', checked: true, orderNumber: 0, orderType: 'DESC' },
                { sortItem: 'Total', sortValue: 'TOTAL', checked: false, orderNumber: 2, orderType: 'DESC' }]
        }, {
            reportMode: 6, items: [
                { sortItem: 'Profit Loss Category', sortValue: 'PROFIT_LOSS_CATEGORY_NAME', checked: true, orderNumber: 0, orderType: 'ASC' },
                { sortItem: 'Total', sortValue: 'TOTAL', checked: true, orderNumber: 1, orderType: 'DESC' }]
        }, {
            reportMode: 7, items: [
                { sortItem: 'Invocie Number', sortValue: 'INVOICE_NUMBER', checked: true, orderNumber: 0, orderType: 'DESC' },
                { sortItem: 'Creditor', sortValue: 'CREDITOR_NAME', checked: false, orderNumber: 1, orderType: 'ASC' },
                { sortItem: 'Debtor', sortValue: 'DEBTOR_NAME', checked: false, orderNumber: 2, orderType: 'ASC' },
                { sortItem: 'Financial Category', sortValue: 'FINANCIAL_CATEGORY_NAME', checked: false, orderNumber: 3, orderType: 'ASC' },
                { sortItem: 'Profit Loss Category', sortValue: 'PROFIT_LOSS_CATEGORY_NAME', checked: false, orderNumber: 4, orderType: 'ASC' },
                { sortItem: 'Total', sortValue: 'TOTAL', checked: false, orderNumber: 5, orderType: 'DESC' }]
        }, {
            reportMode: 8, items: [
                { sortItem: 'Invocie Number', sortValue: 'INVOICE_NUMBER', checked: true, orderNumber: 0, orderType: 'DESC' },
                { sortItem: 'Row Number', sortValue: 'ROW_NUMBER', checked: true, orderNumber: 1, orderType: 'ASC' },
                { sortItem: 'Item', sortValue: 'ITEM_DESC', checked: false, orderNumber: 2, orderType: 'ASC' },
                { sortItem: 'Creditor', sortValue: 'CREDITOR_NAME', checked: false, orderNumber: 3, orderType: 'ASC' },
                { sortItem: 'Debtor', sortValue: 'DEBTOR_NAME', checked: false, orderNumber: 4, orderType: 'ASC' },
                { sortItem: 'Rate', sortValue: 'UNIT_PRICE', checked: false, orderNumber: 5, orderType: 'ASC' },
                { sortItem: 'Measure', sortValue: 'MEASURE', checked: false, orderNumber: 6, orderType: 'ASC' },
                { sortItem: 'Total', sortValue: 'TOTAL', checked: false, orderNumber: 7, orderType: 'DESC' }]
        }

        );
    }
    getSortItems() {
        const filtered = this.sortItems.find(item => item.reportMode === this.reportMode);
        return filtered ? filtered.items.sort((a, b) => a.orderNumber - b.orderNumber) : [];
    }
    private getSortItemsCSV(reportMode: number): string {
        const filtered = this.sortItems.find(item => item.reportMode === reportMode).items.filter(x => x.checked === true);
        return filtered ? filtered.sort((a, b) => a.orderNumber - b.orderNumber).map(item => `${item.sortValue} ${item.orderType}`).join(',') : '';
    }
    toggleSortChecked(item: any) {
        item.checked = !item.checked;
    }
    toggleSortOrderType(item: any) {
        item.orderType = item.orderType == 'ASC' ? 'DESC' : 'ASC';
    }
    dropSortList(event: CdkDragDrop<any[]>) {
        let previousIndex = this.sortItems.filter(item => item.reportMode === this.reportMode)[0].items.findIndex(x => x.orderNumber == event.previousIndex);
        let currentIndex = this.sortItems.filter(item => item.reportMode === this.reportMode)[0].items.findIndex(x => x.orderNumber == event.currentIndex);
        this.sortItems.filter(item => item.reportMode === this.reportMode)[0].items[previousIndex].orderNumber = event.currentIndex;
        this.sortItems.filter(item => item.reportMode === this.reportMode)[0].items[currentIndex].orderNumber = event.previousIndex;

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
                    this.pagination.sort = this.getSortItemsCSV(this.reportMode);
                    this.pagination.pageNumber = this._paginator.pageIndex + 1;
                    if (this.reportMode <= 6) {
                        this.invoiceAccumalativeInfo.page = { ...this.pagination }
                        return this.service.getManualInvoiceAccumulative(this.invoiceAccumalativeInfo);
                    }
                    else if (this.reportMode == 7) {
                        this.invoiceInfo.page = { ...this.pagination }
                        return this.service.getManualInvoices(this.invoiceInfo);
                    }
                    else if (this.reportMode == 8) {
                        this.invoiceDetailInfo.page = { ...this.pagination }
                        return this.service.getManualInvoicesDetail(this.invoiceDetailInfo);
                    }
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
        this.frmAdvancedSearch.controls['reportType'].setValue(1);
        this.frmAdvancedSearch.controls['accumulativeMode'].setValue('finCat');
        this.frmAdvancedSearch.controls['groupingMode'].setValue('month');
        this.reportMode = this.invoiceAccumalativeInfo.reportMode;
        this.proftLossCategories = values[1].data;
        this.invoiceAccumalativeInfo.page = { ...this.pagination };
        this._changeDetectorRef.markForCheck();
        this.cdr.detectChanges();
        this.setPaginatorAndSort();
    }
    private loadData(): void {
        this.getManualInvoiceCat();
        forkJoin(
            this.getInvoicesOnInit(),
            this.geProfitLossCategory(),
        ).subscribe(res => {
            this.setForkJoinValues(res);
            this.isLoading = false;
            this.cdr.detectChanges();
        });
    }

    setReportType(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            if (event.source.value == 1) {
                this.frmAdvancedSearch.addControl('accumulativeMode', new FormControl(''));
                this.frmAdvancedSearch.addControl('dateMode', new FormControl(''));

            }
            else {
                this.frmAdvancedSearch.removeControl('accumulativeMode');
                this.frmAdvancedSearch.removeControl('dateMode');

            }
            this.cdr.markForCheck();
            this.cdr.detectChanges();
        }
    }
    setDatePattern(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {
        if (event.isUserInput) {
            switch (event.source.value) {
                case 'year':
                    this.datePattern = '^\\d{4}$';
                    this.dateFormatPlaceHolder = 'YYYY';
                    break;
                case 'month':
                    this.datePattern = '^\\d{4}/(0[1-9]|1[0-2])$';
                    this.dateFormatPlaceHolder = 'YYYY/MM';
                    break;
                default:
                    this.datePattern = '^\\d{4}/(0[1-9]|1[0-2])/(0[1-9]|[12][0-9]|3[01])$';
                    this.dateFormatPlaceHolder = 'YYYY/MM/DD';
                    break;
            }
            this.cdr.markForCheck();
            this.cdr.detectChanges();
        }
    }
    setProfitLossCategory(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            if (event.source.value != 0 && event.source.selected)
                this.profitLossCategoryIdList.push(event.source.value);
            else if (event.source.value != 0 && !event.source.selected) {
                const index: number = this.profitLossCategoryIdList.indexOf(event.source.value);
                if (index !== -1)
                    this.profitLossCategoryIdList.splice(index, 1);
                this.frmAdvancedSearch.controls["profitLossCategory"].setValue(this.profitLossCategoryIdList);
            }
        }


    }
    changeSearchHistory(direction: string): void {
        let searchObject: any;
        this.searchHistoryList[this.searchHistorySelectedIndex].isSelected = false;
        this.searchHistoryList[this.searchHistorySelectedIndex].scrollPosition = this.scrollContainer.nativeElement.scrollTop;
        if (direction == 'previous')
            this.searchHistorySelectedIndex -= 1;
        else if (direction == 'next')
            this.searchHistorySelectedIndex += 1;

        this.searchHistoryList[this.searchHistorySelectedIndex].isSelected = true;
        searchObject = this.searchHistoryList[this.searchHistorySelectedIndex];


        if (searchObject.reportMode >= 1 && searchObject.reportMode <= 6)
            this.getInvoiceAccumulative(searchObject.obj, searchObject.scrollPosition, false);
        else if (searchObject.reportMode == 7)
            this.getInvoices(searchObject.obj, searchObject.scrollPosition, false);
        else if (searchObject.reportMode == 8)
            this.getInvoiceDetails(searchObject.obj, searchObject.scrollPosition, false);
        this.setAdcancedSearchControls(searchObject.reportMode, searchObject.obj);
    }
    changeAdvancedSearch(selectedRow: any, searchType: string): void {
        this.pagination.flag = true;
        this.pagination.pageNumber = 1;
        this.pagination.length = 0;
        if (searchType == 'invoice') {
            let obj: ManualInvoice = new ManualInvoice();
            this.pagination.sort = this.getSortItemsCSV(7);
            if (this.reportMode <= 6) {
                obj.profitLossCategoryIdList = [];
                obj.profitLossCategoryIdList.push(selectedRow.profitLossCategoryId);
                obj.page = { ...this.pagination }
                this.searchHistoryList[this.searchHistorySelectedIndex].scrollPosition = this.scrollContainer.nativeElement.scrollTop;
                this.searchHistoryList.length = this.searchHistorySelectedIndex + 1;
                if (this.reportMode <= 3) {
                    obj.financialCategoryIdList = [];
                    obj.financialCategoryIdList.push(selectedRow.financialCategoryId);
                }
                if (![3, 6].includes(this.reportMode)) {
                    obj.localDateFrom = this.convertDate(selectedRow.invoiceLocalDate, true, this.dateFormatPlaceHolder, 'YYYY/MM/DD');
                    obj.localDateTo = this.convertDate(selectedRow.invoiceLocalDate, false, this.dateFormatPlaceHolder, 'YYYY/MM/DD');
                }
            }
            this.setAdcancedSearchControls(7, obj);
            this.getInvoices(obj, 0, true);

        }
        if (searchType == 'invoice details') {
            let obj: ManualInvoiceDetail = new ManualInvoiceDetail();
            this.pagination.sort = this.getSortItemsCSV(8);
            obj.page = { ...this.pagination }
            this.searchHistoryList[this.searchHistorySelectedIndex].scrollPosition = this.scrollContainer.nativeElement.scrollTop;
            this.searchHistoryList.length = this.searchHistorySelectedIndex + 1;
            if (this.reportMode <= 6) {
                obj.profitLossCategoryIdList = [];
                obj.profitLossCategoryIdList.push(selectedRow.profitLossCategoryId);
                if (this.reportMode <= 3) {
                    obj.financialCategoryIdList = [];
                    obj.financialCategoryIdList.push(selectedRow.financialCategoryId);
                }
                if (![3, 6].includes(this.reportMode)) {
                    obj.localDateFrom = this.convertDate(selectedRow.invoiceLocalDate, true, this.dateFormatPlaceHolder, 'YYYY/MM/DD');
                    obj.localDateTo = this.convertDate(selectedRow.invoiceLocalDate, false, this.dateFormatPlaceHolder, 'YYYY/MM/DD');
                }
            }
            else if (this.reportMode == 7)
                obj.manualInvoiceId = selectedRow.manualInvoiceId;


            this.setAdcancedSearchControls(8, obj);
            this.getInvoiceDetails(obj, 0, true);
        }

        this.close();
    }
    private setAdcancedSearchControls(reportMode: number, searchObject: any) {
        this.frmAdvancedSearch.controls["totalFrom"].setValue(searchObject.totalFrom);
        this.frmAdvancedSearch.controls["totalTo"].setValue(searchObject.totalTo);
        this.frmAdvancedSearch.controls["dateFrom"].setValue(searchObject.localDateFrom);
        this.frmAdvancedSearch.controls["dateTo"].setValue(searchObject.localDateTo);
        this.financialCategoryIdList = searchObject.financialCategoryIdList;
        this.setFinancialCategory(this.financialCategoryIdList);
        this.profitLossCategoryIdList = searchObject.profitLossCategoryIdList;
        this.frmAdvancedSearch.controls["profitLossCategory"].setValue(this.profitLossCategoryIdList);
        let dateFormat: string;
        if (reportMode <= 6) {
            if ([1, 2, 3].includes(reportMode))
                this.frmAdvancedSearch.controls["accumulativeMode"].setValue('finCat');
            else if ([4, 5, 6].includes(reportMode))
                this.frmAdvancedSearch.controls["accumulativeMode"].setValue('profLossCat');
            this.frmAdvancedSearch.controls["reportType"].setValue(1);

            if ([1, 4].includes(reportMode))
                dateFormat = 'month';
            else if ([2, 5].includes(reportMode))
                dateFormat = 'year';
            else if ([3, 6].includes(reportMode))
                dateFormat = 'total';

        }
        else if ([7, 8].includes(reportMode)) {
            dateFormat = 'total';
            this.frmAdvancedSearch.controls["invoiceNumber"].setValue(searchObject.invoiceNumber);
            this.frmAdvancedSearch.controls["issuerType"].setValue(searchObject.creditorTypeIdList);
            this.frmAdvancedSearch.controls["issuer"].setValue(searchObject.creditorName);
            this.frmAdvancedSearch.controls["reportType"].setValue(reportMode == 7 ? 2 : 3);
        }
        this.setDatePattern({
            isUserInput: true,
            source: { value: dateFormat, selected: true }
        });
        this._changeDetectorRef.markForCheck();
        this.cdr.detectChanges();

    }
    private setFinancialCategory(financialCategoryIdList: Array<number>) {

        function recurse(items: any) {
            for (let item of items) {
                if (financialCategoryIdList.includes(item.id))
                    item.isSelected = true;

                if (item.children && item.children.length > 0) {
                    recurse(item.children);
                }
            }
        }
        if (financialCategoryIdList?.length > 0)
            recurse(this.menuArray);
    }
    private convertDate(date: string, isStartPoint: boolean, currentFormat: string, targetFormat: string): string {
        let result: string;
        if (currentFormat == 'YYYY/MM' && targetFormat == 'YYYY/MM/DD') {
            if (!isStartPoint)
                if (Number(date.substring(5)) <= 6)
                    result = date.concat('/31')
                else
                    result = date.concat('/30')
            else
                result = date.concat('/01');
        }
        else if (currentFormat == 'YYYY' && targetFormat == 'YYYY/MM/DD') {
            if (isStartPoint)
                result = date.concat('/01/01');
            else
                result = date.concat('/12/30');
        }
        return result;
    }
    private setScroll(scrollPosition: number) {
        requestAnimationFrame(() => {
            setTimeout(() => {
                if (this.scrollContainer?.nativeElement) {
                    this.scrollContainer.nativeElement.scrollTop = scrollPosition;
                }
            });
        });
    }
    private getInvoiceAccumulative(invoiceInfo: ManualInvoiceAccumulative, scrollPosition: number, pushToHistArray: boolean) {
        this.isLoading = true;
        this.service.getManualInvoiceAccumulative(invoiceInfo)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((invoices: any) => {
                this.reportMode = invoiceInfo.reportMode;
                if (pushToHistArray) {
                    this.searchHistoryList.push({ reportMode: this.reportMode, obj: invoiceInfo, isSelected: true, scrollPosition: 0 });
                    this.searchHistorySelectedIndex = this.searchHistoryList.length - 1;
                }
                this.setScroll(scrollPosition);
                this.invoiceAccumalativeInfo.page = { ...this.pagination }
                this.service.disposeManualInvoicesDetails$();
                this.service.disposeManualInvoices$();
                this.isLoading = false;
                this._changeDetectorRef.markForCheck();
                this.cdr.detectChanges();
            });
    }

    private getInvoices(invoiceInfo: ManualInvoice, scrollPosition: number, pushToHistArray: boolean) {
        this.isLoading = true;
        this.service.getManualInvoices(invoiceInfo)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((invoices: any) => {
                this.reportMode = 7;
                if (pushToHistArray) {
                    this.searchHistoryList.push({ reportMode: this.reportMode, obj: invoiceInfo, isSelected: true, scrollPosition: 0 });
                    this.searchHistorySelectedIndex = this.searchHistoryList.length - 1;
                }
                this.setScroll(scrollPosition);
                this.invoiceInfo.page = { ...this.pagination }
                this.service.disposeManualInvoicesDetails$();
                this.service.disposeManualInvoiceAccumulative$();
                this.isLoading = false;
                this._changeDetectorRef.markForCheck();
                this.cdr.detectChanges();
            });
    }
    private getInvoiceDetails(invoiceInfo: ManualInvoiceDetail, scrollPosition: number, pushToHistArray: boolean) {
        this.isLoading = true;
        this.service.getManualInvoicesDetail(invoiceInfo)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((invoices: any) => {
                this.reportMode = 8;
                if (pushToHistArray) {
                    this.searchHistoryList.push({ reportMode: this.reportMode, obj: invoiceInfo, isSelected: true, scrollPosition: 0 });
                    this.searchHistorySelectedIndex = this.searchHistoryList.length - 1;
                }
                this.setScroll(scrollPosition);
                this.invoiceDetailInfo.page = { ...this.pagination }
                this.service.disposeManualInvoices$();
                this.service.disposeManualInvoiceAccumulative$();
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
    }

    private addSelectanItemToCatMenu() {
        let obj = new HierarchicalKeyValue();
        obj.id = 0;
        obj.item = "";
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
                this._changeDetectorRef.markForCheck();
                this.cdr.detectChanges();
            })
    }
    private geProfitLossCategory(): Observable<any> {
        return this.service.getProfitLossCategory();
    }

    public onFinCatCheckboxChange(event: any, id: number) {
        const indx = this.financialCategoryIdList.findIndex(x => x == id);
        if (event.checked && indx == -1)
            this.financialCategoryIdList.push(id);
        else if (!event.checked && indx > -1)
            this.financialCategoryIdList.splice(indx, 1);

    }

    private getInvoicesOnInit(): Observable<any> {
        this.invoiceAccumalativeInfo.reportMode = 1;
        this.pagination = new Paging();
        this.pagination.flag = true;
        this.pagination.length = 0;
        this.pagination.order = 'desc';
        this.pagination.pageNumber = 1;
        this.pagination.pageSize = 100;
        this.pagination.sort = this.getSortItemsCSV(this.invoiceAccumalativeInfo.reportMode);
        this.invoiceAccumalativeInfo.page = { ...this.pagination }
        this.searchHistoryList.push({ reportMode: this.invoiceAccumalativeInfo.reportMode, obj: this.invoiceAccumalativeInfo, isSelected: true, scrollPosition: 0 });
        this.searchHistorySelectedIndex = 0;
        return this.service.getManualInvoiceAccumulative(this.invoiceAccumalativeInfo);
    }
    public invoicesSearch() {
        this.pagination.flag = true;
        this.pagination.pageNumber = 1;
        this.pagination.length = 0;
        let reportType: number = this.frmAdvancedSearch.controls['reportType'].value;
        this.searchHistoryList[this.searchHistorySelectedIndex].scrollPosition = this.scrollContainer.nativeElement.scrollTop;
        this.searchHistoryList.length = this.searchHistorySelectedIndex + 1;
        if (reportType == 1) {
            let accumulativeMode: string;
            let groupingMode: string;
            this.invoiceAccumalativeInfo.totalFrom = this.frmAdvancedSearch.controls["totalFrom"].value;
            this.invoiceAccumalativeInfo.totalTo = this.frmAdvancedSearch.controls["totalTo"].value;
            this.invoiceAccumalativeInfo.localDateFrom = this.frmAdvancedSearch.controls["dateFrom"].value;
            this.invoiceAccumalativeInfo.localDateTo = this.frmAdvancedSearch.controls["dateTo"].value;
            accumulativeMode = this.frmAdvancedSearch.controls["accumulativeMode"].value;
            groupingMode = this.frmAdvancedSearch.controls["groupingMode"].value;
            if (accumulativeMode == 'finCat') {
                if (groupingMode == 'month')
                    this.invoiceAccumalativeInfo.reportMode = 1;
                else if (groupingMode == 'year')
                    this.invoiceAccumalativeInfo.reportMode = 2;
                else if (groupingMode == 'total')
                    this.invoiceAccumalativeInfo.reportMode = 3;
            }
            else if (accumulativeMode == 'profLossCat') {
                if (groupingMode == 'month')
                    this.invoiceAccumalativeInfo.reportMode = 4;
                else if (groupingMode == 'year')
                    this.invoiceAccumalativeInfo.reportMode = 5;
                else if (groupingMode == 'total')
                    this.invoiceAccumalativeInfo.reportMode = 6;
            }

            this.invoiceAccumalativeInfo.financialCategoryIdList = this.financialCategoryIdList;
            this.invoiceAccumalativeInfo.profitLossCategoryIdList = this.profitLossCategoryIdList;
            this.pagination.sort = this.getSortItemsCSV(this.invoiceAccumalativeInfo.reportMode);
            this.invoiceAccumalativeInfo.page = { ...this.pagination }
            this.getInvoiceAccumulative(this.invoiceAccumalativeInfo, 0, true);
        }
        else if (reportType == 2) {
            this.invoiceInfo.invoiceNumber = this.frmAdvancedSearch.controls["invoiceNumber"].value;
            this.invoiceInfo.creditorTypeIdList = this.frmAdvancedSearch.controls["issuerType"].value;
            this.invoiceInfo.creditorName = this.frmAdvancedSearch.controls["issuer"].value;
            this.invoiceInfo.totalFrom = this.frmAdvancedSearch.controls["totalFrom"].value;
            this.invoiceInfo.totalTo = this.frmAdvancedSearch.controls["totalTo"].value;
            this.invoiceInfo.localDateFrom = this.frmAdvancedSearch.controls["dateFrom"].value;
            this.invoiceInfo.localDateTo = this.frmAdvancedSearch.controls["dateTo"].value;
            this.invoiceInfo.financialCategoryIdList = this.financialCategoryIdList;
            this.invoiceInfo.profitLossCategoryIdList = this.profitLossCategoryIdList;
            this.pagination.sort = this.getSortItemsCSV(7);
            this.invoiceInfo.page = { ...this.pagination }
            this.getInvoices(this.invoiceInfo, 0, true);
        }
        else if (reportType == 3) {
            this.invoiceDetailInfo.invoiceNumber = this.frmAdvancedSearch.controls["invoiceNumber"].value;
            this.invoiceDetailInfo.creditorTypeIdList = this.frmAdvancedSearch.controls["issuerType"].value;
            this.invoiceDetailInfo.creditorName = this.frmAdvancedSearch.controls["issuer"].value;
            this.invoiceDetailInfo.totalFrom = this.frmAdvancedSearch.controls["totalFrom"].value;
            this.invoiceDetailInfo.totalTo = this.frmAdvancedSearch.controls["totalTo"].value;
            this.invoiceDetailInfo.localDateFrom = this.frmAdvancedSearch.controls["dateFrom"].value;
            this.invoiceDetailInfo.localDateTo = this.frmAdvancedSearch.controls["dateTo"].value;
            this.invoiceDetailInfo.financialCategoryIdList = this.financialCategoryIdList;
            this.invoiceDetailInfo.profitLossCategoryIdList = this.profitLossCategoryIdList;
            this.pagination.sort = this.getSortItemsCSV(8);
            this.invoiceDetailInfo.page = { ...this.pagination }
            this.getInvoiceDetails(this.invoiceDetailInfo, 0, true);
        }
    }


    public resetAdvancedSearch() {
        this.frmAdvancedSearch.controls["invoiceNumber"].setValue("");
        this.frmAdvancedSearch.controls["issuerType"].setValue([]);
        this.frmAdvancedSearch.controls["issuer"].setValue("");
        this.frmAdvancedSearch.controls["totalFrom"].setValue("");
        this.frmAdvancedSearch.controls["totalTo"].setValue("");
        this.frmAdvancedSearch.controls["dateFrom"].setValue("");
        this.frmAdvancedSearch.controls["dateTo"].setValue("");
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

    async exportTable() {
        if (this.reportMode <= 6) {
            this.isLoading = true;
            const data = await this.service.getManualInvoiceAccumulativeForDownloadingFile(this.invoiceAccumalativeInfo);
            this.isLoading = false;
            this.downloadExcelFile(of(data));
            this._changeDetectorRef.markForCheck();
            this.cdr.detectChanges();
        }
        else if (this.reportMode == 7) {
            this.isLoading = true;
            const data = await this.service.getManualInvoiceForDownloadingFile(this.invoiceInfo);
            this.isLoading = false;
            this.downloadExcelFile(of(data));
            this._changeDetectorRef.markForCheck();
            this.cdr.detectChanges();
        }
        else if (this.reportMode == 8) {
            this.isLoading = true;
            const data = await this.service.getManualInvoiceDetailsForDownloadingFile(this.invoiceDetailInfo);
            this.isLoading = false;
            this.downloadExcelFile(of(data));
            this._changeDetectorRef.markForCheck();
            this.cdr.detectChanges();
        }
    }
    downloadExcelFile(data: any) {
        let columns: Array<ExcelHeader> = new Array<ExcelHeader>();
        let obj: Array<any> = new Array<any>();
        let total: number = 0;
        let qty: number = 0;
        let date = formatDate(new Date(), "yyyyMMdd_hhmmss", "en");
        let fileName: string = "ManualInvoice_".concat(date.toString());
        if (this.reportMode == 8)
            columns.push({ basedColumnName: "rowNumber", excelColumnName: "#" });
        if (this.reportMode >= 7)
            columns.push({ basedColumnName: "invoiceNumber", excelColumnName: "Invoice Number" });
        if (this.reportMode == 8)
            columns.push({ basedColumnName: "itemDesc", excelColumnName: "Item" });
        if (this.reportMode >= 7)
            columns.push({ basedColumnName: "creditorName", excelColumnName: "Creditor" });
        if (this.reportMode >= 7)
            columns.push({ basedColumnName: "debtorName", excelColumnName: "Debtor" });
        if ([1, 2, 3, 7].includes(this.reportMode))
            columns.push({ basedColumnName: "financialCategoryName", excelColumnName: "Financial Category" });
        if (this.reportMode <= 7)
            columns.push({ basedColumnName: "profitLossCategoryName", excelColumnName: "ProfitLoss Category" });
        if ([1, 2, 4, 5, 7, 8].includes(this.reportMode))
            columns.push({ basedColumnName: "invoiceLocalDate", excelColumnName: "Date" });
        if (this.reportMode == 8)
            columns.push({ basedColumnName: "unitPrice", excelColumnName: "Unit Price" });
        if (this.reportMode == 8)
            columns.push({ basedColumnName: "measure", excelColumnName: "Measure" });
        if (this.reportMode <= 6)
            columns.push({ basedColumnName: "invoiceCount", excelColumnName: "Inv. Count" });

        columns.push({ basedColumnName: "total", excelColumnName: "Total" });



        data.subscribe(items => items.forEach(element => {
            qty = qty + 1;
            total = total + element.total;
            obj.push(element);
        }));
        let footerData = [];
        const row = [
            ...Array(columns.length - 2).fill(""),
            "TOTAL",
            total
        ];
        footerData.push(row);

        this.excelService.exportAsExcelFile('Manual Invoice Report', '', columns, obj, footerData, fileName, 'Sheet1');


        obj = [];

    }

    transformDecimal(num) {
        return num === 0 ? 0 : this._decimalPipe.transform(num, "1.0-5");
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
    handleContextMenu(event: MouseEvent, item: any): void {
        if (this.reportMode <= 7) {
            this.open(event, item);
            event.preventDefault();
            this.selectedRow = item;
        }
    }
}


