import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation, TemplateRef, ViewContainerRef } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Subject, merge, Observable, forkJoin, fromEvent, of, Subscription, } from 'rxjs';
import { debounceTime, switchMap, map, distinctUntilChanged, filter, take } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';
import { fuseAnimations } from "../../../../../../@fuse/animations";
import { HierarchicalKeyValue } from 'app/core/type/key-value/key-value.type';
import { GoodsInventoryService } from "../goods-inventory.service";
import { GoodsInventory } from "../goods-inventory.types";
import { Paging } from 'app/core/type/paging/paging.type';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
import jsPDF from 'jspdf';
import { DecimalPipe, formatDate } from '@angular/common';
import { ExcelHeader } from 'app/shared/excel/excel.types';
import { ExcelService } from 'app/shared/excel/excel.service';
import { HistoryDialogService } from '../history/dialog.service';
import { Overlay, OverlayRef } from "@angular/cdk/overlay";
import { TemplatePortal } from '@angular/cdk/portal';

@Component({
    selector: 'goods-inventory-list',
    templateUrl: './list.component.html',
    styles: [
        /* language=SCSS */
        `
        .collection {
            padding-left: 0;
            list-style-type: none;
            margin: .5rem 0 1rem 0;
            border: 1px solid #e0e0e0;
            border-radius: 2px;
            overflow: hidden;
            position: relative;
          }
          
          .collection-item {
            background-color: #fff;
            line-height: 1.5rem;
            padding: 10px 20px;
            margin: 0;
            border-bottom: 1px solid #e0e0e0;
            list-style-type: none;
          }
          
          .my-menu {
            background-color: #fff;
            border: 1px solid rosybrown;
            padding: 20px;
          }
          
          
          .user-menu {
            background-color: #fafafa;
            padding: 4pt;
            font-size: 10pt;
            z-index: 1000;
            box-shadow: 0 0 12pt rgba(0, 0, 0, 0.25);
            border-radius: 4pt;
            padding: 0.5em 0 0.5em 0;
            animation: fadeIn 0.1s ease-out;
            opacity:1.0;
            display:block;
          }
          
          
          .user-menu hr {
            border: none;
            border-bottom: 1px solid #eee;
          }
          
          .user-menu div {
            cursor: pointer;
            display: block;
            text-decoration: none;
            color: #333;
            padding: 0.5em 2em 0.5em 0.75em;
            max-width: 18em;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .user-menu div:hover {
            background-color: #f8fafc;
          }
          
          
          .user-menu div::before {
            content: '';
            float: left;
            margin-right: 0.75em;
            width: 0.5em;
            height: 1em;
            display: inline-block;
          }
          
          
          
          /* Animatinons */
          @-webkit-keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1.0;
            }
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1.0;
            }
          }
          
          @-webkit-keyframes fadeOut {
            from {
              opacity: 1.0;
            }
            to {
              opacity: 0.0;
            }
          }
          
          @keyframes fadeOut {
            from {
              opacity: 1.0;
            }
            to {
              opacity: 0.0;
            }
          }
          
          .is-fadingIn {
            -webkit-animation: fadeIn 0.1s ease-out;
            animation: fadeIn 0.1s ease-out;
            opacity: 1.0;
            display: block;
          }
          
          .is-fadingOut {
            -webkit-animation: fadeOut 0.1s ease-out;
            animation: fadeOut 0.1s ease-out;
            opacity: 0.0;
            display: block;
          }
            .goods-inventory-grid {
                grid-template-columns:auto 100px 100px 100px 150px;

                @screen sm {
                    grid-template-columns:auto 100px 100px 100px 150px;
                }

                @screen md {
                    grid-template-columns:auto 100px 100px 100px 150px;
                }

                @screen lg {
                    grid-template-columns:150px auto  130px 130px  130px 130px 130px  150px ;
                }
                @screen print{
                    grid-template-columns: 90px auto  130px 130px  130px 130px 130px  130px ;
                }
            }
     
        `
    ],
    animations: fuseAnimations,
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GoodsInventoryListComponent implements OnInit, OnDestroy {
    private goodsInventoryHistoryInfo: GoodsInventory = new GoodsInventory();
    private showHistoryValidity: Array<string> = [];
    disableHistory: boolean = true;
    sub: Subscription;
    @ViewChild('userMenu') userMenu: TemplateRef<any>;
    overlayRef: OverlayRef | null;
    protected _onDestroy = new Subject<void>();
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;
    public warehousesMultiFilterCtrl: FormControl = new FormControl();
    public warehouseMultiCtrl: FormControl = new FormControl();
    warehouses: any = [];
    selectedWarehouses: any = [];
    filteredWarehousesMulti: any = [];
    allCoversSelected = false;
    selectedCat: number = 0;
    drpCover: any = [];
    selectedCover: any = [];
    goodsCatArray: any = [];
    showGoodsProgressBar: boolean;
    pagination: Paging;
    goodsInventoryInfo: GoodsInventory;
    frmAdvancedSearch = new FormGroup({
        warehouse: new FormControl(),
        code: new FormControl(),
        name: new FormControl(),
        technicalNumber: new FormControl(),
        cover: new FormControl(),
        stockChanges: new FormControl(),
        initialUnitPriceFrom: new FormControl(),
        initialUnitPriceTo: new FormControl(),
        finalUnitPriceFrom: new FormControl(),
        finalUnitPriceTo: new FormControl(),
        initialStockFrom: new FormControl(),
        initialStockTo: new FormControl(),
        finalStockFrom: new FormControl(),
        finalStockTo: new FormControl(),
        stockChangesFrom: new FormControl(),
        stockChangesTo: new FormControl(),
        totalPriceFrom: new FormControl(),
        totalPriceTo: new FormControl(),
    });


    searchInputControl: FormControl = new FormControl();

    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
    @ViewChild('filter', { static: true }) filter: ElementRef;

    // Private
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    isLoading: boolean;

    constructor(private service: GoodsInventoryService, public overlay: Overlay,
        public viewContainerRef: ViewContainerRef,
        private excelService: ExcelService,
        private cdr: ChangeDetectorRef,
        private _decimalPipe: DecimalPipe,
        private _formBuilder: FormBuilder,
        private _historyDialogService: HistoryDialogService,
        private _changeDetectorRef: ChangeDetectorRef) {
        //this._unsubscribeAll = new Subject();
        this.goodsInventoryInfo = new GoodsInventory();
        this.goodsInventoryInfo.warehouseIds = [];
        this.goodsInventoryInfo.coverIds = [];

    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------
    isOverlayOpen: boolean = true;

    /**
     * On init
     */




    goodsInventory$: Observable<GoodsInventory[]>;
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
        this.warehousesMultiFilterCtrl.valueChanges
            .pipe(takeUntil(this._onDestroy))
            .subscribe(() => {
                this.filterWarehousesMulti();
            });

        this.initialPagination();
        fromEvent(this.filter.nativeElement, 'keyup')
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(150),
                distinctUntilChanged()
            )
            .subscribe(() => {

                if (!this.goodsInventory$)
                    return;

                this.service.goodsInventory$.pipe(map(items => items.filter(x =>
                    x.warehouseName?.toLowerCase().includes(this.filter.nativeElement.value) ||
                    x.goodsName.toLowerCase().includes(this.filter.nativeElement.value) ||
                    x.technicalNumber.toLowerCase().includes(this.filter.nativeElement.value) ||
                    x.unitPrice.toString().includes(this.filter.nativeElement.value) ||
                    x.stock.toString().includes(this.filter.nativeElement.value) ||
                    x.unitName.toLowerCase().includes(this.filter.nativeElement.value) ||
                    x.totalPrice.toString().includes(this.filter.nativeElement.value)))).subscribe(elements => {
                        this.goodsInventory$ = of(elements as GoodsInventory[]);
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
                    this.goodsInventoryInfo.page = this.pagination;
                    return this.service.getGoodsInventory(this.goodsInventoryInfo);
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
        this.service.disposegoodsInventory$();
        this.service.disponsePaginator$();

    }
    private setForkJoinValues(values: Array<any>): void {
        this.drpCover = values[0].data;
        this.filteredWarehousesMulti = values[1].data;
        this.warehouses = values[1].data;
        this.goodsCatArray = values[2].data;
        this._changeDetectorRef.markForCheck();
        this.cdr.detectChanges();
        this.goodsInventory$ = this.service.goodsInventory$;
        this._changeDetectorRef.markForCheck();
        this.cdr.detectChanges();
        this.setPaginatorAndSort();
        this.addSelectanItemToCatMenu();

    }
    private loadData(): void {
        forkJoin(
            this.getDrpCover(),
            this.getDrpWarehouse(),
            this.getGoodsCats(),
            this.getGoodsInventoryOnInit(),

        ).subscribe(res => {
            this.setForkJoinValues(res);
            this.isLoading = false;
            this.cdr.detectChanges();
        });
    }


    private getDrpWarehouse(): Observable<any> {
        return this.service.getDrpWarehouse();
    }

    private getDrpCover(): Observable<any> {
        return this.service.getDrpCover();
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

    setCover(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {
        if (event.isUserInput)
            if (event.source.selected) {
                this.selectedCover.push(event.source.value);
            }
            else {
                const indx = this.selectedCover.findIndex(x => x.key == event.source.value);
                this.selectedCover.splice(indx, 1);
            }

    }


    public setSelectedCat(selectedId: number) {
        this.selectedCat = selectedId;
        if (selectedId > 0) {
            this.trigger.closeMenu();
        }
    }
    protected filterWarehousesMulti() {
        if (this.warehouses.length === 0) {
            return;
        }
        // get the search keyword
        let search = this.warehousesMultiFilterCtrl.value;
        if (search && search.length > 2) {
            this.filteredWarehousesMulti = [];
            const warehouses = this.warehouses.filter(x => x.value.toLocaleLowerCase().includes(search.toLowerCase()));
            warehouses.forEach(element => {
                const selectedIndx = this.selectedWarehouses.findIndex(x => x.key === element.key);
                if (selectedIndx === -1)
                    this.filteredWarehousesMulti.push(element);
            });
        }
        if (!search && search.length < 2) {
            return this.filteredWarehousesMulti = this.warehouses;
        }
    }


    private getGoodsInventory(goodsInventoryInfo: GoodsInventory) {
        this.isLoading = true;
        this.service.getGoodsInventory(goodsInventoryInfo)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((financialDocumentsDetails: any) => {
                this.goodsInventory$ = this.service.goodsInventory$;
                this.disableHistory = this.showHistoryValidity.findIndex(x => x == 'cover') < 0 || this.showHistoryValidity.findIndex(x => x == 'warehouse') < 0;
                this.isLoading = false;
                this._changeDetectorRef.markForCheck();
                this.cdr.detectChanges();
            });
    }
    private getWarehouseInventoryId(goodsInventoryInfo: GoodsInventory): Observable<any> {
        this.isLoading = true;
        return this.service.getWarehouseInventoryId(goodsInventoryInfo)

    }
    private getGoodsInventoryOnInit(): Observable<any> {
        this.pagination = new Paging();
        this.pagination.flag = true;
        this.pagination.length = 0;
        this.pagination.order = 'desc';
        this.pagination.pageNumber = 1;
        this.pagination.pageSize = 100;
        this.pagination.sort = '';
        this.goodsInventoryInfo.page = this.pagination;
        return this.service.getGoodsInventory(this.goodsInventoryInfo);
    }
    public invertoryGoodsSearch() {

        this.pagination.flag = true;
        this.pagination.pageNumber = 1;
        this.pagination.length = 0;
        this.goodsInventoryInfo.categoryId = this.selectedCat;
        this.goodsInventoryInfo.goodsCode = this.frmAdvancedSearch.controls["code"].value;
        this.goodsInventoryInfo.goodsName = this.frmAdvancedSearch.controls["name"].value;
        this.goodsInventoryInfo.technicalNumber = this.frmAdvancedSearch.controls["technicalNumber"].value;
        this.goodsInventoryInfo.initialUnitPriceFrom = this.frmAdvancedSearch.controls["initialUnitPriceFrom"].value;
        this.goodsInventoryInfo.initialUnitPriceTo = this.frmAdvancedSearch.controls["initialUnitPriceTo"].value;
        this.goodsInventoryInfo.finalUnitPriceFrom = this.frmAdvancedSearch.controls["finalUnitPriceFrom"].value;
        this.goodsInventoryInfo.finalUnitPriceTo = this.frmAdvancedSearch.controls["finalUnitPriceTo"].value;
        this.goodsInventoryInfo.initialStockFrom = this.frmAdvancedSearch.controls["initialStockFrom"].value;
        this.goodsInventoryInfo.initialStockTo = this.frmAdvancedSearch.controls["initialStockTo"].value;
        this.goodsInventoryInfo.finalStockFrom = this.frmAdvancedSearch.controls["finalStockFrom"].value;
        this.goodsInventoryInfo.finalStockTo = this.frmAdvancedSearch.controls["finalStockTo"].value;
        this.goodsInventoryInfo.stockChangesFrom = this.frmAdvancedSearch.controls["stockChangesFrom"].value;
        this.goodsInventoryInfo.stockChangesTo = this.frmAdvancedSearch.controls["stockChangesTo"].value;
        this.goodsInventoryInfo.totalPriceFrom = this.frmAdvancedSearch.controls["finalStockFrom"].value;
        this.goodsInventoryInfo.totalPriceTo = this.frmAdvancedSearch.controls["finalStockTo"].value;
        this.goodsInventoryInfo.page = this.pagination;
        this.getGoodsInventory(this.goodsInventoryInfo);


    }
    setWarehousesValue(event: {
        isUserInput: any;
        source: { value: any; selected: any; group: any };
    }, action: string) {
        if (event.isUserInput) {

            if (action === 'add') {
                const indx = this.filteredWarehousesMulti.findIndex(x => x.key === event.source.value);
                this.selectedWarehouses.push(this.filteredWarehousesMulti[indx]);
                this.goodsInventoryInfo.warehouseIds.push(this.filteredWarehousesMulti[indx].warehouseId);
                this.filteredWarehousesMulti.splice(indx, 1);
                this.showHistoryValidity.push('warehouse');

            }
            else {
                const indx = this.selectedWarehouses.findIndex(x => x.key === event.source.value);
                this.filteredWarehousesMulti.push(this.selectedWarehouses[indx]);
                this.goodsInventoryInfo.warehouseIds.splice(indx, 1);
                this.selectedWarehouses.splice(indx, 1);
                this.showHistoryValidity.splice(this.showHistoryValidity.findIndex(x => x == 'warehouse'), 1);
            }
        }


    }
    coverItemIsChecked(coverId: number): boolean {
        return this.goodsInventoryInfo.coverIds.filter(x => x == coverId).length > 0
    }
    setAllCovers() {

        if (this.drpCover.length != this.goodsInventoryInfo.coverIds.length) {
            this.showHistoryValidity.push('cover');
            this.goodsInventoryInfo.coverIds = [];
            for (var i = 0; i < this.drpCover.length; i++)
                this.goodsInventoryInfo.coverIds.push(this.drpCover[i].key);
        }
        else {
            this.goodsInventoryInfo.coverIds = [];
            this.showHistoryValidity.splice(this.showHistoryValidity.findIndex(x => x == 'cover'), 1);
        }


    }
    setCoversValue(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            if (event.source.value != 0 && event.source.selected) {
                this.goodsInventoryInfo.coverIds.push(event.source.value);
                this.showHistoryValidity.push('cover');

            }
            else if (event.source.value != 0 && !event.source.selected) {
                const index: number = this.goodsInventoryInfo.coverIds.indexOf(event.source.value);
                if (index !== -1)
                    this.goodsInventoryInfo.coverIds.splice(index, 1);
                this.frmAdvancedSearch.controls["cover"].setValue(this.goodsInventoryInfo.coverIds);
                this.showHistoryValidity.splice(this.showHistoryValidity.findIndex(x => x == 'cover'), 1);
            }
        }

    }

    setStockChangesValue(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            if (event.source.value != 0 && event.source.selected) {
                this.goodsInventoryInfo.stockChangesIdList.push(event.source.value);

            }
            else if (event.source.value != 0 && !event.source.selected) {
                const index: number = this.goodsInventoryInfo.stockChangesIdList.indexOf(event.source.value);
                if (index !== -1)
                    this.goodsInventoryInfo.stockChangesIdList.splice(index, 1);
                this.frmAdvancedSearch.controls["stockChanges"].setValue(this.goodsInventoryInfo.stockChangesIdList);
            }
        }


    }
    getStockChangesTextColor(initialStock: number, finalStock: number): string {
        let classValue: string;
        let targetValue: number;
        targetValue = finalStock - initialStock;
        if (targetValue < 0)
            classValue = 'text-red-500';
        else if (targetValue > 0)
            classValue = 'text-green-500';
        else
            classValue = 'text-blue-500';

        return classValue;

    }
    historyValidity(): boolean {
        let result: boolean = false;
        result = this.showHistoryValidity.findIndex(x => x == 'cover') >= 0 && this.showHistoryValidity.findIndex(x => x == 'warehouse') >= 0
        return !result;
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
        let unitprice: number = 0;
        let totalprice: number = 0;
        let date = formatDate(new Date(), 'yyyyMMdd_hhmmss', 'en');
        let fileName: string = 'GoodsInventory_'.concat(date.concat('.pdf'));


        header = [{ header: 'Warehouse', dataKey: 'warehouseName' },
        { header: 'Goods', dataKey: 'goodsName' },
        { header: 'Code', dataKey: 'goodsCode' },
        { header: 'Initial Unit Price', dataKey: 'initialUnitPrice' },
        { header: 'Final Unit Price', dataKey: 'finalUnitPrice' },
        { header: 'Initial Stock', dataKey: 'initialStock' },
        { header: 'Final Stock', dataKey: 'finalStock' },
        { header: 'Stock Changes', dataKey: 'stockChanges' },
        { header: 'Total Price', dataKey: 'totalPrice' }];


        this.goodsInventory$.subscribe(items => items.forEach(element => {
            qty = qty + 1;
            unitprice = unitprice + element.unitPrice
            totalprice = totalprice + element.totalPrice
            tableData.push([
                element.warehouseName, element.goodsName, element.goodsCode
                , this.transformDecimal(element.initialUnitPrice), this.transformDecimal(element.unitPrice),
                element.initialStock, element.stock, this.transformDecimal(element.stockChanges),
                this.transformDecimal(element.totalPrice)
            ])
        }))


        footer = [['QTY', '', '', '', '', '', qty],
        ['Unit Price', '', '', '', '', '', this.transformDecimal(unitprice).toString().concat(' IRR')],
        ['Total Price', '', '', '', '', '', this.transformDecimal(totalprice).toString().concat(' IRR')]];


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
        let obj: Array<GoodsInventory> = new Array<GoodsInventory>();
        let qty: number = 0;
        let InitialUnitprice: number = 0;
        let unitprice: number = 0;
        let totalprice: number = 0;
        let preReserve: number = 0;
        let reserve: number = 0;
        let initialStock: number = 0;
        let finalStock: number = 0;
        let stockChanges: number = 0;
        let remained: number = 0;
        let date = formatDate(new Date(), 'yyyyMMdd_hhmmss', 'en');
        let fileName: string = 'GoodsInventory_'.concat(date.toString());

        columns.push({ basedColumnName: 'warehouseName', excelColumnName: 'Warehouse' });
        columns.push({ basedColumnName: 'goodsName', excelColumnName: 'Goods' });
        columns.push({ basedColumnName: 'goodsCode', excelColumnName: 'Code' });
        columns.push({ basedColumnName: 'technicalNumber', excelColumnName: 'Technical Number' });
        columns.push({ basedColumnName: 'initialUnitPrice', excelColumnName: 'Initial Unit Price' });
        columns.push({ basedColumnName: 'unitPrice', excelColumnName: 'Final Unit Price' });
        columns.push({ basedColumnName: 'initialStock', excelColumnName: 'Initial Stock' });
        columns.push({ basedColumnName: 'stock', excelColumnName: 'Final Stock' });
        columns.push({ basedColumnName: 'reserve', excelColumnName: 'Reserve' });
        columns.push({ basedColumnName: 'preReserve', excelColumnName: 'Pre Reserve' });
        columns.push({ basedColumnName: 'remained', excelColumnName: 'Remained' });
        columns.push({ basedColumnName: 'stockChanges', excelColumnName: 'Stock Changes' });
        columns.push({ basedColumnName: 'totalPrice', excelColumnName: 'Total Price' });

        this.goodsInventory$.subscribe(items => items.forEach(element => {
            qty = qty + 1;
            initialStock = initialStock + element.initialStock;
            finalStock = finalStock + element.stock;
            stockChanges = stockChanges + element.stockChanges;
            reserve = reserve + element.reserve;
            preReserve = preReserve + element.preReserve;
            remained = remained + element.remained;
            InitialUnitprice = InitialUnitprice + element.initialUnitPrice;
            unitprice = unitprice + element.unitPrice;
            totalprice = totalprice + element.totalPrice;
            obj.push(element)
        }));



        let footerData = [];
        footerData.push(['', '', '', '', '', '', '', '', '', '', '', 'QTY', qty]);
        footerData.push(['', '', '', '', '', '', '', '', '', '', '', 'Initial Unit Price', initialStock.toString().concat(' IRR')]);
        footerData.push(['', '', '', '', '', '', '', '', '', '', '', 'Final Unit Price', unitprice.toString().concat(' IRR')]);
        footerData.push(['', '', '', '', '', '', '', '', '', '', '', 'Initial Stock', initialStock]);
        footerData.push(['', '', '', '', '', '', '', '', '', '', '', 'Final Stock', finalStock]);
        footerData.push(['', '', '', '', '', '', '', '', '', '', '', 'Pre Reserve', preReserve]);
        footerData.push(['', '', '', '', '', '', '', '', '', '', '', 'Reserve', reserve]);
        footerData.push(['', '', '', '', '', '', '', '', '', '', '', 'Remained', remained]);
        footerData.push(['', '', '', '', '', '', '', '', '', '', '', 'Total Price', totalprice.toString().concat(' IRR')]);


        this.excelService.exportAsExcelFile('Goods Inventory', '', columns, obj, footerData, fileName, 'Sheet1');



        obj = [];
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

    openHistoryDialog() {
        this.isLoading = true;
        this.close();
        this.cdr.detectChanges();
        this.getWarehouseInventoryId(this.goodsInventoryHistoryInfo).pipe(takeUntil(this._unsubscribeAll))
            .subscribe((warehouseInventoryId: any) => {
                this.close();
                this.goodsInventory$ = this.service.goodsInventory$;
                this.isLoading = false;
                let configForm: FormGroup = this._formBuilder.group({
                    warehouseInventoryId: warehouseInventoryId,
                    title: "Inventory History"
                });
                const dialogRef = this._historyDialogService.open(configForm.value);
                dialogRef.afterClosed().subscribe((result) => {
                    /*    if (result !== 'cancelled')
                           this.categoryTreeModification(result, 0, 0, 'new'); */
                }); 
                this.cdr.detectChanges();
            });

    }
    open({ x, y }: MouseEvent, warehouseInventory) {
        this.close();
        this.goodsInventoryHistoryInfo = warehouseInventory;
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
            $implicit: warehouseInventory
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
}




