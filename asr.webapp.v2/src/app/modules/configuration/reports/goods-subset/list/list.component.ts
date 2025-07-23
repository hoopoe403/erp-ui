import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Subject, merge, Observable, forkJoin, fromEvent, of, async, } from 'rxjs';
import { debounceTime, switchMap, map, distinctUntilChanged } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';
import { fuseAnimations } from "../../../../../../@fuse/animations";
import { HierarchicalKeyValue, Measure } from 'app/core/type/key-value/key-value.type';
import { GoodsSubsetService } from "../goods-subset.service";
import { GoodsSubset } from "../goods-subset.types";
import { Paging } from 'app/core/type/paging/paging.type';
import { FormControl, FormGroup } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
import jsPDF from 'jspdf';
import { DecimalPipe, formatDate, KeyValue } from '@angular/common';
import { ExcelHeader } from 'app/shared/excel/excel.types';
import { ExcelService } from 'app/shared/excel/excel.service';

@Component({
    selector: 'goods-subset-list',
    templateUrl: './list.component.html',
    styles: [
        /* language=SCSS */
        `
            .goods-subset-grid {
                grid-template-columns: 330px  75px auto  75px 75px 150px 100px 130px;

                @screen sm {
                    grid-template-columns:auto 100px 100px 100px 150px;
                }

                @screen md {
                    grid-template-columns:auto 100px 100px 100px 150px;
                }

                @screen lg {
                    grid-template-columns: 330px  75px auto  75px 75px 150px 100px 130px;
                }
                @screen print{
                    grid-template-columns: 90px auto  130px 130px  100px 100px 130px  130px ;
                }
            }
     
        `
    ],
    animations: fuseAnimations,
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GoodsSubsetListComponent implements OnInit, OnDestroy {
    protected _onDestroy = new Subject<void>();
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;
    allCoversSelected = false;
    selectedCat: number = 0;
    drpCover: any = [];
    selectedCover: any = [];
    goodsCatArray: any = [];
    goodsTypes: any = [];
    units: any = [];
    services: any = [];
    conformities: any = [];
    showGoodsProgressBar: boolean;
    pagination: Paging;
    goodsSubsetInfo: GoodsSubset;
    brands: Array<{ key: number, value: string }> = [];
    frmAdvancedSearch = new FormGroup({
        brand: new FormControl(),
        goodsCode: new FormControl(),
        goodsName: new FormControl(),
        technicalNumber: new FormControl(),
        goodsService: new FormControl([]),
        subsetCode: new FormControl(),
        subsetName: new FormControl(),
        subsetTechnicalNumber: new FormControl(),
        subsetService: new FormControl([]),
        measureFrom: new FormControl(),
        measureTo: new FormControl(),
        unit: new FormControl([]),
    });


    searchInputControl: FormControl = new FormControl();

    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
    @ViewChild('filter', { static: true }) filter: ElementRef;

    // Private
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    isLoading: boolean;

    constructor(private service: GoodsSubsetService,
        private excelService: ExcelService,
        private cdr: ChangeDetectorRef,
        private _decimalPipe: DecimalPipe,
        private _changeDetectorRef: ChangeDetectorRef) {
        this.goodsSubsetInfo = new GoodsSubset();
        this.goodsSubsetInfo.unitIdList = [];
        this.goodsSubsetInfo.goodsServiceIdList = [];
        this.goodsSubsetInfo.subsetServiceIdList = [];
        this.goodsSubsetInfo.goodsServiceNameList = [];
        this.goodsSubsetInfo.subsetServiceNameList = [];

    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------
    isOverlayOpen: boolean = true;

    /**
     * On init
     */




    goodsSubset$: Observable<GoodsSubset[]>;
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

        this.initialPagination();
        fromEvent(this.filter.nativeElement, 'keyup')
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(150),
                distinctUntilChanged()
            )
            .subscribe(() => {

                if (!this.goodsSubset$)
                    return;
                let value: string = this.filter.nativeElement.value.toLowerCase();
                this.service.goodsSubset$.pipe(map(items => items.filter(x =>
                    x.goodsName.toLowerCase().includes(value) ||
                    x.goodsCode.toLowerCase().includes(value) ||
                    x.goodsCategoryName.toLowerCase().includes(value) ||
                    x.technicalNumber.toLowerCase().includes(value) ||
                    x.subsetCode.toLowerCase().includes(value) ||
                    x.subsetName.toLowerCase().includes(value) ||
                    x.subsetCategoryName.toLowerCase().includes(value) ||
                    x.subsetTechnicalNumber.toLowerCase().includes(value) ||
                    x.goodsServices?.toLowerCase().includes(value) ||
                    x.measure.toString().includes(value) ||
                    x.subsetServices?.toString().includes(value) ||
                    x.unitName?.toLowerCase().includes(value)))).subscribe(elements => {
                        this.goodsSubset$ = of(elements as GoodsSubset[]);
                        this._changeDetectorRef.markForCheck();
                        this._changeDetectorRef.detectChanges();
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

            // Get goodss if sort or page changes
            merge(this._sort.sortChange, this._paginator.page).pipe(
                switchMap(() => {
                    this.isLoading = true;
                    this.pagination.length = this._paginator.length;
                    this.pagination.pageSize = this._paginator.pageSize;
                    this.pagination.pageNumber = this._paginator.pageIndex + 1;
                    this.pagination.flag = false;
                    this.pagination.order = this._sort.direction == null ? 'desc' : this._sort.direction;
                    this.pagination.sort = this._sort.active == null ? '' : this._sort.active;
                    this.goodsSubsetInfo.page = this.pagination;
                    return this.service.getGoodsSubset(this.goodsSubsetInfo);
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
        this.service.disposeGoodsSubset$();
        this.service.disponsePaginator$();

    }
    private setForkJoinValues(values: Array<any>): void {
        this.units = values[1].data;
        this.services = values[2].data;
        this.goodsSubsetInfo.page = this.pagination;
        this._changeDetectorRef.markForCheck();
        this.cdr.detectChanges();
        this.goodsSubset$ = this.service.goodsSubset$;
        this._changeDetectorRef.markForCheck();
        this.cdr.detectChanges();
        this.setPaginatorAndSort();
        this.addSelectanItemToCatMenu();

    }
    private loadData(): void {
        forkJoin(
            this.getGoodsSubsetOnInit(),
            this.getDrpUnit(),
            this.getDrpService(),

        ).subscribe(res => {
            this.setForkJoinValues(res);
            this.isLoading = false;
            this.cdr.detectChanges();
        });
    }


    private getDrpUnit(): Observable<any> {
        return this.service.getDrpUnits();
    }
    private getDrpService(): Observable<any> {
        return this.service.getDrpGoodsServices();
    }


    private getGoodsCats(): Observable<any> {
        return this.service.getGoodsCats();
    }

    private resetGoodsCatBotton() {
        let obj = new HierarchicalKeyValue();
        obj.id = this.goodsCatArray[0].id;
        obj.item = this.goodsCatArray[0].item;
        obj.parentId = this.goodsCatArray[0].parentId;
        obj.children = [];
        for (var i = 0; i < this.goodsCatArray[0].children.length; i++) {
            obj.children.push(this.goodsCatArray[0].children[i]);
        }
        this.goodsCatArray = [];
        this.goodsCatArray.push(obj);
    }



    private addSelectanItemToCatMenu() {
        let obj = new HierarchicalKeyValue();
        obj.id = 0;
        obj.item = "All Categories";
        obj.parentId = -1;
        obj.children = [];
        for (var i = 0; i < this.goodsCatArray.length; i++) {
            obj.children.push(this.goodsCatArray[i]);
        }
        this.goodsCatArray = [];
        this.goodsCatArray.push(obj);
    }




    public setSelectedCat(selectedId: number) {
        this.selectedCat = selectedId;
        if (selectedId > 0) {
            this.trigger.closeMenu();
        }
    }


    private getGoodsSubset(goodsSubsetInfo: GoodsSubset) {
        this.isLoading = true;
        this.service.getGoodsSubset(goodsSubsetInfo)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((financialDocumentsDetails: any) => {
                this.goodsSubset$ = this.service.goodsSubset$;
                this.goodsSubsetInfo.page = this.pagination;
                this.isLoading = false;
                this._changeDetectorRef.markForCheck();
                this.cdr.detectChanges();
            });
    }

    private getGoodsSubsetOnInit(): Observable<any> {
        this.pagination = new Paging();
        this.pagination.flag = true;
        this.pagination.length = 0;
        this.pagination.order = 'asc';
        this.pagination.pageNumber = 1;
        this.pagination.pageSize = 100;
        this.pagination.sort = '';
        this.goodsSubsetInfo.page = this.pagination;
        return this.service.getGoodsSubset(this.goodsSubsetInfo);
    }


    public search() {

        this.pagination.flag = true;
        this.pagination.pageNumber = 1;
        this.pagination.length = 0;
        // this.goodsSubsetInfo.goodsCategoryId = this.selectedCat;
        this.goodsSubsetInfo.goodsCode = this.frmAdvancedSearch.controls['goodsCode'].value;
        this.goodsSubsetInfo.goodsName = this.frmAdvancedSearch.controls['goodsName'].value;
        this.goodsSubsetInfo.technicalNumber = this.frmAdvancedSearch.controls['technicalNumber'].value;
        this.goodsSubsetInfo.subsetCode = this.frmAdvancedSearch.controls['subsetCode'].value;
        this.goodsSubsetInfo.subsetName = this.frmAdvancedSearch.controls['subsetName'].value;
        this.goodsSubsetInfo.subsetTechnicalNumber = this.frmAdvancedSearch.controls['subsetTechnicalNumber'].value;
        this.goodsSubsetInfo.measureFrom = this.frmAdvancedSearch.controls['measureFrom'].value;
        this.goodsSubsetInfo.measureTo = this.frmAdvancedSearch.controls['measureTo'].value;
        this.goodsSubsetInfo.goodsServiceNameList = [];
        this.goodsSubsetInfo.goodsServiceIdList.forEach(element => {
            const indx = this.services.findIndex(x => x.key == element);
            this.goodsSubsetInfo.goodsServiceNameList.push('%' + this.services[indx].value + '%');
        });
        this.goodsSubsetInfo.subsetServiceNameList = [];
        this.goodsSubsetInfo.subsetServiceIdList.forEach(element => {
            const indx = this.services.findIndex(x => x.key == element);
            this.goodsSubsetInfo.subsetServiceNameList.push('%' + this.services[indx].value + '%');
        });
        this.goodsSubsetInfo.page = this.pagination;
        this.getGoodsSubset(this.goodsSubsetInfo);


    }

    download() {
        var pdf = new jsPDF('l');
        pdf.setFontSize(20);
        pdf.text('Goods Subset', 14, 8);
        pdf.setFontSize(12);
        pdf.setTextColor(99);
        let header = [];
        let tableData = [];
        let footer = [];
        let qty: number = 0;
        let measure: number = 0;
        let date = formatDate(new Date(), 'yyyyMMdd_hhmmss', 'en');
        let fileName: string = 'GoodsSubset_'.concat(date.concat('.pdf'));


        header = [{ header: 'Name', dataKey: 'goodsName' },
        { header: 'Code', dataKey: 'goodsCode' },
        { header: 'Subset Code', dataKey: 'subsetCode' },
        { header: 'Subset Name', dataKey: 'subsetName' },
        { header: 'Measure', dataKey: 'measure' },
        { header: 'Unit', dataKey: 'unitName' },
        { header: 'MME', dataKey: 'measurementElementName' }];


        this.goodsSubset$.subscribe(items => items.forEach(element => {
            qty = qty + 1;
            measure = measure + element.measure;
            tableData.push([
                element.goodsName, element.goodsCode, element.subsetCode, element.subsetName, this.transformDecimal(element.measure), element.unitName
                , element.measurementElementName
            ])
        }))


        footer = [['QTY', '', '', '', '', '', qty],
        ['Measure', '', '', '', '', '', this.transformDecimal(measure).toString().concat(' IRR')]];


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

    private downloadExcelFile(goodsSubsets: Observable<GoodsSubset[]>) {
        let columns: Array<ExcelHeader> = new Array<ExcelHeader>();
        let obj: Array<GoodsSubset> = new Array<GoodsSubset>();
        let qty: number = 0;
        let measure: number = 0;
        let date = formatDate(new Date(), 'yyyyMMdd_hhmmss', 'en');
        let fileName: string = 'GoodsSubset_'.concat(date.toString());

        columns.push({ basedColumnName: 'goodsName', excelColumnName: 'Goods' });
        columns.push({ basedColumnName: 'goodsCode', excelColumnName: 'Code' });
        columns.push({ basedColumnName: 'goodsCategoryName', excelColumnName: 'Goods Category' });
        columns.push({ basedColumnName: 'technicalNumber', excelColumnName: 'Technical Number' });
        columns.push({ basedColumnName: 'subsetName', excelColumnName: 'Subset Name' });
        columns.push({ basedColumnName: 'subsetCode', excelColumnName: 'Subset Code' });
        columns.push({ basedColumnName: 'subsetCategoryName', excelColumnName: 'Subset Category' });
        columns.push({ basedColumnName: 'subsetTechnicalNumber', excelColumnName: 'Subset Technical Number' });
        columns.push({ basedColumnName: 'measure', excelColumnName: 'Measure' });
        columns.push({ basedColumnName: 'unitName', excelColumnName: 'Unit' });
        columns.push({ basedColumnName: 'measurementElementName', excelColumnName: 'Measurement Element' });
        columns.push({ basedColumnName: 'goodsServices', excelColumnName: 'Goods Services' });
        columns.push({ basedColumnName: 'subsetServices', excelColumnName: 'Subset Services' });

        goodsSubsets.subscribe(items => items.forEach(element => {
            qty = qty + 1;
            measure = measure + element.measure;
            obj.push(element)
        }));


        let footerData = [];
        footerData.push(['', '', '', '', '', '', '', '', '', '', '', '', 'QTY', qty]);
        footerData.push(['', '', '', '', '', '', '', '', '', '', '', '', 'Measure', measure]);


        this.excelService.exportAsExcelFile('Goods Subset', '', columns, obj, footerData, fileName, 'Sheet1');



        obj = [];
    }

    async exportTable() {
        this.isLoading = true;
        const data = await this.service.getGoodsSubsetForDownloadingFile(this.goodsSubsetInfo);
        this.isLoading = false;
        this.downloadExcelFile(of(data));
        this._changeDetectorRef.markForCheck();
        this.cdr.detectChanges();
    }


    public resetAdvancedSearch() {
        this.frmAdvancedSearch.controls["goodsCode"].setValue(null);
        this.frmAdvancedSearch.controls["goodsName"].setValue(null);
        this.frmAdvancedSearch.controls["technicalNumber"].setValue(null);
        this.frmAdvancedSearch.controls["subsetCode"].setValue(null);
        this.frmAdvancedSearch.controls["subsetName"].setValue(null);
        this.frmAdvancedSearch.controls["subsetName"].setValue(null);
        this.frmAdvancedSearch.controls["subsetTechnicalNumber"].setValue(null);
        this.frmAdvancedSearch.controls["goodsService"].setValue([]);
        this.goodsSubsetInfo.goodsServiceIdList = [];
        this.frmAdvancedSearch.controls["subsetService"].setValue([]);
        this.goodsSubsetInfo.subsetServiceIdList = [];
        this.frmAdvancedSearch.controls["unit"].setValue([]);
        this.goodsSubsetInfo.unitIdList = [];
        this.frmAdvancedSearch.controls["measureFrom"].setValue(null);
        this.frmAdvancedSearch.controls["measureTo"].setValue(null);
        this.resetGoodsCatBotton();
    }

    trackByFn(index: number, item: any): any {
        return item.id || index;
    }



    transformDecimal(num) {
        return num == 0 ? 0 : this._decimalPipe.transform(num, '1.0-5');
    }



}




