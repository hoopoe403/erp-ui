import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Subject, merge, Observable, forkJoin, fromEvent, of } from 'rxjs';
import { debounceTime, switchMap, map, distinctUntilChanged } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';
import { fuseAnimations } from "../../../../../@fuse/animations";
import { ProductionProgramService } from "../productionPrograms.service";
import { ProductionProgram, ProductionProgramSerialPool } from "../productionPrograms.types";
import { Paging } from 'app/core/type/paging/paging.type';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
// import jsPDF from 'jspdf';
import { DecimalPipe, formatDate } from '@angular/common';
// import { ExcelHeader } from 'app/shared/excel/excel.types';
import { ExcelService } from 'app/shared/excel/excel.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DialogService } from '../details/dialog.Service';
import { MatDialog } from '@angular/material/dialog';
import { SelectionModel } from '@angular/cdk/collections';
import jsPDF from 'jspdf';
import { ExcelHeader } from 'app/shared/excel/excel.types';



@Component({
    selector: 'productionPrograms-list',
    templateUrl: './list.component.html',
    styles: [
        /* language=SCSS */
        `
            .productionPrograms-grid {
                grid-template-columns:auto 100px  100px 70px;

                @screen sm {
                    grid-template-columns:auto 100px  100px 70px;
                }

                @screen md {
                    grid-template-columns: auto 100px  100px 70px;
                }

                @screen lg {
                    grid-template-columns:30px 130px auto 100px  150px 130px 150px 50px;
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
export class ProductionProgramsListComponent implements OnInit, OnDestroy {
    protected _onDestroy = new Subject<void>();
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;
    statuses = [];
    defaultStatuses = [];
    pagination: Paging;
    selection = new SelectionModel<any>(true, []);
    productionProgramInfo: ProductionProgram;
    ProductionProgramSerialPoolInfo: ProductionProgramSerialPool;
    filteredItemsCount: number = 0;
    frmAdvancedSearch = new FormGroup({
        status: new FormControl(),
        productCode: new FormControl(),
        productName: new FormControl(),
        serial: new FormControl(),
        requestCode: new FormControl(),
        customer: new FormControl(),
        productionFromDate: new FormControl(),
        productionToDate: new FormControl(),
    });


    searchInputControl: FormControl = new FormControl();

    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
    @ViewChild('filter', { static: true }) filter: ElementRef;
    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
    @ViewChild(MatSort, { static: true }) sort: MatSort;
    // Private
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    isLoading: boolean;

    constructor(private service: ProductionProgramService,
        private _dialogService: DialogService,
        private cdr: ChangeDetectorRef,
        private _decimalPipe: DecimalPipe,
        private _excelService: ExcelService,
        private snack: MatSnackBar,
        private _formBuilder: FormBuilder,
        private dialog: MatDialog,
        private _changeDetectorRef: ChangeDetectorRef) {
        this.productionProgramInfo = new ProductionProgram();
        this.productionProgramInfo.statusIdList = [];
        this.productionProgramInfo.productionProgramIdList = [];
        // this.productionProgramInfo.financialDocumentDetailIdList = [];
        // this.menuFilter = [];
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------
    isOverlayOpen: boolean = true;
    selectedInfoDetailRow: ProductionProgram = new ProductionProgram();

    /**
     * On init
     */




    productionPrograms$: Observable<ProductionProgram[]>
    ProductionProgramSerialPool$: Observable<ProductionProgramSerialPool[]>
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

                if (!this.productionProgramInfo)
                    return;


                this.service.productionPrograms$.pipe(map(items => items.filter(x =>
                    x.requestCode.toString().toLowerCase().includes(this.filter.nativeElement.value) ||
                    x.customerFullName.toLowerCase().includes(this.filter.nativeElement.value) ||
                    x.fullName.includes(this.filter.nativeElement.value) ||
                    x.brandName.includes(this.filter.nativeElement.value) ||
                    x.frameCoverName.toString().includes(this.filter.nativeElement.value) ||
                    x.panelCoverName.toLowerCase().includes(this.filter.nativeElement.value) ||
                    x.requestTypeName.toLowerCase().includes(this.filter.nativeElement.value) ||
                    x.statusDescription.toLowerCase().includes(this.filter.nativeElement.value)))).subscribe(elements => {
                        this.productionPrograms$ = of(elements as ProductionProgram[]);
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

                    this.productionProgramInfo.page = this.pagination;
                    return this.service.getProductionPrograms(this.productionProgramInfo);

                }),
                map(() => {
                    this.isLoading = false;
                    this.productionPrograms$ = this.service.productionPrograms$;
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
        this.productionProgramInfo.statusIdList = this.defaultStatuses;
        this.productionPrograms$ = this.service.productionPrograms$;
        this.service.productionPrograms$.forEach(items => {
            this.filteredItemsCount = items.length;
        });
        this._changeDetectorRef.markForCheck();
        this.cdr.detectChanges();
        this.setPaginatorAndSort();

    }

    private loadData(): void {
        forkJoin(
            this.getStatuses(),
            this.getProductionProgramsOnInit(),
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
                this.productionProgramInfo.statusIdList.push(event.source.value);

            }
            else if (event.source.value != 0 && !event.source.selected) {
                const index: number = this.productionProgramInfo.statusIdList.indexOf(event.source.value);
                if (index !== -1)
                    this.productionProgramInfo.statusIdList.splice(index, 1);
                this.frmAdvancedSearch.controls["status"].setValue(this.productionProgramInfo.statusIdList);
            }
        }


    }



    private getProductionPrograms(productionProgramInfo: ProductionProgram) {
        this.isLoading = true;
        this.service.getProductionPrograms(productionProgramInfo)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((productionProgramInfo: any) => {
                this.productionPrograms$ = this.service.productionPrograms$;
                this.isLoading = false;
                this._changeDetectorRef.markForCheck();
                this.cdr.detectChanges();
                this.setPaginatorAndSort();
            });
    }

    private getProductionProgramsOnInit(): Observable<any> {
        this.pagination = new Paging();
        this.pagination.flag = true;
        this.pagination.length = 0;
        this.pagination.order = 'desc';
        this.pagination.pageNumber = 1;
        this.pagination.pageSize = 100;
        this.pagination.sort = '';
        this.productionProgramInfo.page = this.pagination;
        return this.service.getProductionProgramsOnInit(this.productionProgramInfo);

    }

    public productionProgramsSearch() {
        this.selection.clear()
        this.pagination.flag = true;
        this.pagination.pageNumber = 1;
        this.pagination.length = 0;


        this.productionProgramInfo.productCode = this.frmAdvancedSearch.controls["productCode"].value;
        this.productionProgramInfo.fullName = this.frmAdvancedSearch.controls["productName"].value;
        this.productionProgramInfo.serial = this.frmAdvancedSearch.controls["serial"].value;
        this.productionProgramInfo.requestCode = this.frmAdvancedSearch.controls["requestCode"].value;
        this.productionProgramInfo.customerFullName = this.frmAdvancedSearch.controls["customer"].value;
        this.productionProgramInfo.productionFromDate = this.frmAdvancedSearch.controls["productionFromDate"].value;
        this.productionProgramInfo.productionToDate = this.frmAdvancedSearch.controls["productionToDate"].value;
        this.productionProgramInfo.page = this.pagination;
        this.productionProgramInfo.productionProgramIdList = [];
        this.getProductionPrograms(this.productionProgramInfo);

    }
    // confirmByList() {
    //     this.isLoading = true;
    //     this.service.confirmByList(this.financialDocumentDetailInfo).subscribe(res => {
    //         this.snack.open(res.message, null, { duration: 5000 });
    //         if (res.succeed)
    //             this.financialDocumentSearch();
    //     });
    // }

    download() {
        var pdf = new jsPDF('l');
        pdf.setFontSize(20);
        pdf.text('ProductionProgram', 14, 8);
        pdf.setFontSize(12);
        pdf.setTextColor(99);
        let header = [];
        let tableData = [];
        let footer = [];
        let qty: number = 0;
        let date = formatDate(new Date(), 'yyyyMMdd_hhmmss', 'en');
        let fileName: string = 'productionProgram_'.concat(date.concat('.pdf'));
        header = [{ header: "Applicant" },
        { header: "Brand" },
        { header: "Product" },
        { header: "Frame Cover" },
        { header: "Panel Cover" },
        { header: "Serial" },
        { header: "Status" }
        ];
        this.productionPrograms$.subscribe(items => items.forEach(element => {
            qty = qty + 1;
            tableData.push([
                element.requestCode, element.brandName, element.fullName,
                element.frameCoverName, element.panelCoverName, element.serial,
                element.statusDescription
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
        let obj: Array<ProductionProgram> = new Array<ProductionProgram>();
        let qty: number = 0;
        let date = formatDate(new Date(), 'yyyyMMdd_hhmmss', 'en');
        let fileName: string = 'productionProgram_'.concat(date.toString());
        columns.push({ basedColumnName: 'requestCode', excelColumnName: 'Request Code' });
        columns.push({ basedColumnName: 'requestTypeName', excelColumnName: 'Request Type' });
        columns.push({ basedColumnName: 'customerFullName', excelColumnName: 'Customer' });
        columns.push({ basedColumnName: 'brandName', excelColumnName: 'Brand' });
        columns.push({ basedColumnName: 'productCode', excelColumnName: 'Code' });
        columns.push({ basedColumnName: 'fullName', excelColumnName: 'Product' });
        columns.push({ basedColumnName: 'frameCoverName', excelColumnName: 'Frame Cover' });
        columns.push({ basedColumnName: 'panelCoverName', excelColumnName: 'Panel Cover' });
        columns.push({ basedColumnName: 'serial', excelColumnName: 'Serial' });
        columns.push({ basedColumnName: 'deliveryDate', excelColumnName: 'Delivery Date' });
        columns.push({ basedColumnName: 'statusDescription', excelColumnName: 'Status' });
        this.productionPrograms$.subscribe(items => items.forEach(element => {
            qty = qty + 1;
            obj.push(element)
        }));


        let footerData = [];

        footerData.push(['', '', '', '', '', '', '', 'QTY', qty]);

        this._excelService.exportAsExcelFile('productionProgram', '', columns, obj, footerData, fileName, 'Sheet1');

        obj = [];
    }

    showSerialDialog() {
        let productionProgramIdLists: Array<number> = [];
        this.selection.selected.forEach(element => {
            if (element.serial !== null && element.serial != '')
                productionProgramIdLists.push(element.productionProgramId);
        })
        const dialogRef = this._dialogService.open({
            productionProgramIdList: productionProgramIdLists,
            actions: {
                printSerial: {
                    show: true,
                    label: 'Print Serial',
                    color: 'primary',
                },
                cancel: {
                    show: true
                }
            },
            dismissible: {
                show: true
            }
        });
        dialogRef.afterClosed().subscribe((result) => {

        })

    }



    public resetAdvancedSearch() {
        this.frmAdvancedSearch.controls["status"].setValue(this.defaultStatuses);
        this.frmAdvancedSearch.controls["productCode"].setValue(null);
        this.frmAdvancedSearch.controls["productName"].setValue(null);
        this.frmAdvancedSearch.controls["serial"].setValue(null);
        this.frmAdvancedSearch.controls["requestCode"].setValue(null);
        this.frmAdvancedSearch.controls["customer"].setValue(null);
        this.frmAdvancedSearch.controls["productionFromDate"].setValue(null);
        this.frmAdvancedSearch.controls["productionToDate"].setValue(null);

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



    transformDecimal(num) {
        return num == 0 ? 0 : this._decimalPipe.transform(num, '1.0-5');
    }





    toggleAllSelectedItem(): void {
        if (this.selection.selected.length === this.filteredItemsCount)
            this.selection.clear()
        else {
            this.selection.clear()
            this.productionPrograms$.pipe(map(items => items)).subscribe(elements => {
                for (let i = 0; i < elements.length; i++)
                    this.selection.selected.push(elements[i].productionProgramId);
                this._changeDetectorRef.markForCheck();
                this._changeDetectorRef.detectChanges();
            });
        }
    }

    toggleSelectedItem(row: any): void {
        const indx = this.selection.selected.findIndex(x => x.productionProgramId === row.productionProgramId);
        if (indx !== -1)
            this.selection.selected.splice(indx, 1);
        else
            this.selection.selected.push(row);
    }

    checkSelectedItem(row: any): boolean {
        return this.selection.selected.findIndex(x => x === row.productionProgramId) > -1;
    }
    selectAllIsChecked(): boolean {

        if
            (this.selection.selected.length > 0 &&
            this.selection.selected.length === this.filteredItemsCount &&
            !this.isLoading)
            return true;
        else
            return false;

    }

    selectAllIsIndeterminate(): boolean {

        if (this.selection.selected.length > 0 &&
            this.selection.selected.length < this.filteredItemsCount &&
            this.filteredItemsCount > 0 && !this.isLoading)
            return true;
        else
            return false;
    }



}







