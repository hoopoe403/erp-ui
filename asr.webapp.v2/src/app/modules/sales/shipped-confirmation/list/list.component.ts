import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { Subject, merge, Observable, forkJoin, fromEvent } from 'rxjs';
import { debounceTime, switchMap, map, distinctUntilChanged } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';
import { fuseAnimations } from "../../../../../@fuse/animations";
import { ShippedConfirmationService } from "../shipped-confirmation.service";
import { CustomerOrder, CustomerOrderDetail } from "../../order/order.types";
import { Paging } from 'app/core/type/paging/paging.type';
import { FormControl, FormGroup } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
import { KeyValue } from 'app/core/type/key-value/key-value.type';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { DecimalPipe, formatDate } from '@angular/common';
import { ExcelService } from 'app/shared/excel/excel.service';
import { ExcelHeader } from 'app/shared/excel/excel.types';
import { FuseAlertService } from '@fuse/components/alert';
import { OpResult } from 'app/core/type/result/result.types';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FinancialYear } from 'app/modules/financial/shared/financial.types';
import { Organization } from 'app/modules/configuration/organization/organization/organization.types';
@Component({
    selector: 'shipped-list',
    templateUrl: './list.component.html',
    styles: [
        /* language=SCSS */
        `
            .shipped-list-grid2 {
                grid-template-columns:30px 150px auto 100px 100px 140px 140px 140px 140px 70px;

                @screen sm {
                    grid-template-columns:112px auto 100px 70px;
                }

                @screen md {
                    grid-template-columns: 112px auto 150px 370px 150px 70px;
                }

                @screen lg {
                    grid-template-columns:30px 150px auto 100px 100px 140px 140px 140px 140px 70px;
                }
                @screen print{
                    grid-template-columns: 112px 370px 370px 70px;
                }
            }
        `
        ,
        `
        .shipped-list-detail-grid {
            grid-template-columns:150px 250px auto 140px 140px 140px 140px 70px;

            @screen sm {
                grid-template-columns:auto  100px 100px 100px 100px 70px;
            }

            @screen md {
                grid-template-columns: auto  100px 100px 100px 100px 70px;
            }

            @screen lg {
                grid-template-columns:150px 250px auto 140px 140px 140px 140px 70px;
            }
            @screen print{
                grid-template-columns: 150px 250px auto 140px 140px 140px 70px;
            }
        }
    `
    ],
    animations: fuseAnimations,
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShippedListComponent implements OnInit, OnDestroy {
    financialYears: Array<FinancialYear>;
    organizations: Array<Organization>;
    subPartitionKeyList: Array<number> = [];
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
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;
    pagination: Paging;
    selection = new SelectionModel<any>(true, []);
    shippedInfo: CustomerOrder;
    shippedDetailInfo: CustomerOrderDetail;
    filteredItemsCount: number = 0;
    statuses = [];
    reportType: number;
    defaultStatuses = [];
    _result: OpResult = new OpResult();
    frmAdvancedSearch = new FormGroup({
        reportType: new FormControl(),
        organization: new FormControl(),
        year: new FormControl([]),
        status: new FormControl([1000050]),
        productType: new FormControl([]),
        remittanceCode: new FormControl(),
        orderCode: new FormControl(),
        customerNameFamily: new FormControl(),
        dateFrom: new FormControl(),
        dateTo: new FormControl(),
        primeCostFrom: new FormControl(),
        primeCostTo: new FormControl(),
        customerType: new FormControl([]),
    });


    searchInputControl: FormControl = new FormControl();

    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
    @ViewChild('selectFrameCover') selectFrameCover: MatSelect;
    @ViewChild('selectPanelCover') selectPanelCover: MatSelect;
    @ViewChild('selectBrand') selectBrand: MatSelect;
    @ViewChild('filter', { static: true }) filter: ElementRef;

    // Private
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    isLoading: boolean;

    constructor(private service: ShippedConfirmationService,
        private excelService: ExcelService, private _decimalPipe: DecimalPipe,
        private cdr: ChangeDetectorRef,
        private snack: MatSnackBar,
        private _fuseAlertService: FuseAlertService,
        private _changeDetectorRef: ChangeDetectorRef) {
        //this._unsubscribeAll = new Subject();
        this.shippedInfo = new CustomerOrder;
        this.shippedInfo.statusIdList = [];
        this.shippedInfo.orderIdList = [];
        this.shippedDetailInfo = new CustomerOrderDetail;
        this.shippedDetailInfo.statusIdList = [];
        this.shippedDetailInfo.orderIdList = [];
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------
    isOverlayOpen: boolean = true;
    selectedInfoRow: CustomerOrder = new CustomerOrder();

    shippedList: Array<CustomerOrder> = [];
    shippedListDetail: Array<CustomerOrderDetail> = [];
    /**
     * On init
     */
    get shippedList$(): Observable<CustomerOrder[]> {
        return this.service.shippedList$;
    }
    get shippedListDetail$(): Observable<CustomerOrderDetail[]> {
        return this.service.shipedListDetail$;
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
                if (this.reportType == 1)
                    if (!this.shippedList)
                        return;
                    else
                        if (!this.shippedListDetail)
                            return;

                if (this.reportType == 1)
                    this.shippedList$.pipe(map(items => items.filter(x =>
                        x.remittanceCode.includes(this.filter.nativeElement.value) ||
                        x.customerNameFamily.toLowerCase().includes(this.filter.nativeElement.value) ||
                        x.orderTypeName.toLowerCase().includes(this.filter.nativeElement.value) ||
                        x.warehouseName.toLowerCase().includes(this.filter.nativeElement.value) ||
                        x.rowQuantity.toString().includes(this.filter.nativeElement.value) ||
                        x.productQuantity.toString().includes(this.filter.nativeElement.value) ||
                        x.statusDesc.toLowerCase().includes(this.filter.nativeElement.value)))).subscribe(element => {
                            this.shippedList = element as CustomerOrder[];
                            this._changeDetectorRef.markForCheck();
                            this.cdr.detectChanges();
                        });
                else
                    this.shippedListDetail$.pipe(map(items => items.filter(x =>
                        x.remittanceCode.includes(this.filter.nativeElement.value) ||
                        x.customerNameFamily.toLowerCase().includes(this.filter.nativeElement.value) ||
                        x.orderTypeName.toLowerCase().includes(this.filter.nativeElement.value) ||
                        x.warehouseName.toLowerCase().includes(this.filter.nativeElement.value) ||
                        x.rowQuantity.toString().includes(this.filter.nativeElement.value) ||
                        x.productQuantity.toString().includes(this.filter.nativeElement.value) ||
                        x.statusDesc.toLowerCase().includes(this.filter.nativeElement.value)))).subscribe(element => {
                            this.shippedListDetail = element as CustomerOrderDetail[];
                            this._changeDetectorRef.markForCheck();
                            this.cdr.detectChanges();
                        });
            })




        this.loadData();

        this.service.shippedList$.forEach(items => {
            this.filteredItemsCount = items?.length
        })
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
                        this.shippedInfo.page = this.pagination;
                        return this.service.getShippedList(this.shippedInfo);
                    }
                    else {
                        this.shippedDetailInfo.page = this.pagination;
                        return this.service.getShippedListDetail(this.shippedDetailInfo);
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
        this.service.disposeShippedList$();
        this.service.disposeShippedListDetail$();
        this.service.disponsePaginator$();

    }
    private setForkJoinValues(values: Array<any>): void {
        this.defaultStatuses.push(1000050);
        this.frmAdvancedSearch.controls["status"].setValue(this.defaultStatuses);
        this.shippedList = values[0].data.orders;
        this.productTypes = values[1].data;
        this.financialYears = values[2].data;
        this.organizations = values[3].data;
        this.customerTypes = values[4].data;
        this.subPartitionKeyList.push(this.financialYears.filter(x => x.isCurrent === 1)[0].partitionKey);
        this.frmAdvancedSearch.controls['year'].setValue(this.subPartitionKeyList);
        this.frmAdvancedSearch.controls['organization'].setValue(1000010);
        this.frmAdvancedSearch.controls['organization'].disable();
        this._changeDetectorRef.markForCheck();
        this.frmAdvancedSearch.controls["reportType"].setValue(1);
        this.cdr.detectChanges();
        this.setPaginatorAndSort();
    }
    private loadData(): void {
        this.getBrands();
        this.getCovers();
        forkJoin(
            this.getShippedListOnInit(),
            this.getDrpProductType(),
            this.getFinancialYears(),
            this.getOrganizations(),
            this.getDrpCCustomerType(),
        ).subscribe(res => {
            this.setForkJoinValues(res);
            this.isLoading = false;
            this.cdr.detectChanges();
        });
    }
    private getFinancialYears(): Observable<any> {
        return this.service.getFinancialYears();
    }
    private getOrganizations(): Observable<any> {
        return this.service.getDroOrganization();
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
    private getDrpProductType(): Observable<any> {
        return this.service.getDrpProductType();
    }
    private getDrpCCustomerType(): Observable<any> {
        return this.service.getDrpCustomerType();
    }
    setStatusValue(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            if (event.source.value != 0 && event.source.selected) {
                this.shippedDetailInfo.statusIdList.push(event.source.value);

            }
            else if (event.source.value != 0 && !event.source.selected) {
                const index: number = this.shippedDetailInfo.statusIdList.indexOf(event.source.value);
                if (index !== -1)
                    this.shippedDetailInfo.statusIdList.splice(index, 1);
                this.frmAdvancedSearch.controls["status"].setValue(this.shippedDetailInfo.statusIdList);
            }
        }
        // }




    }
    private getShippedList(shippedInfo: CustomerOrder) {
        this.isLoading = true;
        this.service.getShippedList(shippedInfo)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((shippedList: any) => {
                this.reportType = this.frmAdvancedSearch.controls['reportType'].value;
                this.shippedListDetail = [];
                this.shippedList = shippedList.data.orders;
                this._changeDetectorRef.markForCheck();
                this.isLoading = false;
                this.cdr.detectChanges();
            });
    }

    private getShippedListDetail(shippedDetailInfo: CustomerOrderDetail) {
        this.isLoading = true;
        this.service.getShippedListDetail(shippedDetailInfo)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((shippedListDetail: any) => {
                this.reportType = this.frmAdvancedSearch.controls['reportType'].value;
                this.shippedList = [];
                this.shippedListDetail = shippedListDetail.data.orders;
                this._changeDetectorRef.markForCheck();
                this.isLoading = false;
                this.cdr.detectChanges();
            });
    }

    private getShippedListOnInit(): Observable<any> {
        this.pagination = new Paging();
        this.pagination.flag = true;
        this.pagination.length = 0;
        this.pagination.order = 'desc';
        this.pagination.pageNumber = 1;
        this.pagination.pageSize = 100;
        this.pagination.sort = '';
        this.shippedInfo.page = this.pagination;
        return this.service.getShippedListInOnInit(this.shippedInfo);
    }
    public shippedListSearch() {
        this.pagination.flag = true;
        this.pagination.pageNumber = 1;
        this.pagination.length = 0;
        this.pagination.sort = '';
        this.pagination.order = 'asc';
        if (this.frmAdvancedSearch.controls['reportType'].value === 1) {
            this.shippedInfo.remittanceCode = this.frmAdvancedSearch.controls['remittanceCode'].value;
            this.shippedInfo.orderCode = this.frmAdvancedSearch.controls['orderCode'].value;
            this.shippedInfo.customerNameFamily = this.frmAdvancedSearch.controls['customerNameFamily'].value;
            this.shippedInfo.localFromDate = this.frmAdvancedSearch.controls['dateFrom'].value;
            this.shippedInfo.localToDate = this.frmAdvancedSearch.controls['dateTo'].value;
            this.shippedInfo.totalPrimeCostFrom = this.frmAdvancedSearch.controls['primeCostFrom'].value;
            this.shippedInfo.totalPrimeCostTo = this.frmAdvancedSearch.controls['primeCostTo'].value;
            this.shippedInfo.organizationId = this.frmAdvancedSearch.controls['organization'].value;
            this.shippedInfo.statusIdList = this.frmAdvancedSearch.controls['status'].value;
            this.shippedInfo.page = this.pagination;
            this.shippedInfo.orderIdList = [];
            this.shippedInfo.subPartitionKeyList = this.subPartitionKeyList;
            this.getShippedList(this.shippedInfo);
        } else {
            this.shippedDetailInfo.remittanceCode = this.frmAdvancedSearch.controls['remittanceCode'].value;
            this.shippedDetailInfo.orderCode = this.frmAdvancedSearch.controls['orderCode'].value;
            this.shippedDetailInfo.customerNameFamily = this.frmAdvancedSearch.controls['customerNameFamily'].value;
            this.shippedDetailInfo.localFromDate = this.frmAdvancedSearch.controls['dateFrom'].value;
            this.shippedDetailInfo.localToDate = this.frmAdvancedSearch.controls['dateTo'].value;
            this.shippedDetailInfo.primeCostFrom = this.frmAdvancedSearch.controls['primeCostFrom'].value;
            this.shippedDetailInfo.primeCostTo = this.frmAdvancedSearch.controls['primeCostTo'].value;
            this.shippedDetailInfo.organizationId = this.frmAdvancedSearch.controls['organization'].value;
            this.shippedDetailInfo.statusIdList = this.frmAdvancedSearch.controls['status'].value;
            this.shippedDetailInfo.productTypeIdList = this.shippedInfo.productTypeIdList;
            this.shippedDetailInfo.customerTypeIdList = this.shippedInfo.customerTypeIdList;
            this.shippedDetailInfo.page = this.pagination;
            this.shippedDetailInfo.orderIdList = [];
            this.shippedDetailInfo.subPartitionKeyList = this.subPartitionKeyList;
            this.getShippedListDetail(this.shippedDetailInfo);
        }
    }


    public resetAdvancedSearch() {
        this.frmAdvancedSearch.controls["reportType"].setValue(1);
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

        if (this.reportType === 1) {
            this.shippedInfo.page = this.pagination;
            this.getShippedList(this.shippedInfo);
        } else {
            this.shippedDetailInfo.page = this.pagination;
            this.getShippedListDetail(this.shippedDetailInfo)
        }

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

            this.shippedInfo.frameCoverIdList = this.selectedFrameCover;
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

            this.shippedInfo.panelCoverIdList = this.selectedPanelCover;
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

        this.shippedInfo.brandIdList = this.selectedBrand;
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
    setFinancialYearValue(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            if (event.source.selected)
                this.subPartitionKeyList.push(event.source.value);
            else if (!event.source.selected) {
                const index: number = this.subPartitionKeyList.indexOf(event.source.value);
                if (index !== -1)
                    this.subPartitionKeyList.splice(index, 1);
                this.frmAdvancedSearch.controls["year"].setValue(this.subPartitionKeyList);
            }
        }


    }

    setOrganizationValue(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {




    }
    private downloadExcelFile(data: Observable<CustomerOrder[]>, detailData: Observable<CustomerOrderDetail[]>) {
        let columns: Array<ExcelHeader> = new Array<ExcelHeader>();
        let obj: Array<CustomerOrder> = new Array<CustomerOrder>();
        let detailObj: Array<CustomerOrderDetail> = new Array<CustomerOrderDetail>();
        let total: number = 0;
        let totalPrimeCost: number = 0;
        let qty: number = 0;
        let products: number = 0;
        let date = formatDate(new Date(), 'yyyyMMdd_hhmmss', 'en');
        let fileName: string = 'Shipped_'.concat(date.toString());
        if (this.reportType === 1) {
            columns.push({ basedColumnName: 'orderCode', excelColumnName: 'Order' });
            columns.push({ basedColumnName: 'remittanceCode', excelColumnName: 'Remittance' });
            columns.push({ basedColumnName: 'customerNameFamily', excelColumnName: 'Customer' });
            columns.push({ basedColumnName: 'orderTypeName', excelColumnName: 'Order Type' });
            columns.push({ basedColumnName: 'customerTypeName', excelColumnName: 'Customer Type' });
            columns.push({ basedColumnName: 'warehouseName', excelColumnName: 'Warehouse' });
            columns.push({ basedColumnName: 'rowQuantity', excelColumnName: 'Rows' });
            columns.push({ basedColumnName: 'productQuantity', excelColumnName: 'Products' });
            columns.push({ basedColumnName: 'total', excelColumnName: 'Total' });
            columns.push({ basedColumnName: 'totalPrimeCost', excelColumnName: 'Total Prime Cost' });
            columns.push({ basedColumnName: 'localChangeDate', excelColumnName: 'Date' });
        }
        else {
            columns.push({ basedColumnName: 'orderCode', excelColumnName: 'Order' });
            columns.push({ basedColumnName: 'remittanceCode', excelColumnName: 'Remittance' });
            columns.push({ basedColumnName: 'customerNameFamily', excelColumnName: 'Customer' });
            columns.push({ basedColumnName: 'orderTypeName', excelColumnName: 'Order Type' });
            columns.push({ basedColumnName: 'customerTypeName', excelColumnName: 'Customer Type' });
            columns.push({ basedColumnName: 'warehouseName', excelColumnName: 'Warehouse' });
            columns.push({ basedColumnName: 'productName', excelColumnName: 'Product' });
            columns.push({ basedColumnName: 'productCode', excelColumnName: 'Code' });
            columns.push({ basedColumnName: 'brandName', excelColumnName: 'Brand' });
            columns.push({ basedColumnName: 'frameCoverName', excelColumnName: 'Frame Cover' });
            columns.push({ basedColumnName: 'panelCoverName', excelColumnName: 'Panel Cover' });
            columns.push({ basedColumnName: 'price', excelColumnName: 'price' });
            columns.push({ basedColumnName: 'total', excelColumnName: 'Total' });
            columns.push({ basedColumnName: 'primeCost', excelColumnName: 'Prime Cost' });
            columns.push({ basedColumnName: 'totalPrimeCost', excelColumnName: 'Total Prime Cost' });
            columns.push({ basedColumnName: 'localChangeDate', excelColumnName: 'Date' });
        }

        if (this.reportType === 1)
            data.subscribe(items => items.forEach(element => {
                qty = qty + 1;
                products = products + element.productQuantity;
                total = total + element.total;
                totalPrimeCost = totalPrimeCost + element.totalPrimeCost;
                obj.push(element);

            }));
        else
            detailData.subscribe(items => items.forEach(element => {
                qty = qty + 1;
                products = products + 1;
                total = total + element.total;
                totalPrimeCost = totalPrimeCost + element.primeCost;
                detailObj.push(element);
            }));


        let footerData = [];
        if (this.reportType === 1) {

            footerData.push(['', '', '', '', '', '', '', '', '', 'QTY', qty]);
            footerData.push(['', '', '', '', '', '', '', '', '', 'PRODUCTS', products]);
            footerData.push(['', '', '', '', '', '', '', '', '', 'TOTAL', total.toString().concat(' IRR')]);
            footerData.push(['', '', '', '', '', '', '', '', '', 'PRIME COST', totalPrimeCost.toString().concat(' IRR')]);
        }
        else {

            footerData.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '', 'QTY', qty]);
            footerData.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '', 'PRODUCTS', products]);
            footerData.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '', 'TOTAL', total.toString().concat(' IRR')]);
            footerData.push(['', '', '', '', '', '', '', '', '', '', '', 'PRIME COST', totalPrimeCost.toString().concat(' IRR')]);
        }
        if (this.reportType === 1)
            this.excelService.exportAsExcelFile('Shipped', '', columns, obj, footerData, fileName, 'Sheet1');
        else
            this.excelService.exportAsExcelFile('Shipped', '', columns, detailObj, footerData, fileName, 'Sheet1');

        obj = [];
        detailObj = [];
    }

    exportTable() {
        if (this.reportType == 1) {
            this.isLoading = true;
            this.isLoading = false;
            this.downloadExcelFile(this.shippedList$, null);
        }
        else if (this.reportType == 2) {
            this.isLoading = true;
            this.isLoading = false;
            this.downloadExcelFile(null, this.shippedListDetail$);
        }

        this._changeDetectorRef.markForCheck();
        this.cdr.detectChanges();

    }
    download() {

        var pdf = new jsPDF('l');
        pdf.setFontSize(20);
        pdf.text('Shipped', 14, 8);

        pdf.setFontSize(12);
        pdf.setTextColor(99);
        let header = [];
        let tableData = [];
        let footer = [];
        let total: number = 0;
        let totalPrimeCost: number = 0;
        let qty: number = 0;
        let products: number = 0;
        let date = formatDate(new Date(), 'yyyyMMdd_hhmmss', 'en');
        let fileName: string = 'Shipped_'.concat(date.concat('.pdf'));

        header = [{ header: 'Account', dataKey: 'orderCode' },
        { header: 'Account Type', dataKey: 'remittanceCode' },
        { header: 'Customer', dataKey: 'customerNameFamily' },
        { header: 'Order Type', dataKey: 'orderTypeName' },
        { header: 'Warehouse', dataKey: 'warehouseName' },
        { header: 'Rows', dataKey: 'rowQuantity' },
        { header: 'Producs', dataKey: 'productQuantity' },
        { header: 'Total', dataKey: 'total' },
        { header: 'Prime Cost', dataKey: 'totalPrimeCost' },
        { header: 'Date', dataKey: 'localChangeDate' }];



        this.shippedList$.subscribe(items => items.forEach(element => {
            qty = qty + 1;
            products = products + element.productQuantity;
            total = total + element.total;
            totalPrimeCost = totalPrimeCost + element.totalPrimeCost;
            tableData.push([
                element.orderCode, element.remittanceCode, element.customerNameFamily, element.orderTypeName,
                element.warehouseName, element.rowQuantity, element.productQuantity, this.transformDecimal(element.total),
                this.transformDecimal(element.totalPrimeCost), element.localChangeDate,
            ]);
        }));



        footer = [['QTY', '', '', '', '', '', '', '', '', qty.toString()],
        ['PRODUCTS', '', '', '', '', '', '', '', '', products.toString()],
        ['TOTAL', '', '', '', '', '', '', '', '', this.transformDecimal(total).toString().concat(' IRR')],
        ['PRIME COST', '', '', '', '', '', '', '', '', this.transformDecimal(totalPrimeCost).toString().concat(' IRR')]];


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
    transformDecimal(num) {
        return num === 0 ? 0 : this._decimalPipe.transform(num, '1.0-5');
    }


    toggleAllSelectedItem() {
        if (this.shippedInfo.orderIdList.length === this.filteredItemsCount)
            this.shippedInfo.orderIdList = []
        else {
            this.shippedInfo.orderIdList = []
            this.shippedList$.pipe(map(items => items)).subscribe(element => {
                for (let i = 0; i < element.length; i++)
                    this.shippedInfo.orderIdList.push(element[i].orderId)
                this.cdr.markForCheck();
                this.cdr.detectChanges();
            });
        }
    }

    selectAllIsChecked(): boolean {
        if (this.shippedInfo.orderIdList.length > 0 &&
            this.shippedInfo.orderIdList.length === this.filteredItemsCount &&
            !this.isLoading)
            return true;
        else
            return false;
    }

    selectAllIsIndeterminate(): boolean {
        if (this.shippedInfo.orderIdList.length > 0 &&
            this.shippedInfo.orderIdList.length < this.filteredItemsCount &&
            !this.isLoading)
            return true;
        else
            return false;
    }

    toggleSelectedItem(orderId: number): void {
        const index = this.shippedInfo.orderIdList.findIndex(x => x === orderId)
        if (index === -1)
            this.shippedInfo.orderIdList.push(orderId)
        else
            this.shippedInfo.orderIdList.splice(index, 1)
    }

    checkSelectedItem(orderId: number): boolean {
        return this.shippedInfo.orderIdList.findIndex(x => x === orderId) > -1;
    }

    disabledConfirm() {
        if (this.shippedInfo.orderIdList.length > 1)
            return true
        else
            return false
    }

    private showAlert(name: string): void {
        this._fuseAlertService.show(name);
    }

    private dismissAlert(name: string): void {
        this._fuseAlertService.dismiss(name);
    }

    confirm() {
        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');
        this.service.confirmByList(this.shippedInfo).subscribe(res => {
            this.isLoading = false;
            this._result.succeed = res.succeed;
            this._result.message = res.message;
            if (this._result.succeed)
                this.showAlert('successMessage');
            else
                this.showAlert('errorMessage');
            this.cdr.detectChanges();
        });
    }

    confirmByList() {
        this.isLoading = true;
        this.service.confirmByList(this.shippedInfo).subscribe(res => {
            this.snack.open(res.message, null, { duration: 5000 });
            if (res.succeed)
                this.shippedListSearch();
        });
    }


}


