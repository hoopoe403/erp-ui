import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { Subject, merge, Observable, forkJoin, fromEvent, of, async, } from 'rxjs';
import { debounceTime, switchMap, map, distinctUntilChanged } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';
import { fuseAnimations } from "../../../../../../@fuse/animations";
import { InventoryDeficitService } from "../inventory-deficit.service";
import { InventoryDeficit } from "../inventory-deficit.types";
import { Paging } from 'app/core/type/paging/paging.type';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
import jsPDF from 'jspdf';
import { DecimalPipe, formatDate } from '@angular/common';
import { ExcelHeader } from 'app/shared/excel/excel.types';
import { ExcelService } from 'app/shared/excel/excel.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'inventory-deficit-list',
    templateUrl: './list.component.html',
    styles: [
        /* language=SCSS */
        `
            .inventory-deficits-grid {
                grid-template-columns:90px auto 200px 350px 30px  150px ;

                @screen sm {
                    grid-template-columns:90px auto  350px 30px  150px ;
                }

                @screen md {
                    grid-template-columns:90px auto  350px 30px  150px ;
                }

                @screen lg {
                    grid-template-columns:90px auto 200px 350px 30px  150px ;
                }
                @screen print{
                    grid-template-columns:90px auto  350px 30px  150px ;
                }
            }
        `,
        `
        .inventory-deficits-details-grid {
            grid-template-columns:150px 140px auto 300px 100px 100px;

            @screen sm {
                grid-template-columns:90px auto  350px 30px ;
            }

            @screen md {
                grid-template-columns:90px auto  350px 30px ;
            }

            @screen lg {
                grid-template-columns:150px 140px auto 300px 100px 100px;
            }
            @screen print{
                grid-template-columns:90px auto 300px 350px 30px;
            }
        }
    `
    ],
    animations: fuseAnimations,
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InventoryDeficitListComponent implements OnInit, OnDestroy {
    protected _onDestroy = new Subject<void>();
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild("accumalativeSort") private _sort: MatSort;
    @ViewChild(MatPaginator) private _paginatorDetails: MatPaginator;
    @ViewChild("detailSort") private _sortDetails: MatSort;
    reportType: number;
    pagination: Paging;
    inventoryDeficitInfo: InventoryDeficit;
    covers: any = [];
    sortFlag: boolean = false;
    detailSortFlag: boolean = false;
    frmAdvancedSearch = new FormGroup({
        reportType: new FormControl(),
        merchandiseCode: new FormControl(),
        merchandiseName: new FormControl(),
        technicalNumber: new FormControl(),
        cover: new FormControl(),
        requestCode: new FormControl(),
        measure: new FormControl(),

    });


    searchInputControl: FormControl = new FormControl();

    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
    @ViewChild('filter', { static: true }) filter: ElementRef;

    // Private
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    isLoading: boolean;

    constructor(private service: InventoryDeficitService,
        private cdr: ChangeDetectorRef,
        private _decimalPipe: DecimalPipe,
        private _excelService: ExcelService,
        private snack: MatSnackBar,
        private _formBuilder: FormBuilder,
        private _changeDetectorRef: ChangeDetectorRef) {
        //this._unsubscribeAll = new Subject();
        this.inventoryDeficitInfo = new InventoryDeficit();
        this.inventoryDeficitInfo.coverIdList = [];
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------
    isOverlayOpen: boolean = true;

    /**
     * On init
     */


    InventoryDeficits$: Observable<InventoryDeficit[]>;
    InventoryDeficitsDetails$: Observable<InventoryDeficit[]>;
    ngOnInit(): void {
        this.reportType = 1;
        this.frmAdvancedSearch.controls["reportType"].setValue(1);
        this.isLoading = true;
        this.service.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: Paging) => {

                // Update the pagination
                this.pagination = pagination;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });


        this.initialPagination();
        fromEvent(this.filter.nativeElement, 'keyup')
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(150),
                distinctUntilChanged()
            )
            .subscribe(() => {
                if (this.reportType == 1) {
                    if (!this.InventoryDeficits$)
                        return;
                }
                else
                    if (!this.InventoryDeficitsDetails$)
                        return;

                if (this.reportType == 1)
                    this.service.inventoryDeficits$.pipe(map(items => items.filter(x =>
                        x.merchandiseCode.toLowerCase().includes(this.filter.nativeElement.value) ||
                        x.merchandiseName.toLowerCase().includes(this.filter.nativeElement.value) ||
                        x.coverName.toLowerCase().toString().includes(this.filter.nativeElement.value) ||
                        x.measure.toString().includes(this.filter.nativeElement.value) ||
                        x.measurementMetricName.toLowerCase().toString().includes(this.filter.nativeElement.value)))).subscribe(elements => {
                            this.InventoryDeficits$ = of(elements as InventoryDeficit[]);
                            this._changeDetectorRef.markForCheck();
                            this._changeDetectorRef.detectChanges();
                        });
                else
                    this.service.inventoryDeficitsDetails$.pipe(map(items => items.filter(x =>
                        x.requestCode.includes(this.filter.nativeElement.value) ||
                        x.customerNameFamily.toLowerCase().includes(this.filter.nativeElement.value) ||
                        x.merchandiseName.toLowerCase().includes(this.filter.nativeElement.value) ||
                        x.merchandiseCode.toLowerCase().includes(this.filter.nativeElement.value) ||
                        x.merchandiseTypeName.toLowerCase().toString().includes(this.filter.nativeElement.value) ||
                        x.coverName.toLowerCase().toString().includes(this.filter.nativeElement.value) ||
                        x.measure.toString().includes(this.filter.nativeElement.value) ||
                        x.measurementMetricName.toLowerCase().includes(this.filter.nativeElement.value) ||
                        x.sourceDeficitName.toLowerCase().includes(this.filter.nativeElement.value) ||
                        x.sourceDeficitTypeName.toLowerCase().includes(this.filter.nativeElement.value)))).subscribe(elements => {
                            this.InventoryDeficitsDetails$ = of(elements as InventoryDeficit[]);
                            this._changeDetectorRef.markForCheck();
                            this.cdr.detectChanges();
                        });
            });

        this.loadData();



    }
    private initialPagination() {
        this.pagination = new Paging();
        this.pagination.flag = true;
        this.pagination.length = 0;
        this.pagination.order = 'desc';
        this.pagination.pageNumber = 1;
        this.pagination.pageSize = 100;
        this.pagination.sort = '';
    }
    private setPaginatorAndSort(): void {
        if (this.sortFlag)
            return;
        if (this._sort && this._paginator) {
            this.sortFlag = true;
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
                    this.pagination.length = this._paginator.length;
                    this.pagination.pageSize = this._paginator.pageSize;
                    this.pagination.pageNumber = this._paginator.pageIndex + 1;
                    this.pagination.flag = false;
                    this.pagination.order = this._sort.direction == null ? 'desc' : this._sort.direction;
                    this.pagination.sort = this._sort.active == null ? '' : this._sort.active;
                    this.inventoryDeficitInfo.page = this.pagination;
                    return this.service.getInventoryDeficits(this.inventoryDeficitInfo);
                }),
                map(() => {
                    this.isLoading = false;
                })
            ).subscribe();
        }
    }

    private setPaginatorAndSortDetail(): void {
        if (this.detailSortFlag)
            return;
        if (this._sortDetails && this._paginator) {
            this.detailSortFlag = true;
            // Set the initial sort
            this._sortDetails.sort({
                id: '',
                start: 'desc',
                disableClear: true
            });

            //Mark For Check
            this._changeDetectorRef.markForCheck();

            // If the user changes the sort order...

            this._sortDetails.sortChange
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe(() => {
                    // Reset back to the first page
                    this._paginator.pageIndex = 0;
                })


            // Get products if sort or page changes
            merge(this._sortDetails.sortChange, this._paginator.page).pipe(
                switchMap(() => {
                    this.isLoading = true;
                    this.pagination.length = this._paginator.length;
                    this.pagination.pageSize = this._paginator.pageSize;
                    this.pagination.pageNumber = this._paginator.pageIndex + 1;
                    this.pagination.flag = false;
                    this.pagination.order = this._sortDetails.direction == null ? 'desc' : this._sortDetails.direction;
                    this.pagination.sort = this._sortDetails.active == null ? '' : this._sortDetails.active;
                    this.inventoryDeficitInfo.page = this.pagination;
                    return this.service.getInventoryDeficitsDetails(this.inventoryDeficitInfo);

                }),
                map(() => {
                    this.isLoading = false
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
        this.service.disposeInventoryDeficits$();
        this.service.disposeInventoryDeficitsDetails$();
        this.service.disponsePaginator$();

    }
    private setForkJoinValues(values: Array<any>): void {
        this.covers = values[0].data;
        this.InventoryDeficits$ = this.service.inventoryDeficits$;
        this._changeDetectorRef.markForCheck();
        this.cdr.detectChanges();
        this.setPaginatorAndSort();
        this.setPaginatorAndSortDetail();

    }
    private loadData(): void {
        forkJoin(
            this.getCovers(),
            this.getInventoryDeficitsOnInit(),
        ).subscribe(res => {
            this.setForkJoinValues(res);
            this.isLoading = false;
            this.cdr.detectChanges();
        });
    }



    private getInventoryDeficitsDetails(inventoryDeficitInfo: InventoryDeficit) {
        this.isLoading = true;
        this.service.getInventoryDeficitsDetails(inventoryDeficitInfo)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((financialDocumentsDetails: any) => {
                this.reportType = this.frmAdvancedSearch.controls['reportType'].value;
                this.InventoryDeficitsDetails$ = this.service.inventoryDeficitsDetails$;
                this.isLoading = false;
                this._changeDetectorRef.markForCheck();
                this.cdr.detectChanges();
                this.setPaginatorAndSortDetail();
            });
    }
    private getInventoryDeficits(inventoryDeficitInfo: InventoryDeficit) {
        this.isLoading = true;
        this.service.getInventoryDeficits(inventoryDeficitInfo)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((financialDocumentsDetails: any) => {
                this.reportType = this.frmAdvancedSearch.controls['reportType'].value;
                this.InventoryDeficits$ = this.service.inventoryDeficits$;
                this.isLoading = false;
                this._changeDetectorRef.markForCheck();
                this.cdr.detectChanges();
                this.setPaginatorAndSort();
            });
    }

    private getInventoryDeficitsOnInit(): Observable<any> {
        this.pagination = new Paging();
        this.pagination.flag = true;
        this.pagination.length = 0;
        this.pagination.order = 'desc';
        this.pagination.pageNumber = 1;
        this.pagination.pageSize = 100;
        this.pagination.sort = '';
        this.inventoryDeficitInfo.page = this.pagination;
        return this.service.getInventoryDeficits(this.inventoryDeficitInfo);
    }
    private getCovers(): Observable<any> {
        return this.service.getCovers();
    }

    public inventoryDeficitSearch() {

        this.pagination.flag = true;
        this.pagination.pageNumber = 1;
        this.pagination.length = 0;

        this.inventoryDeficitInfo.merchandiseCode = this.frmAdvancedSearch.controls["merchandiseCode"].value;
        this.inventoryDeficitInfo.merchandiseName = this.frmAdvancedSearch.controls["merchandiseName"].value;
        this.inventoryDeficitInfo.requestCode = this.frmAdvancedSearch.controls["requestCode"].value;
        this.inventoryDeficitInfo.technicalNumber = this.frmAdvancedSearch.controls["technicalNumber"].value;
        this.inventoryDeficitInfo.measure = this.frmAdvancedSearch.controls["measure"].value;
        this.inventoryDeficitInfo.page = this.pagination;
        if (this.frmAdvancedSearch.controls['reportType'].value == 1)
            this.getInventoryDeficits(this.inventoryDeficitInfo);
        else
            this.getInventoryDeficitsDetails(this.inventoryDeficitInfo);

    }



    public resetAdvancedSearch() {
        this.frmAdvancedSearch.controls["reportType"].setValue(1);
        this.frmAdvancedSearch.controls["merchandiseCode"].setValue(null);
        this.frmAdvancedSearch.controls["merchandiseName"].setValue(null);
        this.frmAdvancedSearch.controls["technicalNumber"].setValue(null);
        this.frmAdvancedSearch.controls["cover"].setValue([]);
        this.inventoryDeficitInfo.coverIdList = [];
        this.frmAdvancedSearch.controls["requestCode"].setValue(null);
        this.frmAdvancedSearch.controls["measure"].setValue(null);

    }


    trackByFn(index: number, item: any): any {
        return item.id || index;
    }


    transformDecimal(num) {
        return num == 0 ? 0 : this._decimalPipe.transform(num, '1.0-5');
    }
    coverItemIsChecked(coverId: number): boolean {
        return this.inventoryDeficitInfo.coverIdList.filter(x => x == coverId).length > 0
    }
    setAllCovers() {
        if (this.covers.length != this.inventoryDeficitInfo.coverIdList.length) {
            this.inventoryDeficitInfo.coverIdList = [];
            for (var i = 0; i < this.covers.length; i++)
                this.inventoryDeficitInfo.coverIdList.push(this.covers[i].key);
        }
        else
            this.inventoryDeficitInfo.coverIdList = [];

    }

    setCoversValue(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            if (event.source.value != 0 && event.source.selected) {
                this.inventoryDeficitInfo.coverIdList.push(event.source.value);

            }
            else if (event.source.value != 0 && !event.source.selected) {
                const index: number = this.inventoryDeficitInfo.coverIdList.indexOf(event.source.value);
                if (index !== -1)
                    this.inventoryDeficitInfo.coverIdList.splice(index, 1);
                this.frmAdvancedSearch.controls["cover"].setValue(this.inventoryDeficitInfo.coverIdList);
            }
        }


    }
    download() {

        var pdf = new jsPDF('l');

        pdf.setFontSize(20);
        pdf.text('Inventory Deficit', 14, 8);
        pdf.setFontSize(12);
        pdf.setTextColor(99);

        let header = [];
        let footer = [];
        let totalDeficit: number = 0;
        let date = formatDate(new Date(), 'yyyyMMdd_hhmmss', 'en');
        let fileName: string = 'InventoryDeficit'.concat(date.concat('.pdf'));

        if (this.reportType === 1)
            header = [['Code', 'Name', 'Cover', 'Measure', 'Unit']];
        else
            header = [['Request', 'Code', 'Name', 'Cover', 'Measure', 'Unit']];




        let tableData = [];
        if (this.reportType === 1)
            this.InventoryDeficits$.subscribe(items => items.forEach(element => {
                totalDeficit = totalDeficit + element.measure;
                tableData.push([
                    element.merchandiseCode, element.merchandiseName, element.coverName,
                    element.measure, element.unitName
                ]);
            }))
        else
            this.InventoryDeficitsDetails$.subscribe(items => items.forEach(element => {
                totalDeficit = totalDeficit + element.measure;
                tableData.push([element.requestCode,
                element.merchandiseCode, element.merchandiseName, element.coverName,
                element.measure, element.unitName
                ]);
            }))
        if (this.reportType === 1)
            footer = [['Total Deficit', '', '', '', parseFloat(totalDeficit.toString()).toFixed(2), '']];
        else
            footer = [['Total Deficit', '', '', '', '', parseFloat(totalDeficit.toString()).toFixed(2), '']];



        (pdf as any).autoTable({
            head: header,
            body: tableData,
            foot: footer,
            footStyles: { fillColor: [223, 223, 223], textColor: [0, 0, 0] },
            theme: 'grid',
            showFoot: 'lastPage'
        })


        // Open PDF document in browser's new tab
        pdf.output('dataurlnewwindow')

        // Download PDF doc  
        pdf.save(fileName);
    }

    exportTable() {
        let columns: Array<ExcelHeader> = new Array<ExcelHeader>();
        let obj: Array<InventoryDeficit> = new Array<InventoryDeficit>();
        let totalDeficit: number = 0;
        let date = formatDate(new Date(), 'yyyyMMdd_hhmmss', 'en');
        let fileName: string = 'InventoryDeficit_'.concat(date.toString());

        if (this.reportType === 1) {
            columns.push({ basedColumnName: 'merchandiseCode', excelColumnName: 'Code' });
            columns.push({ basedColumnName: 'merchandiseName', excelColumnName: 'Name' });
            columns.push({ basedColumnName: 'technicalNumber', excelColumnName: 'Technical Number' });
            columns.push({ basedColumnName: 'coverName', excelColumnName: 'Cover' });
            columns.push({ basedColumnName: 'measurementMetricName', excelColumnName: 'Measurement Metric' });
            columns.push({ basedColumnName: 'unitName', excelColumnName: 'Unit' });
            columns.push({ basedColumnName: 'measure', excelColumnName: 'Measure' });
        }
        else {
            columns.push({ basedColumnName: 'requestCode', excelColumnName: 'Request' });
            columns.push({ basedColumnName: 'merchandiseCode', excelColumnName: 'Code' });
            columns.push({ basedColumnName: 'merchandiseName', excelColumnName: 'Name' });
            columns.push({ basedColumnName: 'technicalNumber', excelColumnName: 'Technical Number' });
            columns.push({ basedColumnName: 'coverName', excelColumnName: 'Cover' });
            columns.push({ basedColumnName: 'measurementMetricName', excelColumnName: 'Measurement Metric' });
            columns.push({ basedColumnName: 'unitName', excelColumnName: 'Unit' });
            columns.push({ basedColumnName: 'measure', excelColumnName: 'Measure' });
        }

        if (this.reportType == 1)
            this.InventoryDeficits$.subscribe(items => items.forEach(element => {
                totalDeficit = totalDeficit + 1;
                obj.push(element)
            }));
        else
            this.InventoryDeficitsDetails$.subscribe(items => items.forEach(element => {
                totalDeficit = totalDeficit + 1;
                obj.push(element)
            }));

        let footerData = [];

        if (this.reportType === 1)
            footerData.push(['', '', '', '', '',  'Total', totalDeficit]);
        else
            footerData.push(['', '', '', '', '', '',  'Total', totalDeficit]);

        this._excelService.exportAsExcelFile('Inventory Deficit Report', '', columns, obj, footerData, fileName, 'Sheet1');
    }


}




