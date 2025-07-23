import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { Subject, merge, Observable, forkJoin, fromEvent, of } from 'rxjs';
import { debounceTime, switchMap, map, distinctUntilChanged } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';
import { fuseAnimations } from "../../../../../@fuse/animations";
import { FactoryOrderPredictionService } from "../factory-order-predictions.service";
import { FactoryOrderPrediction, FactoryOrderPredictionDetail } from "../factory-order-predictions.types";
import { Paging } from 'app/core/type/paging/paging.type';
import { FormControl, FormGroup } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
import jsPDF from 'jspdf';
import { DecimalPipe, formatDate } from '@angular/common';
import { ExcelHeader } from 'app/shared/excel/excel.types';
import { ExcelService } from 'app/shared/excel/excel.service';

@Component({
    selector: 'factory-order-predictions-list',
    templateUrl: './list.component.html',
    styles: [
        /* language=SCSS */
        `
            .factory-order-predictions-grid {
                grid-template-columns:auto 100px  100px 70px;

                @screen sm {
                    grid-template-columns:auto 100px  100px 70px;
                }

                @screen md {
                    grid-template-columns: auto 100px  100px 70px;
                }

                @screen lg {
                    grid-template-columns: auto 130px 130px 130px 130px 50px;
                }
                @screen print{
                    grid-template-columns: 100px 370px 370px 70px;
                }
            }
            .factory-order-predictions-detail-grid {
                grid-template-columns:auto 100px  100px 70px;

                @screen sm {
                    grid-template-columns:auto 100px  100px 70px;
                }

                @screen md {
                    grid-template-columns: auto 100px  100px 70px;
                }

                @screen lg {
                    grid-template-columns: 130px auto 130px 130px 130px 50px;
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
export class FactoryOrderPredictionsListComponent implements OnInit, OnDestroy {
    protected _onDestroy = new Subject<void>();
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;
    statuses = [];
    defaultStatuses = [];
    levels = [];
    pagination: Paging;
    selection = new SelectionModel<any>(true, []);
    factoryOrderPredictionInfo: FactoryOrderPrediction;
    factoryOrderPredictionDetailInfo: FactoryOrderPredictionDetail;
    filteredItemsCount: number = 0;
    reportType: number;
    frmAdvancedSearch = new FormGroup({
        reportType: new FormControl(),
        status: new FormControl(),
        level: new FormControl(),
        goodsCode: new FormControl(),
        goodsName: new FormControl(),
        required: new FormControl(),
        available: new FormControl(),
        total: new FormControl(),
    });


    searchInputControl: FormControl = new FormControl();

    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
    @ViewChild('filter', { static: true }) filter: ElementRef;

    // Private
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    isLoading: boolean;

    constructor(private service: FactoryOrderPredictionService,
        private cdr: ChangeDetectorRef,
        private _decimalPipe: DecimalPipe,
        private _excelService: ExcelService,
        private _changeDetectorRef: ChangeDetectorRef) {
        this.factoryOrderPredictionInfo = new FactoryOrderPrediction();
        this.factoryOrderPredictionInfo.statusIdList = [];
        this.factoryOrderPredictionInfo.levelNumberList = [];
        this.factoryOrderPredictionDetailInfo = new FactoryOrderPredictionDetail();
        this.factoryOrderPredictionDetailInfo.levelNumberList = [];
        this.factoryOrderPredictionDetailInfo.parentTypeIdList = [];
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------
    isOverlayOpen: boolean = true;
    selectedInfoDetailRow: FactoryOrderPrediction = new FactoryOrderPrediction();
    factoryOrderPredictions : Array<FactoryOrderPrediction> = [];
    factoryOrderPredictionsDetails : Array<FactoryOrderPredictionDetail> = [];
    /**
     * On init
     */


    
    get factoryOrderPredicyionsDetails$(): Observable<FactoryOrderPredictionDetail[]> {
        return this.service.factoryOrderPredictionsDetail$;
    }
    get factoryOrderPredictions$(): Observable<FactoryOrderPrediction[]> {
        return this.service.factoryOrderPredictions$;
    }
    ngOnInit(): void {
        this.reportType = 1;
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
                if(this.reportType === 1)
                if(!this.factoryOrderPredictions)
                    return
                else 
                    if(!this.factoryOrderPredictionsDetails)
                    return;

                if(this.reportType === 1)
                    this.factoryOrderPredictions$.pipe(map(items => items.filter(x =>
                       x.goodsName.toLocaleLowerCase().includes(this.filter.nativeElement.value) ||
                       x.categoryGoodsCode.toLocaleLowerCase().includes(this.filter.nativeElement.value) ||
                       x.requiredInventory.toString().includes(this.filter.nativeElement.value) ||
                       x.totalAvailableInventory.toString().includes(this.filter.nativeElement.value) ||
                       x.totalRequiredInventory.toString().includes(this.filter.nativeElement.value) ||
                       x.measurementMetricName.toLocaleLowerCase().includes(this.filter.nativeElement.value) ||
                       x.unitName.toLocaleLowerCase().includes(this.filter.nativeElement.value)))).subscribe(elements => {
                        this.factoryOrderPredictions = elements as FactoryOrderPrediction[];
                        this._changeDetectorRef.markForCheck();
                        this.cdr.detectChanges();
                       });
                else
                    this.factoryOrderPredicyionsDetails$.pipe(map(items => items.filter(x =>
                        x.goodsName.toLocaleLowerCase().includes(this.filter.nativeElement.value) ||
                        x.categoryGoodsCode.toLocaleLowerCase().includes(this.filter.nativeElement.value) ||
                        x.parentCode.toLocaleLowerCase().includes(this.filter.nativeElement.value) ||
                        x.parentName.toLocaleLowerCase().includes(this.filter.nativeElement.value) ||
                        x.parentTypeName.toLocaleLowerCase().includes(this.filter.nativeElement.value) ||
                        x.brandName.toLocaleLowerCase().includes(this.filter.nativeElement.value) ||
                        x.productName.toLocaleLowerCase().includes(this.filter.nativeElement.value) ||
                        x.parentTypeName.toLocaleLowerCase().includes(this.filter.nativeElement.value) ||
                        x.parentUsageMeasure.toString().includes(this.filter.nativeElement.value) ||
                        x.usageMeasureInParent.toString().includes(this.filter.nativeElement.value) ||
                        x.measure.toString().includes(this.filter.nativeElement.value)))).subscribe(elements => {
                            this.factoryOrderPredictionsDetails = elements as FactoryOrderPredictionDetail[];
                            this._changeDetectorRef.markForCheck();
                            this.cdr.detectChanges();
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
                    if (this.reportType === 1) {
                        this.factoryOrderPredictionInfo.page = this.pagination;
                        return this.service.getFactoryOrderPredictions(this.factoryOrderPredictionInfo);
                    }
                    else {
                        this.factoryOrderPredictionDetailInfo.page = this.pagination;
                        return this.service.getFactoryOrderPredictionsDetails(this.factoryOrderPredictionDetailInfo);
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
        this.service.disposeFactoryOrderPredictions$();
        this.service.disponsePaginator$();

    }
    private setForkJoinValues(values: Array<any>): void {
        this.frmAdvancedSearch.controls["reportType"].setValue(1);
        this.statuses = values[0].data;
        this.defaultStatuses = [];
        this.statuses.forEach(element => {
            if (element.isDefault === 1)
                this.defaultStatuses.push(element.statusId);
        });
        this.frmAdvancedSearch.controls["status"].setValue(this.defaultStatuses);
        this.factoryOrderPredictionInfo.statusIdList = this.defaultStatuses;
        this.levels = values[1].data;
        this.factoryOrderPredictions = values[2].data.factoryOrderPredictions;
        this.factoryOrderPredictionInfo.page = this.pagination;
        this.service.factoryOrderPredictions$.forEach(items => {
            this.filteredItemsCount = items.length;
        });
        this.changeReportType({
            isUserInput: true,
            source: { value: 1, selected: true }
        });
        this.setPaginatorAndSort();
    }
    private loadData(): void {
        forkJoin(
            this.getStatuses(),
            this.getLevels(),
            this.getFactoryOrderPredictionsOnInit(),
        ).subscribe(res => {
            this.setForkJoinValues(res);
            this.isLoading = false;
            this._changeDetectorRef.markForCheck();
            this.cdr.detectChanges();
        });
    }

    private getStatuses(): Observable<any> {
        return this.service.getStatuses();
    }

    private getLevels(): Observable<any> {
        return this.service.getLevels();
    }



    setStatusValue(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            if (event.source.value != 0 && event.source.selected) {
                this.factoryOrderPredictionInfo.statusIdList.push(event.source.value);

            }
            else if (event.source.value != 0 && !event.source.selected) {
                const index: number = this.factoryOrderPredictionInfo.statusIdList.indexOf(event.source.value);
                if (index !== -1)
                    this.factoryOrderPredictionInfo.statusIdList.splice(index, 1);
                this.frmAdvancedSearch.controls["status"].setValue(this.factoryOrderPredictionInfo.statusIdList);
            }
        }
    }

    setLevelValue(event: {
        isUserInput : any;
        source : { value : any ; selected : any };
    }){
        if(event.isUserInput){
            if(event.source.value != 0 && event.source.selected){
                this.factoryOrderPredictionInfo.levelNumberList.push(event.source.value);
            }
            else if(event.source.value !=0 && !event.source.selected){
                const index : number = this.factoryOrderPredictionInfo.levelNumberList.indexOf(event.source.value);
                if(index !== -1)
                    this.factoryOrderPredictionInfo.levelNumberList.splice(index , 1);
                this.frmAdvancedSearch.controls["level"].setValue(this.factoryOrderPredictionInfo.levelNumberList)
            }
        }
    }

    private getFactoryOrderPredictionsDetails(factoryOrderPredictionDetailInfo: FactoryOrderPredictionDetail) {
        this.isLoading = true;
        this.service.getFactoryOrderPredictionsDetails(factoryOrderPredictionDetailInfo)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((factoryOrderPredictionsDetails: any) => {
                this.reportType = this.frmAdvancedSearch.controls['reportType'].value;
                this.factoryOrderPredictions = [];
                this.factoryOrderPredictionsDetails = factoryOrderPredictionsDetails.data.factoryOrderPredictionDetails;
                this.factoryOrderPredictionDetailInfo.page = this.pagination;
                this.isLoading = false;
                this._changeDetectorRef.markForCheck();
                this.cdr.detectChanges();
                this.setPaginatorAndSort();
            });
    }

    private getFactoryOrderPredictions(factoryOrderPredictionInfo: FactoryOrderPrediction) {
        this.isLoading = true;
        this.service.getFactoryOrderPredictions(factoryOrderPredictionInfo)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((factoryOrderPredictions: any) => {
                this.reportType = this.frmAdvancedSearch.controls['reportType'].value;
                this.factoryOrderPredictionsDetails = [];
                this.factoryOrderPredictions = factoryOrderPredictions.data.factoryOrderPredictions;
                this.factoryOrderPredictionInfo.page = this.pagination;
                this.isLoading = false;
                this._changeDetectorRef.markForCheck();
                this.cdr.detectChanges();
                this.setPaginatorAndSort();
            });
    }

    private getFactoryOrderPredictionsOnInit(): Observable<any> {
        this.pagination = new Paging();
        this.pagination.flag = true;
        this.pagination.length = 0;
        this.pagination.order = 'desc';
        this.pagination.pageNumber = 1;
        this.pagination.pageSize = 100;
        this.pagination.sort = '';
        this.factoryOrderPredictionInfo.page = this.pagination;
        return this.service.getFactoryOrderPredictionsOnInit(this.factoryOrderPredictionInfo);
    }
    public financialDocumentSearch() {

        this.pagination.flag = true;
        this.pagination.pageNumber = 1;
        this.pagination.length = 0;
        this.pagination.flag = true;
        this.pagination.pageNumber = 1;
        this.pagination.length = 0;
        this.pagination.sort = '';
        this.pagination.order = 'asc';
        if (this.frmAdvancedSearch.controls['reportType'].value === 1) {
            this.factoryOrderPredictionInfo.levelNumberList = this.frmAdvancedSearch.controls["level"].value;
            this.factoryOrderPredictionInfo.categoryGoodsCode = this.frmAdvancedSearch.controls["goodsCode"].value;
            this.factoryOrderPredictionInfo.goodsName = this.frmAdvancedSearch.controls["goodsName"].value;
            this.factoryOrderPredictionInfo.requiredInventory = this.frmAdvancedSearch.controls["required"].value;
            this.factoryOrderPredictionInfo.totalAvailableInventory = this.frmAdvancedSearch.controls["available"].value;
            this.factoryOrderPredictionInfo.totalRequiredInventory = this.frmAdvancedSearch.controls["total"].value;
            this.factoryOrderPredictionInfo.page = this.pagination;
            this.getFactoryOrderPredictions(this.factoryOrderPredictionInfo);
        }
        else {
            this.factoryOrderPredictionDetailInfo.goodsName = this.frmAdvancedSearch.controls["goodsName"].value;
            this.factoryOrderPredictionDetailInfo.categoryGoodsCode = this.frmAdvancedSearch.controls["goodsCode"].value;
            this.factoryOrderPredictionDetailInfo.levelNumberList = this.frmAdvancedSearch.controls["level"].value;
            this.factoryOrderPredictionDetailInfo.page = this.pagination;
            this.getFactoryOrderPredictionsDetails(this.factoryOrderPredictionDetailInfo);
        }

    }

    changeReportType(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            if (event.source.value === 2) {
                this.frmAdvancedSearch.controls['required'].disable();
                this.frmAdvancedSearch.controls['available'].disable();
                this.frmAdvancedSearch.controls['total'].disable();
            }
            else {
                this.factoryOrderPredictionInfo.statusIdList = [];
                this.factoryOrderPredictionInfo.levelNumberList = [];
                this.frmAdvancedSearch.controls['required'].enable();
                this.frmAdvancedSearch.controls['available'].enable();
                this.frmAdvancedSearch.controls['total'].enable();
            }
        }



    }

    create(){
        if(this.reportType === 1){
            this.getFactoryOrderPredictions(this.factoryOrderPredictionInfo);
        }else{
            this.getFactoryOrderPredictionsDetails(this.factoryOrderPredictionDetailInfo);
        }
    }


    downloadPdfFile(factoryOrderPredictions: Observable<FactoryOrderPrediction[]>, factoryOrderPredictionsDetails: Observable<FactoryOrderPredictionDetail[]>) {
        var pdf = new jsPDF('l');
        pdf.setFontSize(20);
        pdf.text('FactoryOrderPrediction', 14, 8);
        pdf.setFontSize(12);
        pdf.setTextColor(99);
        let header = [];
        let tableData = [];
        let footer = [];
        let qty: number = 0;
        let date = formatDate(new Date(), 'yyyyMMdd_hhmmss', 'en');
        let fileName: string = 'factoryOrderPrediction_'.concat(date.concat('.pdf'));
        if(this.reportType === 1)
                header = [{ header: "Code" },
                // { header: "Name" },
                { header: "Required" },
                { header: "Available" },
                { header: "Total Required" },
                { header: "Measurement Metric" },
                { header: "Unit" },
                { header: "Status" }];
        else
            header = [{ header: "Code" },
                { header: "Name" },
                { header: "Parent Usage" },
                { header: "Usage" },
                { header: "Total Usage" },
                { header: "Measurement Metric" },
                { header: "Level" }];
        
        if(this.reportType === 1)
                factoryOrderPredictions.subscribe(items => items.forEach(element => {
                    qty = qty + 1;
                    tableData.push([
                        element.categoryGoodsCode, element.requiredInventory,
                        this.transformDecimal(element.totalAvailableInventory), this.transformDecimal(element.totalRequiredInventory),
                        element.measurementMetricName, element.unitName, element.statusDescription
                    ])
                }))
        else
                factoryOrderPredictionsDetails.subscribe(items => items.forEach(element => {
                    qty = qty + 1;
                    tableData.push([
                        element.categoryGoodsCode, element.goodsName,
                        this.transformDecimal(element.parentUsageMeasure), this.transformDecimal(element.usageMeasureInParent),
                        element.measure, element.measurementMetricName , element.levelDesc
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

    async download() {
        if (this.reportType == 1) {
            this.isLoading = true;
            const data = await this.service.getFactoryOrderPredictionForDownloadingFile(this.factoryOrderPredictionInfo);
            this.isLoading = false;
            this.downloadPdfFile(of(data), null);
            this._changeDetectorRef.markForCheck();
            this.cdr.detectChanges();
        }
        else if (this.reportType == 2) {
            this.isLoading = true;
            const data = await this.service.getFactoryOrderPredictionDetailsForDownloadingFile(this.factoryOrderPredictionDetailInfo);
            this.isLoading = false;
            this.downloadPdfFile(null, of(data));
            this._changeDetectorRef.markForCheck();
            this.cdr.detectChanges();
        }
    }

    private downloadExcelFile(factoryOrderPrediction : Observable<FactoryOrderPrediction[]> , factoryOrderPredictionDetail : Observable<FactoryOrderPredictionDetail[]>){
        let columns : Array<ExcelHeader> = new Array<ExcelHeader>();
        let obj : Array<FactoryOrderPrediction> = new Array<FactoryOrderPrediction>();
        let detailObj : Array<FactoryOrderPredictionDetail> = new Array<FactoryOrderPredictionDetail>();
        let qty : number = 0;
        let date = formatDate(new Date() , 'yyyyMMdd_hhmmss' , 'en');
        let fileName : string = 'FactoryOrderPrediction_'.concat(date.toString());
        if (this.reportType === 1) {
            columns.push({ basedColumnName: 'categoryGoodsCode', excelColumnName: 'Code' });
            columns.push({ basedColumnName: 'goodsName', excelColumnName: 'Name' });
            columns.push({ basedColumnName: 'requiredInventory', excelColumnName: 'Required' });
            columns.push({ basedColumnName: 'totalAvailableInventory', excelColumnName: 'Available' });
            columns.push({ basedColumnName: 'totalRequiredInventory', excelColumnName: 'Total' });
            columns.push({ basedColumnName: 'measurementMetricName', excelColumnName: 'Measurement Metric' });
            columns.push({ basedColumnName: 'unitName', excelColumnName: 'Unit' });
            columns.push({ basedColumnName: 'statusDescription', excelColumnName: 'Status' });
        } else {
            columns.push({ basedColumnName: 'categoryGoodsCode', excelColumnName: 'Code' });
            columns.push({ basedColumnName: 'goodsName', excelColumnName: 'Name' });
            columns.push({ basedColumnName: 'productName', excelColumnName: 'Products' });
            columns.push({ basedColumnName: 'brandName', excelColumnName: 'Brand' });
            columns.push({ basedColumnName: 'parentUsageMeasure', excelColumnName: 'Parent Usage' });
            columns.push({ basedColumnName: 'usageMeasureInParent', excelColumnName: 'Usage' });
            columns.push({ basedColumnName: 'measure', excelColumnName: 'Total Usage' });
            columns.push({ basedColumnName: 'measurementMetricName', excelColumnName: 'Measurement' });
            columns.push({ basedColumnName: 'unitName', excelColumnName: 'Unit' });
            columns.push({ basedColumnName: 'levelDesc', excelColumnName: 'Level' });
        }

        if (this.reportType === 1) 
            factoryOrderPrediction.subscribe(item => item.forEach(element =>{
                qty = qty + 1;
                obj.push(element)
            }));
        else
            factoryOrderPredictionDetail.subscribe(item => item.forEach(element =>{
                qty = qty + 1;
                detailObj.push(element)
            }));

        let footerData = [];
        if (this.reportType === 1) {
            footerData.push(['', '', '', '', '' ,'' , 'QTY :' , qty]);
        } else {
            footerData.push(['', '', '', '', '' ,'' , '', '' , 'QTY :' , qty]);
        }
        
        if (this.reportType === 1)
            this._excelService.exportAsExcelFile('Factory Order Prediction' , '', columns , obj , footerData , fileName , 'Sheet1');
        else
            this._excelService.exportAsExcelFile('Factory Order Prediction Details' , '', columns , detailObj , footerData , fileName , 'Sheet1');

        obj = [];
        detailObj = [];
    }

    async exportAllTable() {
        if (this.reportType == 1) {
            this.isLoading = true;
            const data = await this.service.getFactoryOrderPredictionForDownloadingFile(this.factoryOrderPredictionInfo);
            this.isLoading = false;
            this.downloadExcelFile(of(data), null);
            this._changeDetectorRef.markForCheck();
            this.cdr.detectChanges();
        }
        else if (this.reportType == 2) {
            this.isLoading = true;
            const data = await this.service.getFactoryOrderPredictionDetailsForDownloadingFile(this.factoryOrderPredictionDetailInfo);
            this.isLoading = false;
            this.downloadExcelFile(null, of(data));
            this._changeDetectorRef.markForCheck();
            this.cdr.detectChanges();
        }

    }

    exportCurrentTable() {
        let columns: Array<ExcelHeader> = new Array<ExcelHeader>();
        let obj: Array<FactoryOrderPrediction> = new Array<FactoryOrderPrediction>();
        let detailObj : Array<FactoryOrderPredictionDetail> = new Array<FactoryOrderPredictionDetail>();
        let qty: number = 0;
        let date = formatDate(new Date(), 'yyyyMMdd_hhmmss', 'en');
        let fileName: string = 'factoryOrderPrediction_'.concat(date.toString());
        if (this.reportType === 1) {
            columns.push({ basedColumnName: 'categoryGoodsCode', excelColumnName: 'Code' });
            columns.push({ basedColumnName: 'goodsName', excelColumnName: 'Name' });
            columns.push({ basedColumnName: 'requiredInventory', excelColumnName: 'Required' });
            columns.push({ basedColumnName: 'totalAvailableInventory', excelColumnName: 'Available' });
            columns.push({ basedColumnName: 'totalRequiredInventory', excelColumnName: 'Total' });
            columns.push({ basedColumnName: 'measurementMetricName', excelColumnName: 'Measurement Metric' });
            columns.push({ basedColumnName: 'unitName', excelColumnName: 'Unit' });
            columns.push({ basedColumnName: 'statusDescription', excelColumnName: 'Status' });
        } else {
            columns.push({ basedColumnName: 'categoryGoodsCode', excelColumnName: 'Code' });
            columns.push({ basedColumnName: 'goodsName', excelColumnName: 'Name' });
            columns.push({ basedColumnName: 'productName', excelColumnName: 'Products' });
            columns.push({ basedColumnName: 'brandName', excelColumnName: 'Brand' });
            columns.push({ basedColumnName: 'parentUsageMeasure', excelColumnName: 'Parent Usage' });
            columns.push({ basedColumnName: 'usageMeasureInParent', excelColumnName: 'Usage' });
            columns.push({ basedColumnName: 'measure', excelColumnName: 'Total Usage' });
            columns.push({ basedColumnName: 'measurementMetricName', excelColumnName: 'Measurement' });
            columns.push({ basedColumnName: 'unitName', excelColumnName: 'Unit' });
            columns.push({ basedColumnName: 'levelDesc', excelColumnName: 'Level' });
        }
        if (this.reportType === 1) 
            this.factoryOrderPredictions$.subscribe(item => item.forEach(element =>{
                qty = qty + 1;
                obj.push(element)
            }));
        else
            this.factoryOrderPredicyionsDetails$.subscribe(item => item.forEach(element =>{
                qty = qty + 1;
                detailObj.push(element)
            }));


        let footerData = [];
        if (this.reportType === 1) {
            footerData.push(['', '', '', '', '' ,'' ,  'QTY :' , qty]);
        } else {
            footerData.push(['', '', '', '', '' ,'' , '', '' , 'QTY :' , qty]);
        }

        if (this.reportType === 1)
            this._excelService.exportAsExcelFile('Factory Order Prediction' , '', columns , obj , footerData , fileName , 'Sheet1');
        else
            this._excelService.exportAsExcelFile('Factory Order Prediction Details' , '', columns , detailObj , footerData , fileName , 'Sheet1');

        obj = [];
        detailObj = [];
    }


    public resetAdvancedSearch() {
        this.frmAdvancedSearch.controls["reportType"].setValue(1);
        this.frmAdvancedSearch.controls["status"].setValue(this.defaultStatuses);
        this.frmAdvancedSearch.controls["level"].setValue(null);
        this.frmAdvancedSearch.controls["goodsCode"].setValue("");
        this.frmAdvancedSearch.controls["goodsName"].setValue("");
        this.frmAdvancedSearch.controls["required"].setValue(null);
        this.frmAdvancedSearch.controls["available"].setValue(null);
        this.frmAdvancedSearch.controls["total"].setValue(null);

    }

    handlePageEvent(event: PageEvent) {

        this.pagination.length = event.length;
        this.pagination.pageSize = event.pageSize;
        this.pagination.pageNumber = event.pageIndex + 1;
        this.pagination.flag = false;
        this.factoryOrderPredictionInfo.page = this.pagination;
        this.getFactoryOrderPredictions(this.factoryOrderPredictionInfo)
    }
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }


   
    transformDecimal(num) {
        return num == 0 ? 0 : this._decimalPipe.transform(num, '1.0-5');
    }

}




