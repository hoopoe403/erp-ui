import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { Subject, merge, Observable, forkJoin, of } from 'rxjs';
import { debounceTime, switchMap, map, distinctUntilChanged } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';
import { fuseAnimations } from "../../../../../@fuse/animations";
import { DocumentService } from "../document.service";
import { CustomerOrder } from "../../order/order.types";
import { CustomerOrderDetail } from '../../order/order.types';
import { Paging } from 'app/core/type/paging/paging.type';
import { FormControl, FormGroup } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
import { KeyValue } from 'app/core/type/key-value/key-value.type';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import jsPDF from 'jspdf';
import { DecimalPipe, formatDate } from '@angular/common';
import { ExcelHeader } from 'app/shared/excel/excel.types';
import { ExcelService } from 'app/shared/excel/excel.service';
@Component({
    selector: 'documents-list',
    templateUrl: './list.component.html',
    styles: [
        /* language=SCSS */
        `
            .sales-documents-grid {
                grid-template-columns:150px auto 120px 100px 100px 150px 200px 70px;

                @screen sm {
                    grid-template-columns:112px auto 100px 70px;
                }

                @screen md {
                    grid-template-columns: 112px auto 150px 370px 150px 70px;
                }

                @screen lg {
                    grid-template-columns: 150px auto 120px 100px 100px 150px 200px 70px;
                }
                @screen print{
                    grid-template-columns: 112px 370px 370px 70px;
                }
            }
            `,
        `
            .sales-documents-detail-grid {
                grid-template-columns:150px 250px auto 150px 200px 70px;

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
export class DocumentListComponent implements OnInit, OnDestroy {

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
    pagination: Paging;
    paginationDetail: Paging;
    selection = new SelectionModel<any>(true, []);
    documentInfo: CustomerOrder;
    documentDetailInfo: CustomerOrderDetail;
    statuses = [];
    reportType: number;
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
        regDateFrom: new FormControl(),
        regDateTo: new FormControl(),
        productType: new FormControl([]),
        customerType: new FormControl([]),
    });


    searchInputControl: FormControl = new FormControl();

    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
    @ViewChild('selectFrameCover') selectFrameCover: MatSelect;
    @ViewChild('selectPanelCover') selectPanelCover: MatSelect;
    @ViewChild('selectBrand') selectBrand: MatSelect;

    @ViewChild('paginator') _paginator: MatPaginator;
    @ViewChild('sort') private _sort: MatSort;
    @ViewChild('paginatorDetail') _paginatorDetail: MatPaginator;
    @ViewChild('sortDetail') private _sortDetail: MatSort;

    // Private
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    isLoading: boolean;

    constructor(private service: DocumentService,
        private excelService: ExcelService,
        private cdr: ChangeDetectorRef,
        private _decimalPipe: DecimalPipe,
        private _changeDetectorRef: ChangeDetectorRef) {
        //this._unsubscribeAll = new Subject();
        this.documentInfo = new CustomerOrder();
        this.documentDetailInfo = new CustomerOrderDetail();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------
    isOverlayOpen: boolean = true;
    selectedInfoRow: CustomerOrder = new CustomerOrder();

    documents: Array<CustomerOrder> = [];
    documentsDetails: Array<CustomerOrderDetail> = [];
    /**
     * On init
     */
    get documents$(): Observable<CustomerOrder[]> {
        return this.service.documents$;
    }
    get documentsDetails$(): Observable<CustomerOrderDetail[]> {
        return this.service.documentsDetails$;
    }
    ngOnInit(): void {
        this.frmAdvancedSearch.controls["reportType"].setValue(1);
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


        this.searchInputControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(150),
                distinctUntilChanged()
            )
            .subscribe(() => {
                if (this.reportType == 1)
                    if (!this.documents$)
                        return;
                    else
                        if (!this.documentsDetails$)
                            return;

                let value: string = this.searchInputControl.value.toLowerCase();
                if (this.reportType == 1)
                    this.documents$.subscribe(items => {
                        this.documents = items.filter(x => x.orderCode.includes(value)
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
                    this.documentsDetails$.subscribe(items => {
                        this.documentsDetails = items.filter(x => x.orderCode.includes(value)
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
                this.documentInfo.page = this.pagination;
                return this.service.getDocuments(this.documentInfo);

            }),
            map(() => {
                this.isLoading = false;
                this._changeDetectorRef.markForCheck();
                this.cdr.detectChanges();
            })
        ).subscribe((res: any) => {
            this.documentsDetails = [];
            this.documentInfo.page = this.pagination;
            this._changeDetectorRef.markForCheck();
            this.cdr.detectChanges();
        });

    }

    private setDetailPaginatorAndSort(): void {
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
                this.documentDetailInfo.page = this.pagination;
                return this.service.getDocumentsDetails(this.documentDetailInfo);

            }),
            map(() => {
                this.isLoading = false;
                this._changeDetectorRef.markForCheck();
                this.cdr.detectChanges();
            })
        ).subscribe((res: any) => {
            this.isLoading = false;
            this.documents = [];
            this.documentDetailInfo.page = this.pagination;
            this._changeDetectorRef.markForCheck();
            this.cdr.detectChanges();
        });

    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
        this.service.disposeDocuments$();
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
        this.documentInfo.statusIdList = this.defaultStatuses;
        this.changeReportType({
            isUserInput: true,
            source: { value: 1, selected: true }
        });
        this.documents = values[1].data.orders;
        this.documentInfo.page = this.pagination;
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
            this.getDocumentsOnInit(),
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
                this.documentInfo.statusIdList.push(event.source.value);

            }
            else if (event.source.value != 0 && !event.source.selected) {
                const index: number = this.documentInfo.statusIdList.indexOf(event.source.value);
                if (index !== -1)
                    this.documentInfo.statusIdList.splice(index, 1);
                this.frmAdvancedSearch.controls["status"].setValue(this.documentInfo.statusIdList);
            }
        }


    }
    private getDocuments(documentInfo: CustomerOrder) {
        this.isLoading = true;
        this.service.getDocuments(documentInfo)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((documents: any) => {
                this.reportType = this.frmAdvancedSearch.controls['reportType'].value;
                this.documentsDetails = [];
                this.documents = documents.data.orders;
                this.documentInfo.page = this.pagination;
                this._changeDetectorRef.markForCheck();
                this.cdr.detectChanges();
                this.setPaginatorAndSort();
                this.isLoading = false;
                this._changeDetectorRef.markForCheck();
                this.cdr.detectChanges();
            });
    }

    private getDocumentsDetails(documentDetailInfo: CustomerOrderDetail) {
        this.isLoading = true;
        this.service.getDocumentsDetails(documentDetailInfo)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((documentsDetails: any) => {
                this.reportType = this.frmAdvancedSearch.controls['reportType'].value;
                this.documents = [];
                this.documentsDetails = documentsDetails.data.orders;
                this.documentDetailInfo.page = this.pagination;
                this._changeDetectorRef.markForCheck();
                this.cdr.detectChanges();
                this.setDetailPaginatorAndSort();
                this.isLoading = false;
                this._changeDetectorRef.markForCheck();
                this.cdr.detectChanges();
            });
    }

    private getDocumentsOnInit(): Observable<any> {
        this.pagination = new Paging();
        this.pagination.flag = true;
        this.pagination.length = 0;
        this.pagination.order = 'desc';
        this.pagination.pageNumber = 1;
        this.pagination.pageSize = 100;
        this.pagination.sort = '';
        this.documentInfo.page = this.pagination;
        return this.service.getDocumentsInOnInit(this.documentInfo);
    }
    public documentsSearch() {

        // this.getFormInfo();
        this.pagination.flag = true;
        this.pagination.pageNumber = 1;
        this.pagination.length = 0;
        this.pagination.sort = '';
        this.pagination.order = 'asc';
        if (this.frmAdvancedSearch.controls['reportType'].value === 1) {
            this.documentInfo.regLocalDateFrom = this.frmAdvancedSearch.controls['regDateFrom'].value;
            this.documentInfo.regLocalDateTo = this.frmAdvancedSearch.controls['regDateTo'].value;
            this.documentInfo.remittanceCode = this.frmAdvancedSearch.controls['remittanceCode'].value;
            this.documentInfo.orderCode = this.frmAdvancedSearch.controls['orderCode'].value;
            // this.documentInfo.frameCoverIdList = this.frmAdvancedSearch.controls['frameCover'].value;
            // this.documentInfo.panelCoverIdList = this.frmAdvancedSearch.controls['panelCover'].value;
            // this.documentInfo.brandIdList = this.frmAdvancedSearch.controls['brand'].value;
            this.documentInfo.customerNameFamily = this.frmAdvancedSearch.controls['customerNameFamily'].value;
            this.documentInfo.page = this.pagination;
            this.getDocuments(this.documentInfo);
        } else {
            this.documentDetailInfo.productCode = this.frmAdvancedSearch.controls['productCode'].value;
            this.documentDetailInfo.productName = this.frmAdvancedSearch.controls['productName'].value;
            this.documentDetailInfo.remittanceCode = this.frmAdvancedSearch.controls['remittanceCode'].value;
            this.documentDetailInfo.orderCode = this.frmAdvancedSearch.controls['orderCode'].value;
            this.documentDetailInfo.frameCoverIdList = this.frmAdvancedSearch.controls['frameCover'].value;
            this.documentDetailInfo.panelCoverIdList = this.frmAdvancedSearch.controls['panelCover'].value;
            this.documentDetailInfo.statusIdList = this.frmAdvancedSearch.controls['status'].value;
            this.documentDetailInfo.brandIdList = this.frmAdvancedSearch.controls['brand'].value;
            this.documentDetailInfo.customerNameFamily = this.frmAdvancedSearch.controls['customerNameFamily'].value;
            this.documentDetailInfo.regLocalDateFrom = this.frmAdvancedSearch.controls['regDateFrom'].value;
            this.documentDetailInfo.regLocalDateTo = this.frmAdvancedSearch.controls['regDateTo'].value;
            this.documentDetailInfo.productTypeIdList = this.documentInfo.productTypeIdList;
            this.documentDetailInfo.customerTypeIdList = this.documentInfo.customerTypeIdList;
            this.documentDetailInfo.page = this.pagination;
            this.getDocumentsDetails(this.documentDetailInfo);
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

            this.documentInfo.frameCoverIdList = this.selectedFrameCover;
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

            this.documentInfo.panelCoverIdList = this.selectedPanelCover;
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

        this.documentInfo.brandIdList = this.selectedBrand;
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

        if (event.isUserInput) {
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

    }

    private downloadPdfFile(document: Observable<CustomerOrder[]>, documentDetail: Observable<CustomerOrderDetail[]>) {
        var pdf = new jsPDF('l');
        pdf.setFontSize(20);
        pdf.setFontSize(12);
        pdf.setTextColor(99);
        let header = [];
        let footer = [];
        let tableData = [];
        let total: number = 0;
        let price: number = 0;
        let qty: number = 0;
        let date = formatDate(new Date(), 'yyyyMMdd_hhmmss', 'en');
        let fileName: string = 'SalesDocuments_'.concat(date.concat('.pdf'));
        if (this.reportType === 1)
            header = [{ header: 'Order Number', datakey: 'orderCode' },
            { header: 'Customer', datakey: 'customerNameFamily' },
            { header: 'Rows', datakey: 'rowQuantity' },
            { header: 'Products', datakey: 'productQuantity' },
            { header: 'Total', datakey: 'total' },
            { header: 'Status', datakey: 'statusDesc' }]
        else
            header = [{ header: 'Order Number', datakey: 'orderCode' },
            { header: 'Customer', datakey: 'customerNameFamily' },
            { header: 'Product', datakey: 'productName' },
            { header: 'Frame Cover', datakey: 'frameCoverName' },
            { header: 'Panel Cover', datakey: 'panelCoverName' },
            { header: 'Price', datakey: 'price' },
            { header: 'Total', datakey: 'total' },
            { header: 'Status', datakey: 'statusDesc' }];
        if (this.reportType === 1)
            document.subscribe(items => items.forEach(element => {
                qty = qty + 1;
                total = total + element.total;
                tableData.push([
                    element.orderCode, element.customerNameFamily, element.rowQuantity,
                    element.productQuantity, this.transformDecimal(element.total), element.statusDesc
                ]);
            }));
        else
            documentDetail.subscribe(items => items.forEach(element => {
                qty = qty + 1;
                total = total + element.total;
                price = price + element.price;
                tableData.push([
                    element.orderCode, element.customerNameFamily, element.productName, element.panelCoverName,
                    element.frameCoverName, this.transformDecimal(element.price), this.transformDecimal(element.total), element.statusDesc
                ]);
            }));
        if (this.reportType === 1)
            footer = [['ROWS', '', '', '', '', qty],
            ['Total', '', '', '', '', this.transformDecimal(total).toString().concat(' IRR')]]
        else
            footer = [['ROWS', '', '', '', '', qty],
            ['Total', '', '', '', '', this.transformDecimal(total).toString().concat(' IRR')],
            ['Price', '', '', '', '', this.transformDecimal(price).toString().concat(' IRR')]];

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

    async download() {
        if (this.reportType == 1) {
            this.isLoading = true;
            const data = await this.service.getDocumentsForDownloadingFile(this.documentInfo);
            this.isLoading = false;
            this.downloadPdfFile(of(data), null);
            this._changeDetectorRef.markForCheck();
            this.cdr.detectChanges();
        }
        else if (this.reportType == 2) {
            this.isLoading = true;
            const data = await this.service.getDocumentsDetailForDownloadingFile(this.documentDetailInfo);
            this.isLoading = false;
            this.downloadPdfFile(null, of(data));
            this._changeDetectorRef.markForCheck();
            this.cdr.detectChanges();
        }
    }

    private downloadExcelFile(document: Observable<CustomerOrder[]>, documentDetail: Observable<CustomerOrderDetail[]>) {
        let columns: Array<ExcelHeader> = new Array<ExcelHeader>();
        let obj: Array<CustomerOrder> = new Array<CustomerOrder>();
        let detailObj: Array<CustomerOrderDetail> = new Array<CustomerOrderDetail>();
        let total: number = 0;
        let price: number = 0;
        let qty: number = 0;
        let date = formatDate(new Date(), 'yyyyMMdd_hhmmss', 'en');
        let fileName: string = 'Doument_'.concat(date.toString());
        if (this.reportType === 1) {
            columns.push({ basedColumnName: 'orderCode', excelColumnName: 'Order Number' });
            columns.push({ basedColumnName: 'customerNameFamily', excelColumnName: 'Customer' });
            columns.push({ basedColumnName: 'customerTypeName', excelColumnName: 'Customer Type' });
            columns.push({ basedColumnName: 'regLocalDate', excelColumnName: 'Register Date' });
            columns.push({ basedColumnName: 'rowQuantity', excelColumnName: 'Rows' });
            columns.push({ basedColumnName: 'productQuantity', excelColumnName: 'Products' });
            columns.push({ basedColumnName: 'total', excelColumnName: 'Total' });
            columns.push({ basedColumnName: 'statusDesc', excelColumnName: 'Status' });
        } else {
            columns.push({ basedColumnName: 'orderCode', excelColumnName: 'Order Number' });
            columns.push({ basedColumnName: 'remittanceCode', excelColumnName: 'Remitance Code' });
            columns.push({ basedColumnName: 'customerNameFamily', excelColumnName: 'Customer' });
            columns.push({ basedColumnName: 'orderTypeName', excelColumnName: 'Order Type' });
            columns.push({ basedColumnName: 'customerTypeName', excelColumnName: 'Customer Type' });
            columns.push({ basedColumnName: 'warehouseName', excelColumnName: 'Warehouse' });
            columns.push({ basedColumnName: 'productName', excelColumnName: 'Product' });
            columns.push({ basedColumnName: 'brandName', excelColumnName: 'Brand Name' });
            columns.push({ basedColumnName: 'frameCoverName', excelColumnName: 'Frame Cover' });
            columns.push({ basedColumnName: 'panelCoverName', excelColumnName: 'Panel Cover' });
            columns.push({ basedColumnName: 'quantity', excelColumnName: 'Quantity' });
            columns.push({ basedColumnName: 'price', excelColumnName: 'Price' });
            columns.push({ basedColumnName: 'total', excelColumnName: 'Total' });
            columns.push({ basedColumnName: 'statusDesc', excelColumnName: 'Status' });
        }

        if (this.reportType === 1)
            document.subscribe(item => item.forEach(element => {
                qty = qty + 1;
                total = total + element.total;
                obj.push(element)
            }));
        else
            documentDetail.subscribe(item => item.forEach(element => {
                qty = qty + 1;
                total = total + element.total;
                price = price + element.price;
                detailObj.push(element)
            }));

        let footerData = [];
        if (this.reportType === 1) {
            footerData.push(['', '', '', '', '', '', 'QTY :', qty]);
            footerData.push(['', '', '', '', '', '', 'Total :', total.toString().concat(' IRR')]);
        } else {
            footerData.push(['', '', '', '', '', '', '', '', '', '', '', '', 'QTY :', qty]);
            footerData.push(['', '', '', '', '', '', '', '', '', '', '', '', 'Total :', total.toString().concat(' IRR')]);
            footerData.push(['', '', '', '', '', '', '', '', '', '', '', '', 'Price :', price.toString().concat(' IRR')]);
        }

        if (this.reportType === 1)
            this.excelService.exportAsExcelFile('Document', '', columns, obj, footerData, fileName, 'Sheet1');
        else
            this.excelService.exportAsExcelFile('Document Detail', '', columns, detailObj, footerData, fileName, 'Sheet1');

        obj = [];
        detailObj = [];
    }

    async exportAllTable() {
        if (this.reportType == 1) {
            this.isLoading = true;
            const data = await this.service.getDocumentsForDownloadingFile(this.documentInfo);
            this.isLoading = false;
            this.downloadExcelFile(of(data), null);
            this._changeDetectorRef.markForCheck();
            this.cdr.detectChanges();
        }
        else if (this.reportType == 2) {
            this.isLoading = true;
            const data = await this.service.getDocumentsDetailForDownloadingFile(this.documentDetailInfo);
            this.isLoading = false;
            this.downloadExcelFile(null, of(data));
            this._changeDetectorRef.markForCheck();
            this.cdr.detectChanges();
        }

    }


    exportCurrentTable() {
        let columns: Array<ExcelHeader> = new Array<ExcelHeader>();
        let obj: Array<CustomerOrder> = new Array<CustomerOrder>();
        let detailObj: Array<CustomerOrderDetail> = new Array<CustomerOrderDetail>();
        let total: number = 0;
        let price: number = 0;
        let qty: number = 0;
        let date = formatDate(new Date(), 'yyyyMMdd_hhmmss', 'en');
        let fileName: string = 'Doument_'.concat(date.toString());
        if (this.reportType === 1) {
            columns.push({ basedColumnName: 'orderCode', excelColumnName: 'Order Number' });
            columns.push({ basedColumnName: 'customerNameFamily', excelColumnName: 'Customer' });
            columns.push({ basedColumnName: 'regLocalDate', excelColumnName: 'Register Date' });
            columns.push({ basedColumnName: 'rowQuantity', excelColumnName: 'Rows' });
            columns.push({ basedColumnName: 'productQuantity', excelColumnName: 'Products' });
            columns.push({ basedColumnName: 'total', excelColumnName: 'Total' });
            columns.push({ basedColumnName: 'statusDesc', excelColumnName: 'Status' });
        } else {
            columns.push({ basedColumnName: 'orderCode', excelColumnName: 'Order Number' });
            columns.push({ basedColumnName: 'remittanceCode', excelColumnName: 'Remitance Code' });
            columns.push({ basedColumnName: 'customerNameFamily', excelColumnName: 'Customer' });
            columns.push({ basedColumnName: 'orderTypeName', excelColumnName: 'Order Type Name' });
            columns.push({ basedColumnName: 'warehouseName', excelColumnName: 'Warehouse Name' });
            columns.push({ basedColumnName: 'productName', excelColumnName: 'Product' });
            columns.push({ basedColumnName: 'brandName', excelColumnName: 'Brand Name' });
            columns.push({ basedColumnName: 'frameCoverName', excelColumnName: 'Frame Cover Name' });
            columns.push({ basedColumnName: 'panelCoverName', excelColumnName: 'Panel Cover Name' });
            columns.push({ basedColumnName: 'quantity', excelColumnName: 'Quantity' });
            columns.push({ basedColumnName: 'price', excelColumnName: 'Price' });
            columns.push({ basedColumnName: 'total', excelColumnName: 'Total' });
            columns.push({ basedColumnName: 'statusDesc', excelColumnName: 'Status' });
        }

        if (this.reportType === 1)
            this.documents$.subscribe(item => item.forEach(element => {
                qty = qty + 1;
                total = total + element.total;
                obj.push(element)
            }));
        else
            this.documentsDetails$.subscribe(item => item.forEach(element => {
                qty = qty + 1;
                total = total + element.total;
                price = price + element.price;
                detailObj.push(element)
            }));

        let footerData = [];
        if (this.reportType === 1) {
            footerData.push(['', '', '', '', '', 'QTY :', qty]);
            footerData.push(['', '', '', '', '', 'Total :', total.toString().concat(' IRR')]);
        } else {
            footerData.push(['', '', '', '', '', '', '', '', '', '', '', 'QTY :', qty]);
            footerData.push(['', '', '', '', '', '', '', '', '', '', '', 'Total :', total.toString().concat(' IRR')]);
            footerData.push(['', '', '', '', '', '', '', '', '', '', '', 'Price :', price.toString().concat(' IRR')]);
        }

        if (this.reportType === 1)
            this.excelService.exportAsExcelFile('Document', '', columns, obj, footerData, fileName, 'Sheet1');
        else
            this.excelService.exportAsExcelFile('Document Detail', '', columns, detailObj, footerData, fileName, 'Sheet1');

        obj = [];
        detailObj = [];
    }


    transformDecimal(num) {
        return num === 0 ? 0 : this._decimalPipe.transform(num, '1.0-5');
    }




    setLocalStorageValues(documnet: CustomerOrder) {
        localStorage.setItem('customerId', documnet.customerId.toString());
        localStorage.setItem('orderId', documnet.orderId.toString());
    }
}


