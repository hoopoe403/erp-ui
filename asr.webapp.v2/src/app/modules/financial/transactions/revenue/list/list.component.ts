import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { Subject, merge, Observable, forkJoin } from 'rxjs';
import { debounceTime, switchMap, map } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';
import { fuseAnimations } from "../../../../../../@fuse/animations";
import { RevenueService } from "../revenue.service";
import { Revenue } from "../revenue.types";
import { Owner } from 'app/modules/configuration/owner/owner.types';
import { Paging } from 'app/core/type/paging/paging.type';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
import { KeyValue } from 'app/core/type/key-value/key-value.type';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { DecimalPipe, formatDate } from '@angular/common';
import { ExcelService } from 'app/shared/excel/excel.service';
import { ExcelHeader } from 'app/shared/excel/excel.types';
import { Property } from 'app/modules/configuration/property/property.types';
import { MatSnackBar } from '@angular/material/snack-bar';
@Component({
    selector: 'revenues-list',
    templateUrl: './list.component.html',
    styles: [
        /* language=SCSS */
        `
            .revenues-grid {
                grid-template-columns:112px auto 40px;

                @screen sm {
                    grid-template-columns:112px auto 100px 70px;
                }

                @screen md {
                    grid-template-columns: 112px 370px auto 130px 150px 70px;
                }

                @screen lg {
                    grid-template-columns: auto 170px 170px  130px 150px 70px 70px;
                }
                @screen print{
                    grid-template-columns: 112px 370px 370px 70px;
                }
            }
        `
    ],
    animations: fuseAnimations,
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RevenueListComponent implements OnInit, AfterViewInit, OnDestroy {
    protected _onDestroy = new Subject<void>();
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;
    pagination: Paging;
    selection = new SelectionModel<any>(true, []);
    revenueInfo: Revenue;
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
    defaultStatuses = [];
    payers: Array<Owner>;
    paymentTypes: Array<KeyValue> = [];
    frmAdvancedSearch = new FormGroup({
        payers: new FormControl(),
        paymentType: new FormControl(),
        amountFrom: new FormControl(),
        amountTo: new FormControl(),
        dateFrom: new FormControl(),
        dateTo: new FormControl(),
        status: new FormControl()
    });


    searchInputControl: FormControl = new FormControl();

    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;

    // Private
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    isLoading: boolean;

    constructor(private revenueService: RevenueService,
        private cdr: ChangeDetectorRef,
        private _decimalPipe: DecimalPipe,
        private excelService: ExcelService,
        private snack: MatSnackBar,
        private _changeDetectorRef: ChangeDetectorRef) {
        //this._unsubscribeAll = new Subject();
        this._paging = new Paging();
        this.revenueInfo = new Revenue;
        this.revenueInfo.payerIdList = [];
        this.revenueInfo.paymentTypeIdList = [];
        this.revenueInfo.statusIdList = [];
        this.payers = new Array<Owner>();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------
    isOverlayOpen: boolean = true;
    selectedInfoRow: Revenue = new Revenue();

    revenues: Array<Revenue> = [];
    /**
     * On init
     */
    get revenues$(): Observable<Revenue[]> {
        return this.revenueService.revenues$;
    }
    ngOnInit(): void {

        this.isLoading = true;
        this.payersMultiFilterCtrl.valueChanges
            .pipe(takeUntil(this._onDestroy))
            .subscribe(() => {
                this.filterPayersMulti();
            });



        this.revenueService.pagination$
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
                id: 'payerName',
                start: 'asc',
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
                    this.revenueInfo.page = new Paging();
                    this.revenueInfo.page.flag = this.pagination.flag;
                    this.revenueInfo.page.length = this.pagination.length;
                    this.revenueInfo.page.order = this._sort.direction;
                    this.revenueInfo.page.pageNumber = this.pagination.pageNumber;
                    this.revenueInfo.page.pageSize = this.pagination.pageSize;
                    this.revenueInfo.page.sort = this._sort.active;
                    return this.revenueService.getRevenues(this.revenueInfo);
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
        this.revenueService.disposeExpenses$();
        this.revenueService.disponsePaginator$();
    }
    private loadData(): void {
        this.getPayers();
        this.getPaymentType();
        forkJoin(
            this.getRevenuesOnInit(),
            this.getStatuses(),
        ).subscribe(res => {
            this.setForkJoinValues(res);
            this.isLoading = false;
            this._changeDetectorRef.markForCheck();
            this.cdr.detectChanges();
        });
    }
    private setForkJoinValues(values: Array<any>): void {
        this.revenues = values[0].data.revenues;
        this.statuses = values[1].data;
        this.defaultStatuses = [];
        this.statuses.forEach(element => {
            if (element.isDefault === 1)
                this.defaultStatuses.push(element.statusId);
        });
        this.frmAdvancedSearch.controls["status"].setValue(this.defaultStatuses);
        this.revenueInfo.statusIdList = this.defaultStatuses;
        this.setPaginatorAndSort();

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

                    this.revenueInfo.page = this.pagination;
                    return this.revenueService.getRevenues(this.revenueInfo);

                }),
                map(() => {
                    this.isLoading = false;
                })
            ).subscribe();
        }
    }
    private getRevenuesOnInit(): Observable<any> {
        this.pagination = new Paging();
        this.pagination.flag = true;
        this.pagination.length = 0;
        this.pagination.order = 'desc';
        this.pagination.pageNumber = 1;
        this.pagination.pageSize = 100;
        this.pagination.sort = '';
        this.revenueInfo.page = this.pagination;
        let obj: Property = new Property();
        obj.page = this.pagination;
        return this.revenueService.getRevenuesOnInit(this.revenueInfo);
    }

    private getPayers() {
        this.revenueService.getPayers().subscribe(res => {
            this.payers = res.data;
        });
    }

    private getPaymentType() {
        this.revenueService.getPaymentTypes().subscribe(res => {
            this.paymentTypes = res.data;
        });
    }


    private getStatuses(): Observable<any> {
        return this.revenueService.getStatuses();
    }
    protected filterPayersMulti() {
        if (this.payers.length === 0) {
            return;
        }
        // get the search keyword
        let search = this.payersMultiFilterCtrl.value;
        if (search && search.length > 2) {
            this.filteredPayersMulti = [];
            const payers = this.payers.filter(x => x.ownerName.toLocaleLowerCase().includes(search.toLowerCase()));
            payers.forEach(element => {
                const selectedIndx = this.selectedPayers.findIndex(x => x.ownerId === element.ownerId);
                if (selectedIndx === -1)
                    this.filteredPayersMulti.push(element);
            });

        }

    }
    modifyPayers(event: {
        isUserInput: any;
        source: { value: any; selected: any, group: any };
    }, action: string) {

        if (event.isUserInput) {
            if (action === 'add') {
                const indx = this.filteredPayersMulti.findIndex(x => x.ownerId === event.source.value);
                this.selectedPayers.push(this.filteredPayersMulti[indx]);
                this.revenueInfo.payerIdList.push(this.filteredPayersMulti[indx].ownerId);
                this.filteredPayersMulti.splice(indx, 1);
            }
            else {
                const indx = this.selectedPayers.findIndex(x => x.ownerId === event.source.value);
                this.filteredPayersMulti.push(this.filteredPayersMulti[indx]);
                this.revenueInfo.payerIdList.splice(indx, 1);
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
                this.revenueInfo.paymentTypeIdList.push(event.source.value);

            }
            else if (event.source.value != 0 && !event.source.selected) {
                const index: number = this.revenueInfo.paymentTypeIdList.indexOf(event.source.value);
                if (index !== -1)
                    this.revenueInfo.paymentTypeIdList.splice(index, 1);
                this.frmAdvancedSearch.controls["paymentType"].setValue(this.revenueInfo.paymentTypeIdList);
            }
        }


    }

    setStatusValue(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            if (event.source.value != 0 && event.source.selected) {
                this.revenueInfo.statusIdList.push(event.source.value);

            }
            else if (event.source.value != 0 && !event.source.selected) {
                const index: number = this.revenueInfo.statusIdList.indexOf(event.source.value);
                if (index !== -1)
                    this.revenueInfo.statusIdList.splice(index, 1);
                this.frmAdvancedSearch.controls["status"].setValue(this.revenueInfo.statusIdList);
            }
        }


    }
    private getRevenues(revenueInfo: Revenue) {
        this.isLoading = true;
        this.revenueInfo.status = 0;
        this.revenueService.getRevenues(revenueInfo)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((revenues: any) => {
                this.revenues = revenues.data.revenues;
                this._changeDetectorRef.markForCheck();
                this.isLoading = false;
                this.cdr.detectChanges();
            });

    }

    public revenueSearch() {
        this.pagination.flag = true;
        this.pagination.pageNumber = 1;
        this.pagination.length = 0;
        this.pagination.sort = '';
        this.pagination.order = 'asc';

        this.revenueInfo.amountFrom = this.frmAdvancedSearch.controls["amountFrom"].value == null ? null : this.frmAdvancedSearch.controls["amountFrom"].value;
        this.revenueInfo.amountTo = this.frmAdvancedSearch.controls["amountTo"].value == null ? null : this.frmAdvancedSearch.controls["amountTo"].value;
        this.revenueInfo.revenueLocalDateFrom = this.frmAdvancedSearch.controls["dateFrom"].value == null ? null : this.frmAdvancedSearch.controls["dateFrom"].value;
        this.revenueInfo.revenueLocalDateTo = this.frmAdvancedSearch.controls["dateTo"].value == null ? null : this.frmAdvancedSearch.controls["dateTo"].value;
        this.revenueInfo.page = this.pagination;
        this.getRevenues(this.revenueInfo);
    }


    public resetAdvancedSearch() {
        this.frmAdvancedSearch.controls["code"].setValue(null);
        this.frmAdvancedSearch.controls["name"].setValue(null);
        this.frmAdvancedSearch.controls["orderDeadline"].setValue(null);
        this.frmAdvancedSearch.controls["status"].setValue(null);
        this.frmAdvancedSearch.controls["weight"].setValue(null);
        this.frmAdvancedSearch.controls["weightUnit"].setValue(null);

    }
    createDraft() {
        this.isLoading = true;
        this.revenueService.createDraft(this.selectedInfoRow).subscribe(res => {
            this.isLoading = false;
            this.snack.open(res.message, null, { duration: 5000 });
            if (res.succeed)
                this.revenueSearch();
            this.cdr.detectChanges();
        });
    }

    handlePageEvent(event: PageEvent) {
        this.pagination.length = event.length;
        this.pagination.pageSize = event.pageSize;
        this.pagination.pageNumber = event.pageIndex + 1;
        this.pagination.flag = false;
        this.revenueInfo.page = this.pagination;
        this.getRevenues(this.revenueInfo);
    }
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }
    exportTable() {
        let columns: Array<ExcelHeader> = new Array<ExcelHeader>();
        let obj: Array<Revenue> = new Array<Revenue>();
        let amount: number = 0;
        let qty: number = 0;
        let date = formatDate(new Date(), 'yyyyMMdd_hhmmss', 'en');
        let fileName: string = 'Revenue_'.concat(date.toString());

        columns.push({ basedColumnName: 'payerName', excelColumnName: 'Payer' });
        columns.push({ basedColumnName: 'payerTypeName', excelColumnName: 'Payer Type' });
        columns.push({ basedColumnName: 'recipientName', excelColumnName: 'Recipient' });
        columns.push({ basedColumnName: 'recipientTypeName', excelColumnName: 'Recipient Type' });
        columns.push({ basedColumnName: 'paymentTypeName', excelColumnName: 'Payment Type' });
        columns.push({ basedColumnName: 'payerFinancialResourceName', excelColumnName: 'Payer Financial Resource' });
        columns.push({ basedColumnName: 'recipientFinancialResourceName', excelColumnName: 'Recipient Financial Resource' });
        columns.push({ basedColumnName: 'localChangeDate', excelColumnName: 'Register Date' });
        columns.push({ basedColumnName: 'updateLocalDate', excelColumnName: 'Update Date' });
        columns.push({ basedColumnName: 'amount', excelColumnName: 'Amount' });
        columns.push({ basedColumnName: 'statusDescription', excelColumnName: 'Status' });


        this.revenues$.subscribe(items => items.forEach(element => {
            qty = qty + 1;
            amount = amount + element.amount;
            obj.push(element);

        }));



        let footerData = [];

        footerData.push(['', '', '', '', '', '', '', '', 'QTY', qty]);
        footerData.push(['', '', '', '', '', '', '', '', 'AMOUNT', amount.toString().concat(' IRR')]);

        this.excelService.exportAsExcelFile('Revenue', '', columns, obj, footerData, fileName, 'Sheet1');

        obj = [];
    }
    download() {

        var pdf = new jsPDF('l');

        pdf.setFontSize(20);
        pdf.text('Revenue', 14, 8);
        pdf.setFontSize(12);
        pdf.setTextColor(99);
        let header = [];
        let tableData = [];
        let footer = [];
        let amount: number = 0;
        let qty: number = 0;
        let date = formatDate(new Date(), 'yyyyMMdd_hhmmss', 'en');
        let fileName: string = 'Revenue_'.concat(date.concat('.pdf'));

        header = [{ header: 'Payer', dataKey: 'payerName' },
        { header: 'Payer Resource', dataKey: 'payerFinancialResourceName' },
        { header: 'Recipient', dataKey: 'recipientName' },
        { header: 'Recipient Resource', dataKey: 'recipientFinancialResourceName' },
        { header: 'Payment Type', dataKey: 'paymentTypeName' },
        { header: 'Amount', dataKey: 'amount' },
        { header: 'Due Date', dataKey: 'revenueLocalDate' }];


        this.revenues$.subscribe(items => items.forEach(element => {
            qty = qty + 1;
            amount = amount + element.amount;
            tableData.push([
                element.payerName, element.payerFinancialResourceName, element.recipientName,
                element.recipientFinancialResourceName,
                element.paymentTypeName, this.transformDecimal(element.amount),
                element.revenueLocalDate,
            ]);
        }));

        footer = [['QTY', '', '', '', '', '', qty],
        ['AMOUNT', '', '', '', '', '', this.transformDecimal(amount).toString().concat(' IRR')]];


        (pdf as any).autoTable({
            columns: header,
            columnStyles: { name: { cellWidth: 50 } },
            body: tableData,
            foot: footer,
            footStyles: { fillColor: [223, 223, 223], textColor: [0, 0, 0] },
            theme: 'grid',
            showFoot: 'lastPage'
        });

        // Open PDF document in browser's new tab
        pdf.output('dataurlnewwindow')

        // Download PDF doc  
        pdf.save(fileName);
    }
    transformDecimal(num) {
        return num === 0 ? 0 : this._decimalPipe.transform(num, '1.0-5');
    }
}


