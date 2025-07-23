import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { Subject, merge, Observable, forkJoin, fromEvent, of, async, } from 'rxjs';
import { debounceTime, switchMap, map, distinctUntilChanged } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';
import { fuseAnimations } from "../../../../../@fuse/animations";
import { DocumentService } from "../document.service";
import { FinancialDocumentDetail } from "../document.types";
import { Paging } from 'app/core/type/paging/paging.type';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
import { FinancialYear } from '../../shared/financial.types';
import { DialogService } from '../details/dialog.service'
import jsPDF from 'jspdf';
import { DecimalPipe, formatDate } from '@angular/common';
import { ExcelHeader } from 'app/shared/excel/excel.types';
import { ExcelService } from 'app/shared/excel/excel.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'document-list',
    templateUrl: './list.component.html',
    styles: [
        /* language=SCSS */
        `
            .documents-grid {
                grid-template-columns:auto 100px  100px 70px;

                @screen sm {
                    grid-template-columns:auto 100px  100px 70px;
                }

                @screen md {
                    grid-template-columns: auto 100px  100px 70px;
                }

                @screen lg {
                    grid-template-columns:30px auto  90px 150px  150px 130px 120px 90px 50px;
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
export class DocumentListComponent implements OnInit, OnDestroy {
    protected _onDestroy = new Subject<void>();
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;
    statuses = [];
    defaultStatuses = [];
    public menuFilter: Array<FinancialDocumentDetail>;
    pagination: Paging;
    selection = new SelectionModel<any>(true, []);
    financialDocumentDetailInfo: FinancialDocumentDetail;
    financialYears: Array<FinancialYear>;
    filteredItemsCount: number = 0;
    frmAdvancedSearch = new FormGroup({
        status: new FormControl(),
        year: new FormControl(),
        documentNumber: new FormControl(),
        debitFrom: new FormControl(),
        debitTo: new FormControl(),
        creditFrom: new FormControl(),
        creditTo: new FormControl(),
        debitBalanceFrom: new FormControl(),
        debitBalanceTo: new FormControl(),
        creditBalanceFrom: new FormControl(),
        creditBalanceTo: new FormControl()
    });


    searchInputControl: FormControl = new FormControl();

    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
    @ViewChild('filter', { static: true }) filter: ElementRef;

    // Private
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    isLoading: boolean;

    constructor(private service: DocumentService,
        private _dialogService: DialogService,
        private cdr: ChangeDetectorRef,
        private _decimalPipe: DecimalPipe,
        private _excelService: ExcelService,
        private snack: MatSnackBar,
        private _formBuilder: FormBuilder,
        private _changeDetectorRef: ChangeDetectorRef) {
        //this._unsubscribeAll = new Subject();
        this.financialDocumentDetailInfo = new FinancialDocumentDetail();
        this.financialDocumentDetailInfo.statusIdList = [];
        this.financialDocumentDetailInfo.financialDocumentDetailIdList = [];
        this.menuFilter = [];
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------
    isOverlayOpen: boolean = true;
    selectedInfoDetailRow: FinancialDocumentDetail = new FinancialDocumentDetail();

    /**
     * On init
     */




    financialDocumentsDetails$: Observable<FinancialDocumentDetail[]>;
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

                if (!this.financialDocumentDetailInfo)
                    return;


                this.service.financialDocumentDetails$.pipe(map(items => items.filter(x =>
                    x.ownerName.toLowerCase().includes(this.filter.nativeElement.value) ||
                    x.ownerTypeName.toLowerCase().includes(this.filter.nativeElement.value) ||
                    x.documentNumber.toString().includes(this.filter.nativeElement.value) ||
                    x.debit.toString().includes(this.filter.nativeElement.value) ||
                    x.credit.toString().includes(this.filter.nativeElement.value) ||
                    x.statusDescription.toLowerCase().includes(this.filter.nativeElement.value) ||
                    x.financialCategoryName.toLowerCase().includes(this.filter.nativeElement.value) ||
                    x.requestTypeName.toLowerCase().includes(this.filter.nativeElement.value) ||
                    x.requestStatusDescription.toLowerCase().includes(this.filter.nativeElement.value) ||
                    x.statusDescription.toLowerCase().includes(this.filter.nativeElement.value)))).subscribe(elements => {
                        this.financialDocumentsDetails$ = of(elements as FinancialDocumentDetail[]);
                        this._changeDetectorRef.markForCheck();
                        this._changeDetectorRef.detectChanges();
                    });

            });

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

                    this.financialDocumentDetailInfo.page = this.pagination;
                    return this.service.getFinancialDocumentsDetails(this.financialDocumentDetailInfo);

                }),
                map(() => {
                    this.isLoading = false;
                    this.financialDocumentsDetails$ = this.service.financialDocumentDetails$;
                    this._changeDetectorRef.markForCheck();
                    this._changeDetectorRef.detectChanges();
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
        this.service.disposeFinancialDocumentsDetails$();
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
        this.financialDocumentDetailInfo.statusIdList = this.defaultStatuses;
        this.financialYears = values[1].data;
        this.financialDocumentsDetails$ = this.service.financialDocumentDetails$;
        this.frmAdvancedSearch.controls['year'].setValue(this.financialYears.filter(x => x.isCurrent === 1)[0].partitionKey);
        this.service.financialDocumentDetails$.forEach(items => {
            this.filteredItemsCount = items.length;
        });
        this.setPaginatorAndSort();

    }
    private loadData(): void {
        forkJoin(
            this.getStatuses(),
            this.getFinancialYears(),
            this.getFinancialDocumentsDetailsOnInit(),
        ).subscribe(res => {
            this.setForkJoinValues(res);
            this.isLoading = false;
            this._changeDetectorRef.markForCheck();
            this.cdr.detectChanges();
        });
    }

    private getFinancialYears(): Observable<any> {
        return this.service.getFinancialYears();
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
                this.financialDocumentDetailInfo.statusIdList.push(event.source.value);

            }
            else if (event.source.value != 0 && !event.source.selected) {
                const index: number = this.financialDocumentDetailInfo.statusIdList.indexOf(event.source.value);
                if (index !== -1)
                    this.financialDocumentDetailInfo.statusIdList.splice(index, 1);
                this.frmAdvancedSearch.controls["status"].setValue(this.financialDocumentDetailInfo.statusIdList);
            }
        }


    }

    private getFinancialDocumentsDetails(financialDocumentDetailInfo: FinancialDocumentDetail) {
        this.isLoading = true;
        this.service.getFinancialDocumentsDetails(financialDocumentDetailInfo)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((financialDocumentsDetails: any) => {
                this.financialDocumentsDetails$ = this.service.financialDocumentDetails$;
                this.isLoading = false;
                this._changeDetectorRef.markForCheck();
                this.cdr.detectChanges();
                this.setPaginatorAndSort();
            });
    }

    private getFinancialDocumentsDetailsOnInit(): Observable<any> {
        this.pagination = new Paging();
        this.pagination.flag = true;
        this.pagination.length = 0;
        this.pagination.order = 'desc';
        this.pagination.pageNumber = 1;
        this.pagination.pageSize = 100;
        this.pagination.sort = '';
        this.financialDocumentDetailInfo.page = this.pagination;
        return this.service.geFinancialDocumentsDetailsOnInit(this.financialDocumentDetailInfo);
    }
    public financialDocumentSearch() {

        this.pagination.flag = true;
        this.pagination.pageNumber = 1;
        this.pagination.length = 0;

        this.financialDocumentDetailInfo.debitFrom = this.frmAdvancedSearch.controls["debitFrom"].value;
        this.financialDocumentDetailInfo.debitTo = this.frmAdvancedSearch.controls["debitTo"].value;
        this.financialDocumentDetailInfo.creditFrom = this.frmAdvancedSearch.controls["creditFrom"].value;
        this.financialDocumentDetailInfo.creditTo = this.frmAdvancedSearch.controls["creditTo"].value;
        this.financialDocumentDetailInfo.documentNumber = this.frmAdvancedSearch.controls["documentNumber"].value;
        this.financialDocumentDetailInfo.partitionKey = this.frmAdvancedSearch.controls["year"].value;
        this.financialDocumentDetailInfo.page = this.pagination;
        this.financialDocumentDetailInfo.financialDocumentDetailIdList = [];
        this.getFinancialDocumentsDetails(this.financialDocumentDetailInfo);

    }
    confirmByList() {
        this.isLoading = true;
        this.service.confirmByList(this.financialDocumentDetailInfo).subscribe(res => {
            this.snack.open(res.message, null, { duration: 5000 });
            if (res.succeed)
                this.financialDocumentSearch();
        });
    }
    download() {
        var pdf = new jsPDF('l');
        pdf.setFontSize(20);
        pdf.text('Document', 14, 8);
        pdf.setFontSize(12);
        pdf.setTextColor(99);
        let header = [];
        let tableData = [];
        let footer = [];
        let qty: number = 0;
        let date = formatDate(new Date(), 'yyyyMMdd_hhmmss', 'en');
        let fileName: string = 'document_'.concat(date.concat('.pdf'));
        header = [{ header: "Account" },
        { header: "Type" },
        { header: "Number" },
        { header: "Debit" },
        { header: "Credit" },
        { header: "Category" },
        { header: "Applicant" },
        { header: "Status" }
        ];
        this.financialDocumentsDetails$.subscribe(items => items.forEach(element => {
            qty = qty + 1;
            tableData.push([
                element.ownerName, element.ownerTypeName, element.documentNumber,
                this.transformDecimal(element.debit), this.transformDecimal(element.credit),
                element.financialCategoryName, element.requestTypeName, element.statusDescription
            ])
        }))
        footer = [['QTY', '', '', '', '', '', qty]];
        (pdf as any).autoTable({
            columns: header,
            columnStyles: { name: { cellWidth: 50 } },
            body: tableData,
            foot: footer,
            footStyles: { fillColor: [223, 223, 223], textColor: [0, 0, 0] },
            theme: 'grid',
            showFoot: 'lastPage'
        });
        /*  Open PDF document in browser's new tab */
        pdf.output('dataurlnewwindow')

        /*  Download PDF doc   */
        pdf.save(fileName);
    }

    exportTable() {
        let columns: Array<ExcelHeader> = new Array<ExcelHeader>();
        let obj: Array<FinancialDocumentDetail> = new Array<FinancialDocumentDetail>();
        let qty: number = 0;
        let date = formatDate(new Date(), 'yyyyMMdd_hhmmss', 'en');
        let fileName: string = 'document_'.concat(date.toString());
        columns.push({ basedColumnName: 'ownerName', excelColumnName: 'Account' });
        columns.push({ basedColumnName: 'ownerTypeName', excelColumnName: 'Type' });
        columns.push({ basedColumnName: 'documentNumber', excelColumnName: 'Number' });
        columns.push({ basedColumnName: 'debit', excelColumnName: 'Debit' });
        columns.push({ basedColumnName: 'credit', excelColumnName: 'Credit' });
        columns.push({ basedColumnName: 'financialCategoryName', excelColumnName: 'Category' });
        columns.push({ basedColumnName: 'requestTypeName', excelColumnName: 'Applicant' });
        columns.push({ basedColumnName: 'statusDescription', excelColumnName: 'Status' });

        this.financialDocumentsDetails$.subscribe(items => items.forEach(element => {
            qty = qty + 1;
            obj.push(element)
        }));


        let footerData = [];

        footerData.push(['', '', '', '', '', '', '', 'QTY', qty]);

        this._excelService.exportAsExcelFile('document', '', columns, obj, footerData, fileName, 'Sheet1');

        obj = [];
    }


    public resetAdvancedSearch() {
        this.frmAdvancedSearch.controls["reportType"].setValue(1);
        this.frmAdvancedSearch.controls["year"].setValue(0);
        this.frmAdvancedSearch.controls["name"].setValue(null);
        this.frmAdvancedSearch.controls["parentCode"].setValue(null);
        this.frmAdvancedSearch.controls["parentName"].setValue(null);

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


    openDetailDialog(requestId: number, requestTypeId: number, documentNumber: string, status: number, dtId: number) {
        let configForm: FormGroup = this._formBuilder.group({
            financialDocumentDetailId: dtId,
            requestId: requestId,
            requestTypeId: requestTypeId,
            title: 'Document Number: ' + documentNumber,
            actions: this._formBuilder.group({
                confirm: this._formBuilder.group({
                    show: true,
                    label: 'Confirm',
                    color: 'primary',
                    disabled: status !== 1000007 ? true : false
                }),
                cancel: this._formBuilder.group({
                    show: true,
                    label: status !== 1000007 ? 'Close' : 'Cancel'
                })
            }),
            dismissible: this._formBuilder.group({
                show: true,
                disabled: status !== 1000007 ? false : true
            })
        });
        const dialogRef = this._dialogService.open(configForm.value);
        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.service.getFinancialDocumentsDetails(this.financialDocumentDetailInfo)
                    .pipe(takeUntil(this._unsubscribeAll))
                    .subscribe((financialDocumentsDetails: any) => {
                        this.financialDocumentsDetails$ = this.service.financialDocumentDetails$;
                        this.isLoading = false;
                        this._changeDetectorRef.markForCheck();
                        this.cdr.detectChanges();
                    });
            }


        });
    }
    transformDecimal(num) {
        return num == 0 ? 0 : this._decimalPipe.transform(num, '1.0-5');
    }

    toggleAllSelectedItem(): void {
        if (this.financialDocumentDetailInfo.financialDocumentDetailIdList.length === this.filteredItemsCount)
            this.financialDocumentDetailInfo.financialDocumentDetailIdList = [];
        else {
            this.financialDocumentDetailInfo.financialDocumentDetailIdList = [];
            this.financialDocumentsDetails$.pipe(map(items => items)).subscribe(elements => {
                for (let i = 0; i < elements.length; i++)
                    if (elements[i].status == 1000007)
                        this.financialDocumentDetailInfo.financialDocumentDetailIdList.push(elements[i].financialDocumentDetailId);
                this._changeDetectorRef.markForCheck();
                this._changeDetectorRef.detectChanges();
            });
        }
    }

    toggleSelectedItem(numberId: number): void {
        const index = this.financialDocumentDetailInfo.financialDocumentDetailIdList.findIndex(x => x === numberId)
        if (index === -1)
            this.financialDocumentDetailInfo.financialDocumentDetailIdList.push(numberId)
        else {
            this.financialDocumentDetailInfo.financialDocumentDetailIdList.splice(index, 1);
        }
    }

    checkSelectedItem(numberId: number): boolean {
        return this.financialDocumentDetailInfo.financialDocumentDetailIdList.findIndex(x => x === numberId) > -1;
    }
    selectAllIsChecked(): boolean {

        if
            (this.financialDocumentDetailInfo.financialDocumentDetailIdList.length > 0 &&
            this.financialDocumentDetailInfo.financialDocumentDetailIdList.length === this.filteredItemsCount &&
            !this.isLoading)
            return true;
        else
            return false;

    }

    selectAllIsIndeterminate(): boolean {

        if (this.financialDocumentDetailInfo.financialDocumentDetailIdList.length > 0 &&
            this.financialDocumentDetailInfo.financialDocumentDetailIdList.length < this.filteredItemsCount &&
            this.filteredItemsCount > 0 && !this.isLoading)
            return true;
        else
            return false;
    }


}




