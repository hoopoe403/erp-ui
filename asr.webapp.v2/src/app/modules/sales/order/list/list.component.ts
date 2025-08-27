import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { Subject, merge, Observable, forkJoin } from 'rxjs';
import { debounceTime, switchMap, map, distinctUntilChanged } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';
import { fuseAnimations } from "../../../../../@fuse/animations";
import { OrderService } from "../order.service";
import { CustomerOrder, CustomerOrderDetail } from "../order.types";
import { Paging } from 'app/core/type/paging/paging.type';
import { FormControl, FormGroup } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
import { KeyValue } from 'app/core/type/key-value/key-value.type';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
@Component({
    selector: 'orders-list',
    templateUrl: './list.component.html',
    styles: [
        /* language=SCSS */
        `
            .orders-grid {
                grid-template-columns: 150px auto 100px 100px 150px 200px 70px;

                @screen sm {
                    grid-template-columns:112px auto 100px 70px;
                }

                @screen md {
                    grid-template-columns: 112px auto 150px 370px 150px 70px;
                }

                @screen lg {
                    grid-template-columns: 150px auto 100px 100px 150px 200px 70px;
                }
                @screen print{
                    grid-template-columns: 112px 370px 370px 70px;
                }
            }
        `,
        `
            .orders-detail-grid {
                grid-template-columns:112px auto 40px;

                @screen sm {
                    grid-template-columns:112px auto 100px 70px;
                }

                @screen md {
                    grid-template-columns: 112px auto 150px 370px 150px 70px;
                }

                @screen lg {
                    grid-template-columns: 150px 250px auto 150px 200px 70px;
                }
                @screen print{
                    grid-template-columns: 112px 370px 370px 70px;
                }
            }
        `
    ],
    animations: fuseAnimations,
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderListComponent implements OnInit, OnDestroy {

    reportType: number;
    selectedFrameCover = [];
    selectedPanelCover = [];
    selectedBrand = [];
    allFrameCoversSelected = false;
    allPanelCoversSelected = false;
    allBrandsSelected = false;
    brands: Array<KeyValue> = [];
    panelCovers = [];
    frameCovers = [];
    productTypes: any = [];
    customerTypes: any = [];
    protected _onDestroy = new Subject<void>();
    @ViewChild('paginator') _paginator: MatPaginator;
    @ViewChild('sort') private _sort: MatSort;
    @ViewChild('paginatorDetail') _paginatorDetail: MatPaginator;
    @ViewChild('sortDetail') private _sortDetail: MatSort;
    pagination: Paging;
    selection = new SelectionModel<any>(true, []);
    orderInfo: CustomerOrder;
    orderDetailInfo: CustomerOrderDetail;
    statuses = [];
    defaultStatuses = [];
    frmAdvancedSearch = new FormGroup({
        reportType: new FormControl(),
        orderType: new FormControl(0),
        status: new FormControl(),
        brand: new FormControl(),
        productCode: new FormControl(),
        productName: new FormControl(),
        frameCover: new FormControl(),
        panelCover: new FormControl(),
        remittanceCode: new FormControl(),
        orderCode: new FormControl(),
        customerNameFamily: new FormControl(),
        productType: new FormControl([]),
        customerType: new FormControl([]),
    });


    searchInputControl: FormControl = new FormControl();

    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
    @ViewChild('selectFrameCover') selectFrameCover: MatSelect;
    @ViewChild('selectPanelCover') selectPanelCover: MatSelect;
    @ViewChild('selectBrand') selectBrand: MatSelect;

    // Private
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    isLoading: boolean;

    constructor(private service: OrderService,
        private cdr: ChangeDetectorRef,
        private _changeDetectorRef: ChangeDetectorRef) {
        //this._unsubscribeAll = new Subject();
        this.orderInfo = new CustomerOrder();
        this.orderDetailInfo = new CustomerOrderDetail();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------
    isOverlayOpen: boolean = true;
    selectedInfoRow: CustomerOrder = new CustomerOrder();

    orders: Array<CustomerOrder> = [];
    ordersDetails: Array<CustomerOrderDetail> = [];
    
    // Chat related properties
    isChatOpen: boolean = false;
    /**
     * On init
     */
    get orders$(): Observable<CustomerOrder[]> {
        return this.service.orders$;
    }
    get ordersDetails$(): Observable<CustomerOrderDetail[]> {
        return this.service.ordersDetails$;
    }
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


        this.searchInputControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(150),
                distinctUntilChanged()
            )
            .subscribe(() => {
                if (!this.orders$)
                    return;
                let value: string = this.searchInputControl.value.toLowerCase();
                if (this.reportType == 1)
                    this.orders$.subscribe(items => {
                        this.orders = items.filter(x => x.orderCode.includes(value)
                            || x.remittanceCode.includes(value)
                            || x.customerNameFamily.toLowerCase().includes(value)
                            || x.regLocalDate.includes(value)
                            || x.orderTypeName.toLowerCase().includes(value)
                            || x.warehouseName.toLowerCase().includes(value)
                            || x.rowQuantity.toString().includes(value)
                            || x.productQuantity.toString().includes(value)
                            || x.statusDesc.toLowerCase().includes(value));
                        this.cdr.detectChanges();
                    })
                else
                    this.ordersDetails$.subscribe(items => {
                        this.ordersDetails = items.filter(x => x.orderCode.includes(value)
                            || x.remittanceCode.includes(value)
                            || x.customerNameFamily.toLowerCase().includes(value)
                            || x.regLocalDate.includes(value)
                            || x.orderTypeName.toLowerCase().includes(value)
                            || x.warehouseName.toLowerCase().includes(value)
                            || x.productName.toLowerCase().includes(value)
                            || x.productCode.toLowerCase().includes(value)
                            || x.statusDesc.toLowerCase().includes(value));
                        this.cdr.detectChanges();
                    })


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
                    this.orderInfo.page = this.pagination;
                    return this.service.getOrders(this.orderInfo);


                }),
                map(() => {
                    this.isLoading = false;
                    this._changeDetectorRef.markForCheck();
                    this.cdr.detectChanges();
                })
            ).subscribe(res => {
                this._changeDetectorRef.markForCheck();
                this.cdr.detectChanges();
            });
        }
    }

    private setDetailPaginatorAndSort(): void {
        if (this._sortDetail && this._paginatorDetail) {
            // Set the initial sort
            this._sortDetail.sort({
                id: '',
                start: 'desc',
                disableClear: true
            });

            // Mark for check
            this._changeDetectorRef.markForCheck();

            // If the user changes the sort order...
            this._sortDetail.sortChange
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe(() => {
                    // Reset back to the first page
                    this._paginatorDetail.pageIndex = 0;


                });

            // Get products if sort or page changes
            merge(this._sortDetail.sortChange, this._paginatorDetail.page).pipe(
                switchMap(() => {
                    this.isLoading = true;
                    this.pagination.order = this._sortDetail.direction;
                    this.pagination.sort = this._sortDetail.active;
                    this.orderDetailInfo.page = this.pagination;
                    return this.service.getOrderDetails(this.orderDetailInfo);

                }),
                map(() => {
                    this.isLoading = false;
                    this._changeDetectorRef.markForCheck();
                    this.cdr.detectChanges();
                })
            ).subscribe(res => {
                this._changeDetectorRef.markForCheck();
                this.cdr.detectChanges();
            });
        }
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
        this.service.disposeOrders$();
        this.service.disposeOrdersDetails$();
        this.service.disposePaginator$();

    }
    private setForkJoinValues(values: Array<any>): void {
        this.statuses = values[0].data;
        this.defaultStatuses = [];
        this.statuses.forEach(element => {
            if (element.isDefault === 1)
                this.defaultStatuses.push(element.statusId);
        });
        this.changeReportType({
            isUserInput: true,
            source: { value: 1, selected: true }
        });
        this.frmAdvancedSearch.controls["status"].setValue(this.defaultStatuses);
        this.orderInfo.statusIdList = this.defaultStatuses;
        this.orders = values[1].data.orders;
        this.productTypes = values[2].data;
        this.customerTypes = values[3].data;
        this._changeDetectorRef.markForCheck();
        this.cdr.detectChanges();
        this.setPaginatorAndSort();
    }
    private loadData(): void {
        this.getBrands();
        this.getCovers();
        forkJoin(
            this.getStatuses(),
            this.getOrdersOnInit(),
            this.getDrpProductType(),
            this.getDrpCustomerType(),
        ).subscribe(res => {
            this.setForkJoinValues(res);
            this.isLoading = false;
            this.cdr.detectChanges();
        });
    }
    private getDrpProductType(): Observable<any> {
        return this.service.getDrpProductType();
    }
    private getDrpCustomerType(): Observable<any> {
        return this.service.getDrpCustomerType();
    }
    private getStatuses(): Observable<any> {
        return this.service.getStatuses();
    }

    private getCovers(): void {
        this.service.getCovers().subscribe(res => {
            this.panelCovers = res.data.filter(x => x.conformityId === 1000652 || x.conformityId === 1000653);
            this.frameCovers = res.data.filter(x => x.conformityId === 1000651 || x.conformityId === 1000653);
        });
    }
    private getBrands(): void {
        this.service.getBrands().subscribe(res => {
            this.brands = res.data;
        });
    }

    setStatusValue(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            if (event.source.value != 0 && event.source.selected) {
                this.orderInfo.statusIdList.push(event.source.value);

            }
            else if (event.source.value != 0 && !event.source.selected) {
                const index: number = this.orderInfo.statusIdList.indexOf(event.source.value);
                if (index !== -1)
                    this.orderInfo.statusIdList.splice(index, 1);
                this.frmAdvancedSearch.controls["status"].setValue(this.orderInfo.statusIdList);
            }
        }


    }
    private getOrders(orderInfo: CustomerOrder) {
        this.isLoading = true;
        this.service.getOrders(orderInfo)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((orders: any) => {
                this.reportType = this.frmAdvancedSearch.controls['reportType'].value;
                this.orders = orders.data.orders;
                this.orderInfo.page = this.pagination;
                this.ordersDetails = [];
                this._changeDetectorRef.markForCheck();
                this.cdr.detectChanges();
                this.setPaginatorAndSort();
                this._changeDetectorRef.markForCheck();
                this.cdr.detectChanges();
                this.isLoading = false;
            });
    }
    private getOrdersDetails(orderDetailInfo: CustomerOrderDetail) {
        this.isLoading = true;
        this.service.getOrderDetails(orderDetailInfo)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((ordersDetails: any) => {
                this.reportType = this.frmAdvancedSearch.controls['reportType'].value;
                this.ordersDetails = ordersDetails.data.orders;
                this.orderDetailInfo.page = this.pagination;
                this.orders = [];
                this._changeDetectorRef.markForCheck();
                this.cdr.detectChanges();
                this.setDetailPaginatorAndSort();
                this._changeDetectorRef.markForCheck();
                this.cdr.detectChanges();
                this.isLoading = false;
            });
    }
    private getOrdersOnInit(): Observable<any> {
        this.pagination = new Paging();
        this.pagination.flag = true;
        this.pagination.length = 0;
        this.pagination.order = 'desc';
        this.pagination.pageNumber = 1;
        this.pagination.pageSize = 100;
        this.pagination.sort = '';
        this.orderInfo.page = this.pagination;
        return this.service.getOrdersInOnInit(this.orderInfo);
    }
    public ordersSearch() {

        this.getFormInfo();
        this.pagination = new Paging();
        this.pagination.flag = true;
        this.pagination.length = 0;
        this.pagination.order = 'desc';
        this.pagination.pageNumber = 1;
        this.pagination.pageSize = 100;
        this.pagination.sort = '';


        if (this.frmAdvancedSearch.controls['reportType'].value === 1) {
            this.orderInfo.remittanceCode = this.frmAdvancedSearch.controls['remittanceCode'].value;
            this.orderInfo.orderCode = this.frmAdvancedSearch.controls['orderCode'].value;
            this.orderInfo.frameCoverIdList = this.frmAdvancedSearch.controls['frameCover'].value;
            this.orderInfo.panelCoverIdList = this.frmAdvancedSearch.controls['panelCover'].value;
            this.orderInfo.brandIdList = this.frmAdvancedSearch.controls['brand'].value;
            this.orderInfo.customerNameFamily = this.frmAdvancedSearch.controls['customerNameFamily'].value;
            this.orderInfo.page = this.pagination;
            this.getOrders(this.orderInfo);
        } else {
            this.orderDetailInfo.productCode = this.frmAdvancedSearch.controls['productCode'].value;
            this.orderDetailInfo.productName = this.frmAdvancedSearch.controls['productName'].value;
            this.orderDetailInfo.remittanceCode = this.frmAdvancedSearch.controls['remittanceCode'].value;
            this.orderDetailInfo.orderCode = this.frmAdvancedSearch.controls['orderCode'].value;
            this.orderDetailInfo.frameCoverIdList = this.frmAdvancedSearch.controls['frameCover'].value;
            this.orderDetailInfo.panelCoverIdList = this.frmAdvancedSearch.controls['panelCover'].value;
            this.orderDetailInfo.statusIdList = this.frmAdvancedSearch.controls['status'].value;
            this.orderDetailInfo.brandIdList = this.frmAdvancedSearch.controls['brand'].value;
            this.orderDetailInfo.customerNameFamily = this.frmAdvancedSearch.controls['customerNameFamily'].value;
            this.orderDetailInfo.brandIdList = this.frmAdvancedSearch.controls['brand'].value;
            this.orderDetailInfo.productTypeIdList = this.orderDetailInfo.productTypeIdList;
            this.orderDetailInfo.customerTypeIdList = this.orderDetailInfo.customerTypeIdList;
            this.orderDetailInfo.page = this.pagination;
            this.getOrdersDetails(this.orderDetailInfo);
        }
    }


    public resetAdvancedSearch() {
        this.frmAdvancedSearch.controls["code"].setValue(null);
        this.frmAdvancedSearch.controls["name"].setValue(null);
        this.frmAdvancedSearch.controls["parentCode"].setValue(null);
        this.frmAdvancedSearch.controls["parentName"].setValue(null);
        this.frmAdvancedSearch.controls["status"].setValue(this.defaultStatuses);

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
    changeAllCovers(type: string) {
        this.setAllCovers(type);
    }
    setAllCovers(type: string) {
        if (type === 'frame') {
            if (this.allFrameCoversSelected) {
                this.selectFrameCover.options.forEach((item: MatOption) => item.select());
                this.selectedFrameCover = [];
                for (var i = 0; i < this.frameCovers.length; i++) {
                    this.selectedFrameCover.push(this.frameCovers[i]);

                }
                this.allFrameCoversSelected = true;
            } else {
                this.selectedFrameCover = [];
                this.selectFrameCover.options.forEach((item: MatOption) => item.deselect());
                this.allFrameCoversSelected = false;
            }

            this.orderInfo.frameCoverIdList = this.selectedFrameCover;
        }
        else {
            if (this.allPanelCoversSelected) {
                this.selectPanelCover.options.forEach((item: MatOption) => item.select());
                this.selectedPanelCover = [];
                for (var i = 0; i < this.panelCovers.length; i++) {
                    this.selectedPanelCover.push(this.panelCovers[i]);

                }
                this.allPanelCoversSelected = true;
            } else {
                this.selectedPanelCover = [];
                this.selectPanelCover.options.forEach((item: MatOption) => item.deselect());
                this.allPanelCoversSelected = false;
            }

            this.orderInfo.panelCoverIdList = this.selectedPanelCover;
        }
    }
    changeAllBrands() {
        this.setAllBrands();
    }
    setAllBrands() {

        if (this.allBrandsSelected) {
            this.selectBrand.options.forEach((item: MatOption) => item.select());
            this.selectedBrand = [];
            for (var i = 0; i < this.brands.length; i++) {
                this.selectedBrand.push(this.brands[i].key);

            }
            this.allBrandsSelected = true;
        } else {
            this.selectedBrand = [];
            this.selectBrand.options.forEach((item: MatOption) => item.deselect());
            this.allBrandsSelected = false;
        }

        this.orderInfo.brandIdList = this.selectedBrand;
    }
    setBrand(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {
        if (event.isUserInput)
            if (event.source.selected) {
                this.selectedBrand.push(event.source.value);
                if (this.selectedBrand.length === this.brands.length)
                    this.allBrandsSelected = true;
            }
            else {
                const indx = this.selectedBrand.findIndex(x => x.key == event.source.value);
                this.selectedBrand.splice(indx, 1);
                if (this.selectedBrand.length < this.brands.length)
                    this.allBrandsSelected = false;
            }

    }

    changeReportType(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {


        if (event.source.value === 1) {
            this.frmAdvancedSearch.controls['productCode'].setValue('');
            this.frmAdvancedSearch.controls['productName'].setValue('');
            this.frmAdvancedSearch.controls['brand'].setValue([]);
            this.frmAdvancedSearch.controls['frameCover'].setValue([]);
            this.frmAdvancedSearch.controls['panelCover'].setValue([]);
            this.frmAdvancedSearch.controls['productCode'].disable();
            this.frmAdvancedSearch.controls['productName'].disable();
            this.frmAdvancedSearch.controls['brand'].disable();
            this.frmAdvancedSearch.controls['frameCover'].disable();
            this.frmAdvancedSearch.controls['panelCover'].disable();
        }
        else {
            this.frmAdvancedSearch.controls['productCode'].enable();
            this.frmAdvancedSearch.controls['productName'].enable();
            this.frmAdvancedSearch.controls['brand'].enable();
            this.frmAdvancedSearch.controls['frameCover'].enable();
            this.frmAdvancedSearch.controls['panelCover'].enable();
        }




    }
    getFormInfo() {

        if (this.frmAdvancedSearch.valid) {
            if (this.frmAdvancedSearch.controls['orderType'].value !== 0)
                this.orderInfo.orderTypeId = this.frmAdvancedSearch.controls['orderType'].value;
            else
                this.orderInfo.orderTypeId = null;



        }


    }
    setLocalStorageValues(documnet: CustomerOrder) {
        localStorage.setItem('customerId', documnet.customerId.toString());
        localStorage.setItem('orderId', documnet.orderId.toString());
    }

    /**
     * Toggle chat panel
     */
    toggleChat(): void
    {
        this.isChatOpen = !this.isChatOpen;
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Close chat panel
     */
    closeChat(): void
    {
        this.isChatOpen = false;
        this._changeDetectorRef.markForCheck();
    }

    setSelectedCustomerId(customerId: number) {
        localStorage.setItem('customerId', customerId.toString());
    }

    /**
     * Export table to Excel
     */
    exportTable(): void {
        // Implementation for exporting to Excel
        console.log('Export table functionality to be implemented');
    }

    /**
     * Download functionality
     */
    download(): void {
        // Implementation for download functionality
        console.log('Download functionality to be implemented');
    }
}


