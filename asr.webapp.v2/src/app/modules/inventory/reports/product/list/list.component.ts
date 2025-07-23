import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Subject, merge, Observable, forkJoin, fromEvent, of, async, } from 'rxjs';
import { debounceTime, switchMap, map, distinctUntilChanged } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';
import { fuseAnimations } from "../../../../../../@fuse/animations";
import { ProductInventoryService } from "../product-inventory.service";
import { ProductInventory } from "../product-inventory.types";
import { Paging } from 'app/core/type/paging/paging.type';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
import jsPDF from 'jspdf';
import { DecimalPipe, formatDate } from '@angular/common';
import { ExcelHeader } from 'app/shared/excel/excel.types';
import { ExcelService } from 'app/shared/excel/excel.service';
import { ProductInventoryDetailDialogService } from '../details/product-inventory-detail-dialog.service';
import { SummaryDialogService } from '../report-summary/summary-dialog.service';

@Component({
    selector: 'product-inventory-list',
    templateUrl: './list.component.html',
    styles: [
        /* language=SCSS */
        `
            .product-inventory-grid {
                grid-template-columns:200px auto  150px 150px  100px 100px 150px ;

                @screen sm {
                    grid-template-columns:200px auto  100px 70px;
                }

                @screen md {
                    grid-template-columns: 200px auto  150px 150px  100px 100px 150px;
                }

                @screen lg {
                    grid-template-columns: 200px auto  150px 150px  100px 100px 150px ;
                }
                @screen print{
                    grid-template-columns: 200px auto  150px 150px 100px  100px 150px;
                }
            }
        `,
        `
        .product-inventory-detail-grid {
                grid-template-columns:200px auto 120px 100px 130px 100px  150px 150px;

                @screen sm {
                    grid-template-columns:200px auto  100px 70px;
                }

                @screen md {
                    grid-template-columns:  200px auto 50px 150px  150px 150px;
                }

                @screen lg {
                    grid-template-columns: 200px auto 120px 100px 130px 100px  150px 150px;
                }
                @screen print{
                    grid-template-columns:  200px auto 50px 150px  150px 150px;
                }
            }
        `
    ],
    animations: fuseAnimations,
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductInventoryListComponent implements OnInit, OnDestroy {
    protected _onDestroy = new Subject<void>();
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild("accumalativeSort") private _sort: MatSort;
    @ViewChild("detailSort") private _sortDetails: MatSort;
    public warehousesMultiFilterCtrl: FormControl = new FormControl();
    public warehouseMultiCtrl: FormControl = new FormControl();

    statuses: any = [];
    defaultStatuses = [];
    drpBrand: any = [];
    drpCover: any = [];
    warehouses: any = [];
    productTypes: any = [];
    selectedWarehouses: any = [];
    filteredWarehousesMulti: any[];
    reportType: number;
    pagination: Paging;
    productInventoryInfo: ProductInventory;
    filteredItemsCount: number = 0;
    sortFlag: boolean = false;
    detailSortFlag: boolean = false;
    frmAdvancedSearch = new FormGroup({
        reportType: new FormControl(),
        productType: new FormControl(),
        status: new FormControl(),
        warehouse: new FormControl(),
        brand: new FormControl(),
        cover: new FormControl(),
        productCode: new FormControl(),
        productName: new FormControl(),
        serial: new FormControl(),
        initialUnitPriceFrom: new FormControl(),
        initialUnitPriceTo: new FormControl(),
        finalUnitPriceFrom: new FormControl(),
        finalUnitPriceTo: new FormControl(),
        initialStockFrom: new FormControl(),
        initialStockTo: new FormControl(),
        finalStockFrom: new FormControl(),
        finalStockTo: new FormControl(),
        productionLocalDateFrom: new FormControl(),
        productionLocalDateTo: new FormControl(),
        orderCode: new FormControl(),
        remittanceCode: new FormControl(),
        transferCode: new FormControl(),
    });


    searchInputControl: FormControl = new FormControl();

    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
    @ViewChild('filter', { static: true }) filter: ElementRef;

    // Private
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    isLoading: boolean;

    constructor(private service: ProductInventoryService,
        private excelService: ExcelService,
        private cdr: ChangeDetectorRef,
        private _decimalPipe: DecimalPipe,
        private _dialogService: ProductInventoryDetailDialogService,
        private _summaryDialogService: SummaryDialogService,
        private _formBuilder: FormBuilder,
        private _changeDetectorRef: ChangeDetectorRef) {
        //this._unsubscribeAll = new Subject();
        this.productInventoryInfo = new ProductInventory();
        this.productInventoryInfo.statusIdList = [];
        this.productInventoryInfo.productTypeIdList = [];
        this.productInventoryInfo.warehouseIds = [];
        this.productInventoryInfo.coverIds = [];
        this.productInventoryInfo.brandIds = [];
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------
    isOverlayOpen: boolean = true;

    /**
     * On init
     */



    productInventories$: Observable<ProductInventory[]>;
    productInventoriesDetails$: Observable<ProductInventory[]>;
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
                if (this.reportType == 1)
                    if (!this.productInventories$)
                        return;
                    else
                        if (!this.productInventoriesDetails$)
                            return;

                if (this.reportType == 1)
                    this.service.productInventories$.pipe(map(items => items.filter(x =>
                        x.warehouseName.toLowerCase().includes(this.filter.nativeElement.value) ||
                        x.fullName.toLowerCase().includes(this.filter.nativeElement.value) ||
                        x.productCode.toLowerCase().includes(this.filter.nativeElement.value) ||
                        x.statusDescription.toLowerCase().includes(this.filter.nativeElement.value) ||
                        x.serial.toString().includes(this.filter.nativeElement.value) ||
                        x.unitPrice.toString().includes(this.filter.nativeElement.value) ||
                        x.stock.toString().includes(this.filter.nativeElement.value) ||
                        x.totalPrice.toString().includes(this.filter.nativeElement.value)))).subscribe(elements => {
                            this.productInventories$ = of(elements as ProductInventory[]);
                            this._changeDetectorRef.markForCheck();
                            this._changeDetectorRef.detectChanges();
                        });
                else
                    this.service.productInventoriesDetails$.pipe(map(items => items.filter(x =>
                        x.warehouseName.toLowerCase().includes(this.filter.nativeElement.value) ||
                        x.fullName.toLowerCase().includes(this.filter.nativeElement.value) ||
                        x.productCode.toLowerCase().includes(this.filter.nativeElement.value) ||
                        x.brandName.toLowerCase().includes(this.filter.nativeElement.value) ||
                        x.coverName.toLowerCase().includes(this.filter.nativeElement.value) ||
                        x.statusDescription.toLowerCase().includes(this.filter.nativeElement.value) ||
                        x.serial.toString().includes(this.filter.nativeElement.value) ||
                        x.unitPrice.toString().includes(this.filter.nativeElement.value) ||
                        x.stock.toString().includes(this.filter.nativeElement.value) ||
                        x.totalPrice.toString().includes(this.filter.nativeElement.value)))).subscribe(elements => {
                            this.productInventoriesDetails$ = of(elements as ProductInventory[]);
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
        this.pagination.order = 'asc';
        this.pagination.pageNumber = 1;
        this.pagination.pageSize = 100;
        this.pagination.sort = '';
    }

    /* private initialDetailPagination() {
        this.paginationDetails = new Paging();
        this.paginationDetails.flag = true;
        this.paginationDetails.length = 0;
        this.paginationDetails.order = 'desc';
        this.paginationDetails.pageNumber = 1;
        this.paginationDetails.pageSize = 100;
        this.paginationDetails.sort = '';
    } */

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
                    this.productInventoryInfo.page = this.pagination;
                    return this.service.getProductInventory(this.productInventoryInfo);
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
                    this.productInventoryInfo.page = this.pagination;
                    return this.service.getProductInventoryDetails(this.productInventoryInfo);

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
        this.service.disposeProductInventorys$();
        this.service.disposeProductInventorysDetails$();
        this.service.disponsePaginator$();

    }
    private setForkJoinValues(values: Array<any>): void {
        this.statuses = values[0].data;
        this.statuses.forEach(element => {
            if (element.isDefault === 1)
                this.defaultStatuses.push(element.statusId);
        });
        this.frmAdvancedSearch.controls["status"].setValue(this.defaultStatuses);
        this.productInventoryInfo.statusIdList = this.defaultStatuses;
        this.drpCover = values[1].data;
        this.filteredWarehousesMulti = values[2].data;
        this.warehouses = values[2].data;
        this.drpBrand = values[3].data;
        this.productTypes = values[4].data;
        this.changeReportType({
            isUserInput: true,
            source: { value: 1, selected: true }
        });
        
        this.productInventoryInfo.page = this.pagination;
        this.frmAdvancedSearch.controls['reportType'].setValue(1);
        this.productInventories$ = this.service.productInventories$;
        this._changeDetectorRef.markForCheck();
        this.cdr.detectChanges();
        this.setPaginatorAndSort();

    }
    private loadData(): void {
        forkJoin(
            this.getStatuses(),
            this.getDrpCover(),
            this.getDrpWarehouse(),
            this.getDrpBrand(),
            this.getDrpProductType(),
            this.geProductInventorysOnInit(),
        ).subscribe(res => {
            this.setForkJoinValues(res);
            this.isLoading = false;
            this.cdr.detectChanges();
        });
    }


    private getStatuses(): Observable<any> {
        return this.service.getStatuses();
    }

    private getDrpWarehouse(): Observable<any> {
        return this.service.getDrpWarehouse();
    }

    private getDrpCover(): Observable<any> {
        return this.service.getDrpCover();
    }

    private getDrpBrand(): Observable<any> {
        return this.service.getDrpBrand();
    }

    private getDrpProductType(): Observable<any> {
        return this.service.getDrpProductType();
    }
    protected filterWarehousesMulti() {
        if (this.warehouses.length === 0) {
            return;
        }
        console.log(this.warehouses);
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

    changeReportType(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            if (event.source.value === 1) {
                this.frmAdvancedSearch.controls['reportType'].setValue(1);
                this.frmAdvancedSearch.controls['productCode'].setValue('');
                this.frmAdvancedSearch.controls['productName'].setValue('');
                this.frmAdvancedSearch.controls['serial'].setValue('');
                this.frmAdvancedSearch.controls['serial'].disable();
            }
            else {
                this.frmAdvancedSearch.controls['initialStockFrom'].setValue(null);
                this.frmAdvancedSearch.controls['initialStockTo'].setValue(null);
                this.frmAdvancedSearch.controls['finalStockFrom'].setValue(null);
                this.frmAdvancedSearch.controls['finalStockTo'].setValue(null);
                this.frmAdvancedSearch.controls['initialStockFrom'].disable();
                this.frmAdvancedSearch.controls['initialStockTo'].disable();
                this.frmAdvancedSearch.controls['finalStockFrom'].disable();
                this.frmAdvancedSearch.controls['finalStockTo'].disable();
                this.frmAdvancedSearch.controls['serial'].enable();
            }
        }



    }

    setStatusValue(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            if (event.source.value != 0 && event.source.selected) {
                this.productInventoryInfo.statusIdList.push(event.source.value);

            }
            else if (event.source.value != 0 && !event.source.selected) {
                const index: number = this.productInventoryInfo.statusIdList.indexOf(event.source.value);
                if (index !== -1)
                    this.productInventoryInfo.statusIdList.splice(index, 1);
                this.frmAdvancedSearch.controls["status"].setValue(this.productInventoryInfo.statusIdList);
            }
        }

    }
    coverItemIsChecked(coverId: number): boolean {
        return this.productInventoryInfo.coverIds.filter(x => x == coverId).length > 0
    }
    setAllCovers() {

        if (this.drpCover.length != this.productInventoryInfo.coverIds.length) {
            this.productInventoryInfo.coverIds = [];
            for (var i = 0; i < this.drpCover.length; i++)
                this.productInventoryInfo.coverIds.push(this.drpCover[i].key);
        }
        else
            this.productInventoryInfo.coverIds = [];


    }
    setCoversValue(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            if (event.source.value != 0 && event.source.selected) {
                this.productInventoryInfo.coverIds.push(event.source.value);

            }
            else if (event.source.value != 0 && !event.source.selected) {
                const index: number = this.productInventoryInfo.coverIds.indexOf(event.source.value);
                if (index !== -1)
                    this.productInventoryInfo.coverIds.splice(index, 1);
                this.frmAdvancedSearch.controls["cover"].setValue(this.productInventoryInfo.coverIds);
            }
        }


    }


    setProductTypeValue(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            if (event.source.value != 0 && event.source.selected) {
                this.productInventoryInfo.productTypeIdList.push(event.source.value);

            }
            else if (event.source.value != 0 && !event.source.selected) {
                const index: number = this.productInventoryInfo.productTypeIdList.indexOf(event.source.value);
                if (index !== -1)
                    this.productInventoryInfo.productTypeIdList.splice(index, 1);
                this.frmAdvancedSearch.controls["productType"].setValue(this.productInventoryInfo.productTypeIdList);
            }
        }


    }



    setAllWarehouses() {
        if (this.warehouses.length != this.productInventoryInfo.warehouseIds.length) {
            this.productInventoryInfo.warehouseIds = [];
            for (var i = 0; i < this.warehouses.length; i++)
                this.productInventoryInfo.warehouseIds.push(this.warehouses[i].key);
        }
        else
            this.productInventoryInfo.warehouseIds = [];
    }
    setWarehousesValue(event: {
        isUserInput: any;
        source: { value: any; selected: any, group: any };
    }, action: string) {
        if (event.isUserInput) {

            if (action === 'add') {
                const indx = this.filteredWarehousesMulti.findIndex(x => x.key === event.source.value);
                this.selectedWarehouses.push(this.filteredWarehousesMulti[indx]);
                this.productInventoryInfo.warehouseIds.push(this.filteredWarehousesMulti[indx].warehouseId);
                this.filteredWarehousesMulti.splice(indx, 1);
            }
            else {
                const indx = this.selectedWarehouses.findIndex(x => x.key === event.source.value);
                this.filteredWarehousesMulti.push(this.selectedWarehouses[indx]);
                this.productInventoryInfo.warehouseIds.splice(indx, 1);
                this.selectedWarehouses.splice(indx, 1);
            }
        }
    }
    brandItemIsChecked(brandId: number): boolean {
        return this.productInventoryInfo.brandIds.filter(x => x == brandId).length > 0
    }
    setAllBrands() {

        if (this.drpBrand.length != this.productInventoryInfo.brandIds.length) {
            this.productInventoryInfo.brandIds = [];
            for (var i = 0; i < this.drpBrand.length; i++)
                this.productInventoryInfo.brandIds.push(this.drpBrand[i].key);
        }
        else
            this.productInventoryInfo.brandIds = [];

    }
    setBrandsValue(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            if (event.source.value != 0 && event.source.selected) {
                this.productInventoryInfo.brandIds.push(event.source.value);

            }
            else if (event.source.value != 0 && !event.source.selected) {
                const index: number = this.productInventoryInfo.brandIds.indexOf(event.source.value);
                if (index !== -1)
                    this.productInventoryInfo.brandIds.splice(index, 1);
                this.frmAdvancedSearch.controls["brand"].setValue(this.productInventoryInfo.brandIds);
            }
        }


    }


    private getProductInventory(productInventoryInfo: ProductInventory) {
        this.isLoading = true;
        this.service.getProductInventory(productInventoryInfo)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((financialDocumentsDetails: any) => {
                this.reportType = this.frmAdvancedSearch.controls['reportType'].value;
                this.productInventories$ = this.service.productInventories$;
                this.productInventoryInfo.page = this.pagination;
                this.isLoading = false;
                this._changeDetectorRef.markForCheck();
                this.cdr.detectChanges();
                this.setPaginatorAndSort();
            });
    }

    private getProductInventoryDetails(productInventoryInfo: ProductInventory) {
        this.isLoading = true;
        this.service.getProductInventoryDetails(productInventoryInfo)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((financialDocumentsDetails: any) => {
                this.reportType = this.frmAdvancedSearch.controls['reportType'].value;
                this.productInventoriesDetails$ = this.service.productInventoriesDetails$;
                this.productInventoryInfo.page = this.pagination;
                this.isLoading = false;
                this._changeDetectorRef.markForCheck();
                this.cdr.detectChanges();
                this.setPaginatorAndSortDetail();
            });
    }

    private geProductInventorysOnInit(): Observable<any> {

        this.productInventoryInfo.page = this.pagination;
        return this.service.getProductInventoryOnInit(this.productInventoryInfo);
    }
    public invertoryProductSearch() {

        this.productInventoryInfo.productCode = this.frmAdvancedSearch.controls["productCode"].value;
        this.productInventoryInfo.fullName = this.frmAdvancedSearch.controls["productName"].value;
        this.productInventoryInfo.serial = this.frmAdvancedSearch.controls["serial"].value;
        this.productInventoryInfo.initialUnitPriceFrom = this.frmAdvancedSearch.controls["initialUnitPriceFrom"].value;
        this.productInventoryInfo.initialUnitPriceTo = this.frmAdvancedSearch.controls["initialUnitPriceTo"].value;
        this.productInventoryInfo.finalUnitPriceFrom = this.frmAdvancedSearch.controls["finalUnitPriceFrom"].value;
        this.productInventoryInfo.finalUnitPriceTo = this.frmAdvancedSearch.controls["finalUnitPriceTo"].value;
        this.productInventoryInfo.initialStockFrom = this.frmAdvancedSearch.controls["initialStockFrom"].value;
        this.productInventoryInfo.initialStockTo = this.frmAdvancedSearch.controls["initialStockTo"].value;
        this.productInventoryInfo.finalStockFrom = this.frmAdvancedSearch.controls["finalStockFrom"].value;
        this.productInventoryInfo.finalStockTo = this.frmAdvancedSearch.controls["finalStockTo"].value;
        this.productInventoryInfo.productionLocalDateFrom = this.frmAdvancedSearch.controls["productionLocalDateFrom"].value;
        this.productInventoryInfo.productionLocalDateTo = this.frmAdvancedSearch.controls["productionLocalDateTo"].value;
        this.productInventoryInfo.orderCode = this.frmAdvancedSearch.controls["orderCode"].value;
        this.productInventoryInfo.remittanceCode = this.frmAdvancedSearch.controls["remittanceCode"].value;
        this.productInventoryInfo.transferCode = this.frmAdvancedSearch.controls["transferCode"].value;
        this.pagination.flag = true;
        this.pagination.length = 0;
        this.pagination.pageNumber = 1;
        this.pagination.order = this.pagination.order == null ? 'asc' : this.pagination.order;
        this.pagination.sort = this.pagination.sort == null ? '' : this.pagination.sort;
        this.productInventoryInfo.page = this.pagination;
        if (this.frmAdvancedSearch.controls['reportType'].value == 1)
            this.getProductInventory(this.productInventoryInfo);
        else
            this.getProductInventoryDetails(this.productInventoryInfo);


    }
    openDetailDialog(requestId: number, requestDetailId: number) {
        let requestTypeId: number;
        let title: string;
        if (requestId != 0 && requestId.toString().substring(0, 6) == '100049') {
            requestTypeId = 1000521;
            title = 'Customer Order';
        }
        else if (requestId != 0 && requestId.toString().substring(0, 6) == '100099') {
            requestTypeId = 1000522;
            title = 'Depot';
        }
        else if (requestDetailId.toString().substring(0, 6) == '100047') {
            requestTypeId = 1000523;
            title = 'Transfer';
        }
        else
            return;
        let configForm: FormGroup = this._formBuilder.group({
            requestId: requestId,
            requestDetailId: requestDetailId,
            requestTypeId: requestTypeId,
            title: title
        });
        const dialogRef = this._dialogService.open(configForm.value);
        dialogRef.afterClosed().subscribe((result) => {
            /*    if (result !== 'cancelled')
                   this.categoryTreeModification(result, 0, 0, 'new'); */
        });
    }

    openSummaryDialog() {

        let configForm: FormGroup = this._formBuilder.group({
            inventoryInfo: this.productInventoryInfo,
            numberOfRecords: this.pagination.length,
            title: "Summary"
        });
        const dialogRef = this._summaryDialogService.open(configForm.value);
        dialogRef.afterClosed().subscribe((result) => {
            /*    if (result !== 'cancelled')
                   this.categoryTreeModification(result, 0, 0, 'new'); */
        });
    }
    download() {
        var pdf = new jsPDF('l');
        pdf.setFontSize(20);
        pdf.text('Product Inventory', 14, 8);
        pdf.setFontSize(12);
        pdf.setTextColor(99);
        let header = [];
        let tableData = [];
        let footer = [];
        let qty: number = 0;
        let unitprice: number = 0;
        let totalprice: number = 0;
        let date = formatDate(new Date(), 'yyyyMMdd_hhmmss', 'en');
        let fileName: string = 'productInventory_'.concat(date.concat('.pdf'));

        if (this.reportType === 1)
            header = [{ header: 'Warehouse', dataKey: 'warehouse' },
            { header: 'Product', dataKey: 'product' },
            { header: 'Code', dataKey: 'code' },
            { header: 'Initial Unit Price', dataKey: 'initialUnitPrice' },
            { header: 'Final Unit Price', dataKey: 'finalUnitPrice' },
            { header: 'Initial Stock', dataKey: 'initialStock' },
            { header: 'Final Stock', dataKey: 'finalStock' },
            { header: 'Total Price', dataKey: 'totalPrice' }];
        else
            header = [{ header: 'Warehouse', dataKey: 'warehouse' },
            { header: 'Product', dataKey: 'product' },
            { header: 'Code', dataKey: 'code' },
            { header: 'Brand', dataKey: 'brand' },
            { header: 'Cover', dataKey: 'cover' },
            { header: 'Status', dataKey: 'status' },
            { header: 'Serial', dataKey: 'serial' },
            { header: 'Unit Price', dataKey: 'unitPrice' },
            { header: 'Stock', dataKey: 'stock' },
            { header: 'Total Price', dataKey: 'totalPrice' }]

        if (this.reportType === 1)
            this.productInventories$.subscribe(items => items.forEach(element => {
                qty = qty + 1;
                unitprice = unitprice + element.unitPrice
                totalprice = totalprice + element.totalPrice
                tableData.push([
                    element.warehouseName, element.fullName, element.productCode
                    , this.transformDecimal(element.initialUnitPrice), this.transformDecimal(element.unitPrice),
                    element.initialStock, element.stock, this.transformDecimal(element.totalPrice)
                ])
            }))
        else
            this.productInventoriesDetails$.subscribe(items => items.forEach(element => {
                qty = qty + 1;
                unitprice = unitprice + element.unitPrice;
                totalprice = totalprice + element.totalPrice;
                tableData.push([
                    element.warehouseName, element.fullName, element.productCode, element.brandName,
                    element.coverName, element.statusDescription, element.serial, this.transformDecimal(element.unitPrice),
                    element.stock, this.transformDecimal(element.totalPrice)
                ])
            }))
        if (this.reportType = 1)
            footer = [['QTY', '', '', '', '', '', qty],
            ['Unit Price', '', '', '', '', '', this.transformDecimal(unitprice).toString().concat(' IRR')],
            ['Total Price', '', '', '', '', '', this.transformDecimal(totalprice).toString().concat(' IRR')]];
        else
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
    async exportTable() {
        if (this.reportType == 1) {
            this.isLoading = true;
            const data = await this.service.getProductInventoriesForDownloadingFile(this.productInventoryInfo);
            this.isLoading = false;
            this.downloadExcelFile(of(data), null);
            this._changeDetectorRef.markForCheck();
            this.cdr.detectChanges();
        }
        else if (this.reportType == 2) {
            this.isLoading = true;
            const data = await this.service.getProductInventoryDetailsForDownloadingFile(this.productInventoryInfo);
            this.isLoading = false;
            this.downloadExcelFile(null, of(data));
            this._changeDetectorRef.markForCheck();
            this.cdr.detectChanges();
        }

    }
    downloadExcelFile(productInventories: Observable<ProductInventory[]>,
        productInventoriesDetails: Observable<ProductInventory[]>) {
        let columns: Array<ExcelHeader> = new Array<ExcelHeader>();
        let obj: Array<ProductInventory> = new Array<ProductInventory>();
        let detailObj: Array<ProductInventory> = new Array<ProductInventory>();
        let qty: number = 0;
        let InitialUnitprice: number = 0;
        let unitprice: number = 0;
        let totalprice: number = 0;
        let preReserve: number = 0;
        let reserve: number = 0;
        let initialStock: number = 0;
        let finalStock: number = 0;
        let remained: number = 0;
        let date = formatDate(new Date(), 'yyyyMMdd_hhmmss', 'en');
        let fileName: string = 'productInventory_'.concat(date.toString());
        if (this.reportType === 1) {
            columns.push({ basedColumnName: 'warehouseName', excelColumnName: 'Warehouse' });
            columns.push({ basedColumnName: 'fullName', excelColumnName: 'Product' });
            columns.push({ basedColumnName: 'productCode', excelColumnName: 'Code' });
            columns.push({ basedColumnName: 'initialUnitPrice', excelColumnName: 'Initial Unit Price' });
            columns.push({ basedColumnName: 'unitPrice', excelColumnName: 'Final Unit Price' });
            columns.push({ basedColumnName: 'initialStock', excelColumnName: 'Initial Stock' });
            columns.push({ basedColumnName: 'stock', excelColumnName: 'Final Stock' });
            columns.push({ basedColumnName: 'reserve', excelColumnName: 'Reserve' });
            columns.push({ basedColumnName: 'preReserve', excelColumnName: 'Pre Reserve' });
            columns.push({ basedColumnName: 'remained', excelColumnName: 'Remained' });
            columns.push({ basedColumnName: 'totalPrice', excelColumnName: 'Total Price' });
        }
        else {
            columns.push({ basedColumnName: 'warehouseName', excelColumnName: 'Warehouse' });
            columns.push({ basedColumnName: 'fullName', excelColumnName: 'Product' });
            columns.push({ basedColumnName: 'productCode', excelColumnName: 'Code' });
            columns.push({ basedColumnName: 'brandName', excelColumnName: 'Brand' });
            columns.push({ basedColumnName: 'coverName', excelColumnName: 'Cover' });
            columns.push({ basedColumnName: 'statusDescription', excelColumnName: 'Status' });
            columns.push({ basedColumnName: 'serial', excelColumnName: 'Serial' });
            columns.push({ basedColumnName: 'productionLocalDate', excelColumnName: 'Prodcution Date' });
            columns.push({ basedColumnName: 'orderCode', excelColumnName: 'Order' });
            columns.push({ basedColumnName: 'remittanceCode', excelColumnName: 'Remittance' });
            columns.push({ basedColumnName: 'transferCode', excelColumnName: 'Transfer' });
            columns.push({ basedColumnName: 'unitPrice', excelColumnName: 'Unit Price' });
            columns.push({ basedColumnName: 'stock', excelColumnName: 'Stock' });
            columns.push({ basedColumnName: 'totalPrice', excelColumnName: 'Total Price' });
        }
        if (this.reportType === 1)
            productInventories.subscribe(items => items.forEach(element => {
                qty = qty + 1;
                initialStock = initialStock + element.initialStock;
                finalStock = finalStock + element.stock;
                reserve = reserve + element.reserve;
                preReserve = preReserve + element.preReserve;
                remained = remained + element.remained;
                InitialUnitprice = InitialUnitprice + element.initialUnitPrice;
                unitprice = unitprice + element.unitPrice;
                totalprice = totalprice + element.totalPrice;
                obj.push(element)
            }));
        else
            productInventoriesDetails.subscribe(items => items.forEach(element => {
                qty = qty + 1;
                unitprice = unitprice + element.unitPrice;
                totalprice = totalprice + element.totalPrice;
                detailObj.push(element)
            }));


        let footerData = [];
        if (this.reportType === 1) {
            footerData.push(['', '', '', '', '', '', '', '', '', 'QTY', qty]);
            footerData.push(['', '', '', '', '', '', '', '', '', 'Initial Unit Price', initialStock.toString().concat(' IRR')]);
            footerData.push(['', '', '', '', '', '', '', '', '', 'Final Unit Price', unitprice.toString().concat(' IRR')]);
            footerData.push(['', '', '', '', '', '', '', '', '', 'Initial Stock', initialStock]);
            footerData.push(['', '', '', '', '', '', '', '', '', 'Final Stock', finalStock]);
            footerData.push(['', '', '', '', '', '', '', '', '', 'Pre Reserve', preReserve]);
            footerData.push(['', '', '', '', '', '', '', '', '', 'Reserve', reserve]);
            footerData.push(['', '', '', '', '', '', '', '', '', 'Remained', remained]);
            footerData.push(['', '', '', '', '', '', '', '', '', 'Total Price', totalprice.toString().concat(' IRR')]);
        }
        else {
            footerData.push(['', '', '', '', '', '', '', '', '', '', '', '', 'QTY', qty]);
            footerData.push(['', '', '', '', '', '', '', '', '', '', '', '', 'Unit Price', unitprice.toString().concat(' IRR')]);
            footerData.push(['', '', '', '', '', '', '', '', '', '', '', '', 'Total Price', totalprice.toString().concat(' IRR')]);
        }
        if (this.reportType === 1)
            this.excelService.exportAsExcelFile('Product Inventory', '', columns, obj, footerData, fileName, 'Sheet1');
        else
            this.excelService.exportAsExcelFile('Product Inventory Details', '', columns, detailObj, footerData, fileName, 'Sheet1');


        obj = [];
        detailObj = [];
    }


    public resetAdvancedSearch() {
        this.frmAdvancedSearch.controls["reportType"].setValue(1);
        this.frmAdvancedSearch.controls["productType"].setValue('');
        this.frmAdvancedSearch.controls["status"].setValue(this.defaultStatuses);
        this.frmAdvancedSearch.controls["warehouse"].setValue(null);
        this.frmAdvancedSearch.controls["brand"].setValue(null);
        this.frmAdvancedSearch.controls["cover"].setValue(null);
        this.frmAdvancedSearch.controls["creditTo"].setValue(null);
        this.frmAdvancedSearch.controls["productCode"].setValue(null);
        this.frmAdvancedSearch.controls["productName"].setValue(null);
        this.frmAdvancedSearch.controls["serial"].setValue(null);
        this.frmAdvancedSearch.controls["initialUnitPriceFrom"].setValue(null);
        this.frmAdvancedSearch.controls["initialUnitPriceTo"].setValue(null);
        this.frmAdvancedSearch.controls["finalUnitPriceFrom"].setValue(null);
        this.frmAdvancedSearch.controls["finalUnitPriceTo"].setValue(null);
        this.frmAdvancedSearch.controls["initialStockFrom"].setValue(null);
        this.frmAdvancedSearch.controls["initialStockTo"].setValue(null);
        this.frmAdvancedSearch.controls["finalStockFrom"].setValue(null);
        this.frmAdvancedSearch.controls["finalStockTo"].setValue(null);
    }

    /* handlePageEvent(event: PageEvent) {

        this.pagination.length = event.length;
        this.pagination.pageSize = event.pageSize;
        this.pagination.pageNumber = event.pageIndex + 1;
        this.pagination.flag = false;
        if (this.reportType == 1) {
            this.productInventoryInfo.page = this.pagination;
            this.getProductInventory(this.productInventoryInfo);
        }
        else {
            this.productInventoryInfo.page = this.pagination;
            this.getProductInventoryDetails(this.productInventoryInfo);
        }
    } */
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }



    transformDecimal(num) {
        return num == 0 ? 0 : this._decimalPipe.transform(num, '1.0-5');
    }



}




