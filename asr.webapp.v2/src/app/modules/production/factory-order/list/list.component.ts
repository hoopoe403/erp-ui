import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Subject, merge, Observable, forkJoin, fromEvent, of, async, } from 'rxjs';
import { debounceTime, switchMap, map, distinctUntilChanged } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';
import { fuseAnimations } from "../../../../../@fuse/animations";
import { HierarchicalKeyValue } from 'app/core/type/key-value/key-value.type';
import { FactoryOrderService } from "../factory-order.service";
import { FactoryOrder } from "../factory-order.types";
import { Paging } from 'app/core/type/paging/paging.type';
import { FormControl, FormGroup } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
import jsPDF from 'jspdf';
import { DecimalPipe, formatDate, KeyValue } from '@angular/common';
import { ExcelHeader } from 'app/shared/excel/excel.types';
import { ExcelService } from 'app/shared/excel/excel.service';
import { Goods } from 'app/modules/inventory/goods/goods/goods.types';

@Component({
    selector: 'factory-order-list',
    templateUrl: './list.component.html',
    styles: [
        /* language=SCSS */
        `
            .factory-order-grid {
                grid-template-columns:150px auto  130px 130px  130px 130px 130px 90px 50px ;

                @screen sm {
                    grid-template-columns:auto 100px 100px 100px 150px;
                }

                @screen md {
                    grid-template-columns:auto 100px 100px 100px 150px;
                }

                @screen lg {
                    grid-template-columns:150px auto  130px 130px  130px 130px 130px 90px 50px ;
                }
                @screen print{
                    grid-template-columns: 90px auto  130px 130px  130px 130px 90px 50px ;
                }
            }
     
        `
    ],
    animations: fuseAnimations,
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FactoryOrderListComponent implements OnInit, OnDestroy {
    _paging: Paging;
    protected _onDestroy = new Subject<void>();
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;
    allCoversSelected = false;
    selectedCat: number = 0;
    selectedCover: any = [];
    goodsCatArray: any = [];
    showProgressBar: boolean;
    statuses = [];
    defaultStatuses = [];
    selectedInfoRow: FactoryOrder = new FactoryOrder();
    pagination: Paging;
    factoryOrderInfo: FactoryOrder;
    frmAdvancedSearch = new FormGroup({
        status: new FormControl(),
        warehouse: new FormControl(),
        code: new FormControl(),
        name: new FormControl(),
        /*   stockChanges: new FormControl(),
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
          totalPriceTo: new FormControl(), */
    });


    searchInputControl: FormControl = new FormControl();

    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
    @ViewChild('filter', { static: true }) filter: ElementRef;

    // Private
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    isLoading: boolean;

    constructor(private service: FactoryOrderService,
        private excelService: ExcelService,
        private cdr: ChangeDetectorRef,
        private _decimalPipe: DecimalPipe,
        private _changeDetectorRef: ChangeDetectorRef) {
        //this._unsubscribeAll = new Subject();
        this.factoryOrderInfo = new FactoryOrder();
        this._paging = new Paging();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------
    isOverlayOpen: boolean = true;

    /**
     * On init
     */




    factoryOrders$: Observable<FactoryOrder[]>;
    ngOnInit(): void {
        this.isLoading = true;
        this.getGoodsUsingPaging(new Goods, 100, 0, true);
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

                if (!this.factoryOrders$)
                    return;

                this.service.factoryOrders$.pipe(map(items => items.filter(x =>
                    x.contractorName.toLowerCase().includes(this.filter.nativeElement.value) ||
                    x.goodsName.toLowerCase().includes(this.filter.nativeElement.value) ||
                    x.factoryOrderCode.includes(this.filter.nativeElement.value) ||
                    x.goodsCode.toString().includes(this.filter.nativeElement.value) ||
                    x.goodsMeasure.toString().includes(this.filter.nativeElement.value) ||
                    x.totalPrice.toString().includes(this.filter.nativeElement.value)))).subscribe(elements => {
                        this.factoryOrders$ = of(elements as FactoryOrder[]);
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
                    this.factoryOrderInfo.page = this.pagination;
                    return this.service.getFactoryOrders(this.factoryOrderInfo);
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
        this.service.disposefactoryOrders$();
        this.service.disponsePaginator$();

    }
    private setForkJoinValues(values: Array<any>): void {
        this.goodsCatArray = values[0].data;
        this.statuses = values[2].data;
        this.defaultStatuses = [];
        this.statuses.forEach(element => {
            if (element.isDefault === 1)
                this.defaultStatuses.push(element.statusId);
        });
        this.frmAdvancedSearch.controls["status"].setValue(this.defaultStatuses);
        this.factoryOrderInfo.statusList = this.defaultStatuses;
        this._changeDetectorRef.markForCheck();
        this.cdr.detectChanges();
        this.factoryOrders$ = this.service.factoryOrders$;
        this._changeDetectorRef.markForCheck();
        this.cdr.detectChanges();
        this.setPaginatorAndSort();
        this.addSelectanItemToCatMenu();

    }
    private loadData(): void {
        forkJoin(
            this.getGoodsCats(),
            this.getFactoryOrderOnInit(),
            this.getStatuses(),

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


    setStatusValue(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            if (event.source.value != 0 && event.source.selected) {
                this.factoryOrderInfo.statusList.push(event.source.value);

            }
            else if (event.source.value != 0 && !event.source.selected) {
                const index: number = this.factoryOrderInfo.statusList.indexOf(event.source.value);
                if (index !== -1)
                    this.factoryOrderInfo.statusList.splice(index, 1);
                this.frmAdvancedSearch.controls["status"].setValue(this.factoryOrderInfo.statusList);
            }
        }


    }
    private getFactoryOrders(factoryOrderInfo: FactoryOrder) {
        this.isLoading = true;
        this.service.getFactoryOrders(factoryOrderInfo)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((factoryOrder: any) => {
                this.factoryOrders$ = this.service.factoryOrders$;
                this.isLoading = false;
                this._changeDetectorRef.markForCheck();
                this.cdr.detectChanges();
            });
    }

    private getFactoryOrderOnInit(): Observable<any> {
        this.pagination = new Paging();
        this.pagination.flag = true;
        this.pagination.length = 0;
        this.pagination.order = 'desc';
        this.pagination.pageNumber = 1;
        this.pagination.pageSize = 100;
        this.pagination.sort = '';
        this.factoryOrderInfo.page = this.pagination;
        return this.service.getFactoryOrdernInit(this.factoryOrderInfo);
    }
    public factoryOrderSearch() {

        this.pagination.flag = true;
        this.pagination.pageNumber = 1;
        this.pagination.length = 0;
        this.factoryOrderInfo.categoryId = this.selectedCat;
        this.factoryOrderInfo.goodsCode = this.frmAdvancedSearch.controls["code"].value;
        this.factoryOrderInfo.goodsName = this.frmAdvancedSearch.controls["name"].value;
        this.factoryOrderInfo.page = this.pagination;
        this.getFactoryOrders(this.factoryOrderInfo);


    }

    createDraft() {

    }


    download() {
        var pdf = new jsPDF('l');

        pdf.setFontSize(20);
        pdf.text('Factory Order', 14, 8);
        pdf.setFontSize(12);
        pdf.setTextColor(99);
        let header = [];
        let tableData = [];
        let footer = [];
        let rows: number = 0;
        let total: number = 0;
        let remained: number = 0;
        let date = formatDate(new Date(), 'yyyyMMdd_hhmmss', 'en');
        let fileName: string = 'FactoryOrder_'.concat(date.concat('.pdf'));

        header = [{ header: 'Order Code', dataKey: 'factoryOrderCode' },
        { header: 'Order Number', dataKey: 'orderNumber' },
        { header: 'Code', dataKey: 'goodsCode' },
        { header: 'Name', dataKey: 'goodsName' },
        { header: 'Contractor', dataKey: 'contractorName' },
        { header: 'Purchaser', dataKey: 'purchaserName' },
        { header: 'Total', dataKey: 'goodsMeasure' },
        { header: 'Remained', dataKey: 'remainedItems' },
        { header: 'Status', dataKey: 'statusDescription' }
        ];

        this.factoryOrders$.subscribe(items => items.forEach(element => {
            rows = rows + 1;
            total = total + element.goodsMeasure;
            remained = remained + element.remainedItems;
            tableData.push([
                element.factoryOrderCode, element.orderNumber, element.goodsCode,
                element.goodsName, element.contractorName, element.purchaserName,
                element.goodsMeasure, element.remainedItems, element.statusDescription
            ]);
        }));
        footer = [['Rows', '', '', '', '', '', '', parseFloat(rows.toString()).toFixed(2)],
        ['Total', '', '', '', '', '', '', parseFloat(total.toString()).toFixed(2)],
        ['Remained', '', '', '', '', '', '', parseFloat(remained.toString()).toFixed(2)]];


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

    exportTable() {
        let columns: Array<ExcelHeader> = new Array<ExcelHeader>();
        let obj: Array<FactoryOrder> = new Array<FactoryOrder>();
        let qty: number = 0;
        let total: number = 0;
        let totalPrice: number = 0;
        let remained: number = 0;
        let date = formatDate(new Date(), 'yyyyMMdd_hhmmss', 'en');
        let fileName: string = 'FactoryOrder_'.concat(date.toString());

        columns.push({ basedColumnName: 'factoryOrderCode', excelColumnName: 'Order Code' });
        columns.push({ basedColumnName: 'orderNumber', excelColumnName: 'Order Number' });
        columns.push({ basedColumnName: 'goodsCode', excelColumnName: 'Code' });
        columns.push({ basedColumnName: 'goodsName', excelColumnName: 'Name' });
        columns.push({ basedColumnName: 'contractorName', excelColumnName: 'Contractor' });
        columns.push({ basedColumnName: 'referenceNumber', excelColumnName: 'Reference No' });
        columns.push({ basedColumnName: 'purchaserName', excelColumnName: 'Purchaser' });
        columns.push({ basedColumnName: 'totalPrice', excelColumnName: 'Total Price' });
        columns.push({ basedColumnName: 'goodsMeasure', excelColumnName: 'Total Measure' });
        columns.push({ basedColumnName: 'remainedItems', excelColumnName: 'Remained' });
        columns.push({ basedColumnName: 'statusDescription', excelColumnName: 'Status' });

        this.factoryOrders$.subscribe(items => items.forEach(element => {
            qty = qty + 1;
            total = total + element.goodsMeasure;
            remained = remained + element.remainedItems;
            totalPrice = totalPrice + element.totalPrice;
            obj.push(element)
        }));



        let footerData = [];
        footerData.push(['', '', '', '', '', '', '', '', '', 'QTY', qty]);
        footerData.push(['', '', '', '', '', '', '', '', '', 'Total Price', totalPrice]);
        footerData.push(['', '', '', '', '', '', '', '', '', 'Total Measure', total]);
        footerData.push(['', '', '', '', '', '', '', '', '', 'Remained', remained]);


        this.excelService.exportAsExcelFile('Factory Order', '', columns, obj, footerData, fileName, 'Sheet1');



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

    private getGoodsUsingPaging(goodsInfo: Goods, pageSize: number, pageNumber: number, flag: boolean) {
        this._paging.pageSize = pageSize;
        this._paging.pageNumber = pageNumber + 1;
        this._paging.length = 1000;
        this._paging.flag = flag;
        goodsInfo.page = this._paging;
        this.service.getGoodsUsingPaging(goodsInfo).subscribe(res => {
            /*   res.data.goods.forEach(element => {
  
              }); */

        });
    }

}




