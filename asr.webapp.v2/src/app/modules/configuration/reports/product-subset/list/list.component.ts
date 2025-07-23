import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Subject, merge, Observable, forkJoin, fromEvent, of, async, } from 'rxjs';
import { debounceTime, switchMap, map, distinctUntilChanged } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';
import { fuseAnimations } from "../../../../../../@fuse/animations";
import { HierarchicalKeyValue, Measure } from 'app/core/type/key-value/key-value.type';
import { ProductSubsetService } from "../product-subset.service";
import { ProductSubset } from "../product-subset.types";
import { Paging } from 'app/core/type/paging/paging.type';
import { FormControl, FormGroup } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
import jsPDF from 'jspdf';
import { DecimalPipe, formatDate, KeyValue } from '@angular/common';
import { ExcelHeader } from 'app/shared/excel/excel.types';
import { ExcelService } from 'app/shared/excel/excel.service';

@Component({
    selector: 'product-subset-list',
    templateUrl: './list.component.html',
    styles: [
        /* language=SCSS */
        `
            .product-subset-grid {
                grid-template-columns: auto  450px 100px  80px 100px 130px 150px;

                @screen sm {
                    grid-template-columns:auto 100px 100px 100px 150px;
                }

                @screen md {
                    grid-template-columns:auto 100px 100px 100px 150px;
                }

                @screen lg {
                    grid-template-columns: auto  450px 100px  80px 100px 130px 150px;
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
export class ProductSubsetListComponent implements OnInit, OnDestroy {
    protected _onDestroy = new Subject<void>();
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;
    allCoversSelected = false;
    selectedCat: number = 0;
    drpCover: any = [];
    selectedCover: any = [];
    goodsCatArray: any = [];
    productTypes: any = [];
    units: any = [];
    services: any = [];
    conformities: any = [];
    showGoodsProgressBar: boolean;
    pagination: Paging;
    productSubsetInfo: ProductSubset;
    brands: Array<{ key: number, value: string }> = [];
    frmAdvancedSearch = new FormGroup({
        brand: new FormControl(),
        productCode: new FormControl(),
        productName: new FormControl(),
        goodsCode: new FormControl(),
        goodsName: new FormControl(),
        goodsTechnicalNumber: new FormControl(),
        productType: new FormControl([]),
        unit: new FormControl([]),
        service: new FormControl([]),
        conformity: new FormControl([]),
    });


    searchInputControl: FormControl = new FormControl();

    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
    @ViewChild('filter', { static: true }) filter: ElementRef;

    // Private
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    isLoading: boolean;

    constructor(private service: ProductSubsetService,
        private excelService: ExcelService,
        private cdr: ChangeDetectorRef,
        private _decimalPipe: DecimalPipe,
        private _changeDetectorRef: ChangeDetectorRef) {
        this.productSubsetInfo = new ProductSubset();
        this.productSubsetInfo.productNameList = [];
        this.productSubsetInfo.productCodeList = [];
        this.productSubsetInfo.goodsCodeList = [];
        this.productSubsetInfo.goodsNameList = [];
        this.productSubsetInfo.goodsCategoryNameList = [];
        this.productSubsetInfo.serviceIdList = [];
        this.productSubsetInfo.measureList = [];
        this.productSubsetInfo.brandIdList = [];
        this.productSubsetInfo.unitIdList = [];
        this.productSubsetInfo.conformityIdList = [];

    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------
    isOverlayOpen: boolean = true;

    /**
     * On init
     */




    productSubset$: Observable<ProductSubset[]>;
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

                if (!this.productSubset$)
                    return;
                let value: string = this.filter.nativeElement.value.toLowerCase();
                this.service.productSubset$.pipe(map(items => items.filter(x =>
                    x.productName.toLowerCase().includes(value) ||
                    x.productCode.toLowerCase().includes(value) ||
                    x.brandName.toLowerCase().includes(value) ||
                    x.goodsCode.toLowerCase().includes(value) ||
                    x.goodsName.toLowerCase().includes(value) ||
                    x.goodsCategoryName.toLowerCase().includes(value) ||
                    x.goodsTechnicalNumber.toLowerCase().includes(value) ||
                    x.measure.toString().includes(value) ||
                    x.conformityName.toString().includes(value) ||
                    x.unitName.toLowerCase().includes(value)))).subscribe(elements => {
                        this.productSubset$ = of(elements as ProductSubset[]);
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
                    this.productSubsetInfo.page = this.pagination;
                    return this.service.getProductSubset(this.productSubsetInfo);
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
        this.service.disposeProductSubset$();
        this.service.disponsePaginator$();

    }
    private setForkJoinValues(values: Array<any>): void {
        this.brands = values[1].data;
        this.productTypes = values[2].data;
        this.units = values[3].data;
        this.services = values[4].data;
        this.conformities = values[5].data;
        this.productSubsetInfo.page = this.pagination;
        this._changeDetectorRef.markForCheck();
        this.cdr.detectChanges();
        this.productSubset$ = this.service.productSubset$;
        this._changeDetectorRef.markForCheck();
        this.cdr.detectChanges();
        this.setPaginatorAndSort();
        this.addSelectanItemToCatMenu();

    }
    private loadData(): void {
        forkJoin(
            this.getProductSubsetOnInit(),
            this.getBrands(),
            this.getDrpProductType(),
            this.getDrpUnit(),
            this.getDrpService(),
            this.getDrpConformity(),

        ).subscribe(res => {
            this.setForkJoinValues(res);
            this.isLoading = false;
            this.cdr.detectChanges();
        });
    }
    private getBrands() {

        return this.service.getDrpBrands();

    }
    private getDrpProductType(): Observable<any> {
        return this.service.getDrpProductType();
    }
    private getDrpUnit(): Observable<any> {
        return this.service.getDrpUnits();
    }
    private getDrpService(): Observable<any> {
        return this.service.getDrpGoodsServices();
    }

    private getDrpConformity(): Observable<any> {
        return this.service.getDrpConformity();
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


    private getProductSubset(productSubsetInfo: ProductSubset) {
        this.isLoading = true;
        this.service.getProductSubset(productSubsetInfo)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((financialDocumentsDetails: any) => {
                this.productSubset$ = this.service.productSubset$;
                this.productSubsetInfo.page = this.pagination;
                this.isLoading = false;
                this._changeDetectorRef.markForCheck();
                this.cdr.detectChanges();
            });
    }

    private getProductSubsetOnInit(): Observable<any> {
        this.pagination = new Paging();
        this.pagination.flag = true;
        this.pagination.length = 0;
        this.pagination.order = 'asc';
        this.pagination.pageNumber = 1;
        this.pagination.pageSize = 100;
        this.pagination.sort = '';
        this.productSubsetInfo.page = this.pagination;
        return this.service.getProductSubset(this.productSubsetInfo);
    }

    findControlsStartingWith(prefix: string): any[] {
        const result: any[] = [];
        Object.keys(this.frmAdvancedSearch.controls).forEach(key => {
            const conorlValue = this.frmAdvancedSearch.controls[key].value;
            if (key.startsWith(prefix) && conorlValue != '' && conorlValue != null) {
                result.push(this.frmAdvancedSearch.controls[key].value);
            }
        });
        return result;
    }
    public search() {

        this.pagination.flag = true;
        this.pagination.pageNumber = 1;
        this.pagination.length = 0;
        // this.productSubsetInfo.goodsCategoryId = this.selectedCat;
        this.productSubsetInfo.goodsCodeList = this.findControlsStartingWith('goodsCode');
        this.productSubsetInfo.goodsNameList = this.findControlsStartingWith('goodsName');
        this.productSubsetInfo.goodsNameList = this.findControlsStartingWith('goodsName');
        this.productSubsetInfo.goodsTechnicalNumber = this.frmAdvancedSearch.controls['goodsTechnicalNumber'].value;
        this.productSubsetInfo.productCodeList = this.findControlsStartingWith('productCode');
        this.productSubsetInfo.productNameList = this.findControlsStartingWith('productName');
        this.productSubsetInfo.goodsServiceNameList = [];
        this.productSubsetInfo.serviceIdList.forEach(element => {
            const indx = this.services.findIndex(x => x.key == element);
            this.productSubsetInfo.goodsServiceNameList.push('%' + this.services[indx].value + '%');
        });
        this.productSubsetInfo.page = this.pagination;
        this.getProductSubset(this.productSubsetInfo);


    }

    setBrandValue(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            if (event.source.value != 0 && event.source.selected) {
                this.productSubsetInfo.brandIdList.push(event.source.value);

            }
            else if (event.source.value != 0 && !event.source.selected) {
                const index: number = this.productSubsetInfo.brandIdList.indexOf(event.source.value);
                if (index !== -1)
                    this.productSubsetInfo.brandIdList.splice(index, 1);
                this.frmAdvancedSearch.controls["brand"].setValue(this.productSubsetInfo.brandIdList);
            }
        }
    }
    download() {
        var pdf = new jsPDF('l');
        pdf.setFontSize(20);
        pdf.text('ProductSubset_', 14, 8);
        pdf.setFontSize(12);
        pdf.setTextColor(99);
        let header = [];
        let tableData = [];
        let footer = [];
        let qty: number = 0;
        let measure: number = 0;
        let date = formatDate(new Date(), 'yyyyMMdd_hhmmss', 'en');
        let fileName: string = 'goodsInventory_'.concat(date.concat('.pdf'));


        header = [{ header: 'Warehouse', dataKey: 'warehouseName' },
        { header: 'Goods', dataKey: 'goodsName' },
        { header: 'Code', dataKey: 'goodsCode' },
        { header: 'Initial Unit Price', dataKey: 'initialUnitPrice' },
        { header: 'Final Unit Price', dataKey: 'finalUnitPrice' },
        { header: 'Initial Stock', dataKey: 'initialStock' },
        { header: 'Final Stock', dataKey: 'finalStock' },
        { header: 'Stock Changes', dataKey: 'stockChanges' },
        { header: 'Total Price', dataKey: 'totalPrice' }];


        this.productSubset$.subscribe(items => items.forEach(element => {
            qty = qty + 1;
            measure = measure + element.measure;
            tableData.push([
                element.productName, element.productCode, element.goodsCode, element.goodsCategoryName, element.goodsName, element.brandName
                , this.transformDecimal(element.measure), element.unitName
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

    private downloadExcelFile(productSubsets: Observable<ProductSubset[]>) {
        let columns: Array<ExcelHeader> = new Array<ExcelHeader>();
        let obj: Array<ProductSubset> = new Array<ProductSubset>();
        let qty: number = 0;
        let measure: number = 0;
        let goodsPrice: number = 0;
        let date = formatDate(new Date(), 'yyyyMMdd_hhmmss', 'en');
        let fileName: string = 'ProductSubset_'.concat(date.toString());

        columns.push({ basedColumnName: 'productName', excelColumnName: 'Product' });
        columns.push({ basedColumnName: 'productCode', excelColumnName: 'Code' });
        columns.push({ basedColumnName: 'brandName', excelColumnName: 'Brand' });
        columns.push({ basedColumnName: 'goodsName', excelColumnName: 'Goods Name' });
        columns.push({ basedColumnName: 'goodsCode', excelColumnName: 'Goods Code' });
        columns.push({ basedColumnName: 'goodsTechnicalNumber', excelColumnName: 'Goods Technical Number' });
        columns.push({ basedColumnName: 'goodsCategoryName', excelColumnName: 'Category' });
        columns.push({ basedColumnName: 'conformityName', excelColumnName: 'Conformity' });
        columns.push({ basedColumnName: 'measure', excelColumnName: 'Measure' });
        columns.push({ basedColumnName: 'unitName', excelColumnName: 'Unit' });
        columns.push({ basedColumnName: 'goodsPrice', excelColumnName: 'Goods Price' });
        columns.push({ basedColumnName: 'goodsServices', excelColumnName: 'Services' });

        productSubsets.subscribe(items => items.forEach(element => {
            qty = qty + 1;
            measure = measure + element.measure;
            goodsPrice = goodsPrice + element.goodsPrice;
            obj.push(element)
        }));


        let footerData = [];
        footerData.push(['', '', '', '', '', '', '', '', '', '', 'QTY', qty]);
        footerData.push(['', '', '', '', '', '', '', '', '', '', 'Measure', measure]);
        footerData.push(['', '', '', '', '', '', '', '', '', '', 'Goods Price', goodsPrice.toString().concat(' IRR')]);


        this.excelService.exportAsExcelFile('Product Subset', '', columns, obj, footerData, fileName, 'Sheet1');



        obj = [];
    }

    async exportTable() {
        this.isLoading = true;
        const data = await this.service.getProductSubsetForDownloadingFile(this.productSubsetInfo);
        this.isLoading = false;
        this.downloadExcelFile(of(data));
        this._changeDetectorRef.markForCheck();
        this.cdr.detectChanges();
    }


    public resetAdvancedSearch() {
        this.frmAdvancedSearch.controls["warehouse"].setValue(null);
        this.frmAdvancedSearch.controls["code"].setValue(null);
        this.frmAdvancedSearch.controls["name"].setValue(null);
        this.frmAdvancedSearch.controls["cover"].setValue(null);
        this.resetGoodsCatBotton();
    }

    trackByFn(index: number, item: any): any {
        return item.id || index;
    }



    transformDecimal(num) {
        return num == 0 ? 0 : this._decimalPipe.transform(num, '1.0-5');
    }



}




