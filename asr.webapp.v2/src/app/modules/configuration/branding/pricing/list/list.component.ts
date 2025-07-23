import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Inject, OnDestroy, OnInit, TemplateRef, ViewChild, ViewContainerRef, ViewEncapsulation, HostListener } from '@angular/core';
import { DecimalPipe, DOCUMENT, formatDate } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDrawer } from '@angular/material/sidenav';
import { fromEvent, merge, Observable, of, Subject, Subscription } from 'rxjs';
import { filter, map, switchMap, takeUntil, debounceTime, distinctUntilChanged, take } from 'rxjs/operators';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { PriceGrid, Pricing } from 'app/modules/configuration/branding/pricing/pricing.types';
import { PricingService } from 'app/modules/configuration/branding/pricing/pricing.service';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Paging } from 'app/core/type/paging/paging.type';
import { MatSort } from '@angular/material/sort';
import { ExcelService } from 'app/shared/excel/excel.service';
import jsPDF from 'jspdf';
import { ExcelHeader } from 'app/shared/excel/excel.types';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { UploadDialogService } from '../upload/upload-dialog.service';
import { GridSizeComponent, GridSize, columnAccessType } from 'app/shared/grid-size.component';

@Component({
    selector: 'price-list',
    templateUrl: './list.component.html',
    styles: [
        /* language=SCSS */

    ],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PricingListComponent implements OnInit, OnDestroy {
    priceGridCss: string = `
    
`;
    @HostListener('window:resize', ['$event'])
    onResize(event: Event): void {
        this.gridSizeInfo.currentSize = this.gridSize.onResize(this.gridSizeInfo);
    }
    private gridSizeInfo: GridSize;
    gridStyles: { [key: string]: string } = {};
    @ViewChild('matDrawer', { static: true }) matDrawer: MatDrawer;
    @ViewChild('filter', { static: true }) filter: ElementRef;
    sub: Subscription;
    overlayRef: OverlayRef | null;
    prices$: Observable<Pricing[]>;
    priceGrid: PriceGrid;
    isLoading: boolean = false;
    showHeaderList: boolean = true;
    pricesCount: number = 0;
    drawerMode: 'side' | 'over';
    searchInputControl: FormControl = new FormControl();
    public selectedPrice: Pricing;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;
    throttle = 300;
    scrollDistance = 1;
    scrollUpDistance = 2;
    direction = "";
    modalOpen = false;
    pricingInfo: Pricing = new Pricing();
    brands: Array<{ key: number, value: string }> = [];
    frmAdvancedSearch: FormGroup;
    showAdvancedSearch: boolean = false;

    /**
     * Constructor
     */
    constructor(
        private _uploadDialogService: UploadDialogService,
        public overlay: Overlay,
        private _activatedRoute: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        private _pricingService: PricingService,
        @Inject(DOCUMENT) private _document: any,
        private _formBuilder: FormBuilder,
        private _decimalPipe: DecimalPipe, public viewContainerRef: ViewContainerRef,
        private excelService: ExcelService,
        private _router: Router,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private gridSize: GridSizeComponent,
    ) {
        this.pricingInfo.brandIdList = [];
        this.priceGrid = new PriceGrid();
        this.gridSizeInfo = new GridSize();
        this.frmAdvancedSearch = new FormGroup({});
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {

        this.getBrands();
        this._pricingService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: Paging) => {

                // Update the pagination
                this.pricingInfo.page = pagination;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
        this.prices$ = this._pricingService.prices$;

        this._pricingService.prices$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((prices: Pricing[]) => {

                // Update the counts
                this.pricesCount = prices.length;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the price
        this._pricingService.price$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((price: Pricing) => {

                // Update the selected price
                this.selectedPrice = price;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });


        // Subscribe to search input field value changes
        fromEvent(this.filter.nativeElement, 'keyup')
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(150),
                distinctUntilChanged()
            )
            .subscribe(() => {

                if (!this.prices$)
                    return;


                this._pricingService.prices$.pipe(map(items => items.filter(x =>
                    x.brandName.toLowerCase().includes(this.filter.nativeElement.value) ||
                    x.productCode.toLowerCase().includes(this.filter.nativeElement.value) ||
                    x.productName.toString().toLowerCase().includes(this.filter.nativeElement.value) ||
                    x.price.toString().includes(this.filter.nativeElement.value) ||
                    x.effLocalDate.toLowerCase().toString().includes(this.filter.nativeElement.value) ||
                    x.effLocalTime.toString().includes(this.filter.nativeElement.value)))).subscribe(elements => {
                        this.prices$ = of(elements as Pricing[]);
                        this._changeDetectorRef.markForCheck();
                        this._changeDetectorRef.detectChanges();
                    });

            });


        // Subscribe to MatDrawer opened change
        this.matDrawer.openedChange.subscribe((opened) => {
            if (!opened) {
                // Remove the selected price when drawer closed
                this.selectedPrice = null;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            }
        });

        // Subscribe to media changes
        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({ matchingAliases }) => {

                // Set the drawerMode if the given breakpoint is active
                if (matchingAliases.includes('lg')) {
                    this.drawerMode = 'side';
                }
                else {
                    this.drawerMode = 'over';
                }

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Listen for shortcuts
        fromEvent(this._document, 'keydown')
            .pipe(
                takeUntil(this._unsubscribeAll),
                filter<KeyboardEvent>(event =>
                    (event.ctrlKey === true || event.metaKey) // Ctrl or Cmd
                    && (event.key === '/') // '/'
                )
            )
            .subscribe(() => {
                this.createPrice();
            });

    }
    ngAfterViewInit(): void {
        this.priceGridInit();
        if (this._sort && this._paginator) {
            // Set the initial sort
            this._sort.sort({
                id: '',
                start: 'asc',
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

                    // Close the details
                    this.closeDetails();
                });

            // Get products if sort or page changes
            merge(this._sort.sortChange, this._paginator.page).pipe(
                switchMap(() => {
                    this.closeDetails();
                    this.isLoading = true;
                    this.pricingInfo.page.pageNumber = this._paginator.pageIndex;
                    this.pricingInfo.page.pageSize = this._paginator.pageSize;
                    this.pricingInfo.page.sort = this._sort.active;
                    this.pricingInfo.page.order = this._sort.direction;
                    return this._pricingService.getPrices(this.pricingInfo);
                }),
                map(() => {
                    this.isLoading = false;
                    if (this._sort.active === 'brandName' || this._sort.active == '')
                        this.showHeaderList = true;
                    else
                        this.showHeaderList = false;
                })
            ).subscribe();
        }
    }
    closeDetails(): void {
        // this.selectedPrice = null;
    }
    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * On backdrop clicked
     */
    onBackdropClicked(): void {
        // Go back to the list
        this._router.navigate(['./'], { relativeTo: this._activatedRoute });

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Create price
     */
    createPrice(): void {
        this._router.navigate(['./', -1], { relativeTo: this._activatedRoute });

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }
    onScroll() {
        console.log('scroll');
    }

    handlePageEvent(event: PageEvent) {

        let obj: Pricing = new Pricing();
        this._pricingService.getPrices(obj);
    }

    resetAdvancedSearch() {

    }
    search() {
        this.isLoading = true;
        if (this.priceGrid.productCode.show.advancedSearch)
            this.pricingInfo.productCode = this.frmAdvancedSearch.controls["code"].value;
        if (this.priceGrid.productTypeName.show.advancedSearch)
            this.pricingInfo.productTypeId = this.frmAdvancedSearch.controls["type"].value;
        if (this.priceGrid.productName.show.advancedSearch)
            this.pricingInfo.productName = this.frmAdvancedSearch.controls["name"].value;
        if (this.priceGrid.price.show.advancedSearch) {
            this.pricingInfo.priceFrom = this.frmAdvancedSearch.controls["priceFrom"].value;
            this.pricingInfo.priceTo = this.frmAdvancedSearch.controls["priceTo"].value;
        }
        if (this.priceGrid.primeCost.show.advancedSearch) {
            this.pricingInfo.priceFrom = this.frmAdvancedSearch.controls["primeCostFrom"].value;
            this.pricingInfo.priceTo = this.frmAdvancedSearch.controls["primeCostTo"].value;
        }
        if (this.priceGrid.effDateTime.show.advancedSearch) {
            this.pricingInfo.effDteFrom = this.frmAdvancedSearch.controls["effDateFrom"].value;
            this.pricingInfo.effDateTo = this.frmAdvancedSearch.controls["effDateTo"].value;
        }
        this.pricingInfo.page.flag = true;
        this.pricingInfo.page.pageNumber = 0;
        this.pricingInfo.page.length = 0;
        this._pricingService.getPrices(this.pricingInfo).subscribe(() => {
            this.isLoading = false;
        });
    }

    setBrandValue(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            if (event.source.value != 0 && event.source.selected) {
                this.pricingInfo.brandIdList.push(event.source.value);

            }
            else if (event.source.value != 0 && !event.source.selected) {
                const index: number = this.pricingInfo.brandIdList.indexOf(event.source.value);
                if (index !== -1)
                    this.pricingInfo.brandIdList.splice(index, 1);
                this.frmAdvancedSearch.controls["brand"].setValue(this.pricingInfo.brandIdList);
            }
        }
    }
    private getBrands() {

        this._pricingService.getDrpBrands().subscribe(res => {
            this.brands = res.data;
        });

    }
    openUploadDialog() {

        let configForm: FormGroup = this._formBuilder.group({
            title: "Upload Price List File"
        });
        const dialogRef = this._uploadDialogService.open(configForm.value);
        dialogRef.afterClosed().subscribe((result) => {
            /*    if (result !== 'cancelled')
                   this.categoryTreeModification(result, 0, 0, 'new'); */
        });
    }

    exportTable() {
        let columns: Array<ExcelHeader> = new Array<ExcelHeader>();
        let obj: Array<Pricing> = new Array<Pricing>();
        let price: number = 0;
        let qty: number = 0;
        let date = formatDate(new Date(), 'yyyyMMdd_hhmmss', 'en');
        let fileName: string = 'Price_'.concat(date.toString());
        let footerData = [];
        let footerQtyArray = [];
        let footerPriceArray = [];

        this._pricingService.userColumn$.filter(x => x.excel == 1 && x.hasAccess == 1).forEach(element => {
            columns.push({ excelColumnName: element.excelHeader, basedColumnName: element.modelName });
        });


        this.prices$.subscribe(items => items.forEach(element => {
            qty = qty + 1;
            price = price + element.price;
            obj.push(element);

        }));


        footerQtyArray.push('QTY');
        footerPriceArray.push('PRICE');

        for (let index = 0; index < columns.length - 2; index++) {
            footerQtyArray.push('');
            footerPriceArray.push('');
        }
        footerQtyArray.push(qty);
        footerPriceArray.push(this.transformDecimal(price).toString().concat(' IRR'));
        footerData = [footerQtyArray, footerPriceArray];



        this.excelService.exportAsExcelFile('Product Price', '', columns, obj, footerData, fileName, 'Sheet1');

        obj = [];
    }
    download() {

        var pdf = new jsPDF('l');

        pdf.setFontSize(20);
        pdf.text('PoductPrice', 14, 8);
        pdf.setFontSize(12);
        pdf.setTextColor(99);
        let header = [];
        let tableData = [];
        let footer = [];
        let footerQtyArray = [];
        let footerPriceArray = [];
        let price: number = 0;
        let qty: number = 0;
        let date = formatDate(new Date(), 'yyyyMMdd_hhmmss', 'en');
        let fileName: string = 'ProductPrice_'.concat(date.concat('.pdf'));


        this._pricingService.userColumn$.filter(x => x.pdf == 1 && x.hasAccess == 1).forEach(element => {
            header.push({ header: element.pdfHeader, dataKey: element.modelName });
        });


        this.prices$.subscribe(items => items.forEach(element => {
            qty = qty + 1;
            price = price + element.price;
            tableData.push({
                brandName: element.brandName, productCode: element.productCode, productName: element.productName,
                productTypeName: element.productTypeName, price: this.transformDecimal(element.price), primeCost: this.transformDecimal(element.primeCost),
                effLocalDate: element.effLocalDate,
                effLocalTime: element.effLocalTime
            });
        }));

        footerQtyArray.push('QTY');
        footerPriceArray.push('PRICE');

        for (let index = 0; index < header.length - 2; index++) {
            footerQtyArray.push('');
            footerPriceArray.push('');
        }
        footerQtyArray.push(qty);
        footerPriceArray.push(this.transformDecimal(price).toString().concat(' IRR'));
        footer = [footerQtyArray, footerPriceArray];


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


    private createAdvancedSearchFormControls() {
        if (this.priceGrid.brandName.show)
            this.frmAdvancedSearch.addControl('brand', new FormControl());
        if (this.priceGrid.productTypeName.show)
            this.frmAdvancedSearch.addControl('type', new FormControl());
        if (this.priceGrid.productCode.show)
            this.frmAdvancedSearch.addControl('code', new FormControl());
        if (this.priceGrid.productName.show)
            this.frmAdvancedSearch.addControl('name', new FormControl());
        if (this.priceGrid.price.show) {
            this.frmAdvancedSearch.addControl('priceFrom', new FormControl());
            this.frmAdvancedSearch.addControl('priceTo', new FormControl());
        }
        if (this.priceGrid.primeCost.show) {
            this.frmAdvancedSearch.addControl('primeCostFrom', new FormControl());
            this.frmAdvancedSearch.addControl('primeCostTo', new FormControl());
        }
        if (this.priceGrid.effDateTime.show) {
            this.frmAdvancedSearch.addControl('effDateFrom', new FormControl());
            this.frmAdvancedSearch.addControl('effDateTo', new FormControl());
        }
        this.showAdvancedSearch = true;
    }
    private columnAccessControl() {
        let show: columnAccessType;

        show = this.getListAccess('brandName');
        this.priceGrid.brandName = { show: { list: show.list, excel: show.excel, pdf: show.pdf, advancedSearch: show.advancedSearch }, width: { sm: show.list ? ' 85px' : '', md: show.list ? ' 85px' : '', lg: show.list ? ' 120px' : '' } };
        show = this.getListAccess('productCode');
        this.priceGrid.productCode = { show: { list: show.list, excel: show.excel, pdf: show.pdf, advancedSearch: show.advancedSearch }, width: { sm: show.list ? ' 48px' : '', md: show.list ? ' 48px' : '', lg: show.list ? ' 70px' : '' } };
        show = this.getListAccess('productName');
        this.priceGrid.productName = { show: { list: show.list, excel: show.excel, pdf: show.pdf, advancedSearch: show.advancedSearch }, width: { sm: '', md: '', lg: show.list ? ' auto' : '' } };
        show = this.getListAccess('productTypeName');
        this.priceGrid.productTypeName = { show: { list: show.list, excel: show.excel, pdf: show.pdf, advancedSearch: show.advancedSearch }, width: { sm: '', md: '', lg: show.list ? ' 200px' : '' } };
        show = this.getListAccess('price');
        this.priceGrid.price = { show: { list: show.list, excel: show.excel, pdf: show.pdf, advancedSearch: show.advancedSearch }, width: { sm: show.list ? ' auto' : '', md: show.list ? ' auto' : '', lg: show.list ? ' 150px' : '' } };
        show = this.getListAccess('primeCost');
        this.priceGrid.primeCost = { show: { list: show.list, excel: show.excel, pdf: show.pdf, advancedSearch: show.advancedSearch }, width: { sm: show.list ? ' 100px' : '', md: show.list ? ' 100px' : '', lg: show.list ? ' 150px' : '' } };
        show = this.getListAccess('effDateTime');
        this.priceGrid.effDateTime = { show: { list: show.list, excel: show.excel, pdf: show.pdf, advancedSearch: show.advancedSearch }, width: { sm: '', md: '', lg: show.list ? ' 200px' : '' } };
        this.createAdvancedSearchFormControls();
    }
    private getListAccess(columnName: string): any {
        let show: columnAccessType;
        let showList: boolean;
        let showPdf: boolean;
        let showExcel: boolean;

        showList = this._pricingService.userColumn$.filter(x => x.list == 1 && x.hasAccess == 1 && x.modelName == columnName).length > 0;
        showPdf = this._pricingService.userColumn$.filter(x => x.pdf == 1 && x.hasAccess == 1 && x.modelName == columnName).length > 0;
        showExcel = this._pricingService.userColumn$.filter(x => x.excel == 1 && x.hasAccess == 1 && x.modelName == columnName).length > 0;
        show = { list: showList, excel: showExcel, pdf: showPdf, advancedSearch: showList || showPdf || showExcel };
        return show;
    }
    private priceGridInit() {
        this.columnAccessControl();
        this.gridSizeInfo.classId = "pricingList";
        this.gridSizeInfo.smSCSS = '.price-grid { grid-template-columns:' + this.priceGrid.brandName.width?.sm + this.priceGrid.productCode.width?.sm + this.priceGrid.price.width?.sm + ';}';
        this.gridSizeInfo.mdSCSS = '.price-grid { grid-template-columns:' + this.priceGrid.brandName.width?.md + this.priceGrid.productCode.width?.md + this.priceGrid.price.width?.md + ';}';
        this.gridSizeInfo.lgSCSS = '.price-grid { grid-template-columns:' + this.priceGrid.brandName.width?.lg + this.priceGrid.productCode.width?.lg + this.priceGrid.productName.width?.lg + this.priceGrid.productTypeName.width?.lg + this.priceGrid.price.width?.lg + this.priceGrid.primeCost.width?.lg + this.priceGrid.effDateTime.width?.lg + ';}';
        this.gridSizeInfo.className = 'price-grid';
        this.gridSizeInfo.tagName = 'priceGrid';
        this.gridSizeInfo.currentSize = this.gridSize.getWindowSize();
        this.gridSize.afterViewInit(this.gridSizeInfo);
    }

}
