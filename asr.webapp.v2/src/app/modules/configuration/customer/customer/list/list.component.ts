import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Inject, OnDestroy, OnInit, TemplateRef, ViewChild, ViewContainerRef, ViewEncapsulation, ɵɵpureFunction1 } from '@angular/core';
import { DecimalPipe, DOCUMENT, formatDate } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDrawer } from '@angular/material/sidenav';
import { fromEvent, merge, Observable, of, Subject, Subscription } from 'rxjs';
import { filter, map, switchMap, takeUntil, debounceTime, distinctUntilChanged, take } from 'rxjs/operators';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { Customer } from 'app/modules/configuration/customer/customer/customer.types';
import { CustomerService } from 'app/modules/configuration/customer/customer/customer.service';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Paging } from 'app/core/type/paging/paging.type';
import { MatSort } from '@angular/material/sort';
import { ExcelService } from 'app/shared/excel/excel.service';
import jsPDF from 'jspdf';
import { ExcelHeader } from 'app/shared/excel/excel.types';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { DialogService } from '../dialog/dialog.service';

@Component({
    selector: 'customer-list',
    templateUrl: './list.component.html', styles: [
        /* language=SCSS */
        `
        // THE STYLE IS FROM CODEPEN

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
        
        
        
            .customer-grid {
                grid-template-columns: 48px auto 40px;

                @screen sm {
                    grid-template-columns: 48px auto 112px 72px;
                }

                @screen md {
                    grid-template-columns: 48px 112px auto 112px 72px;
                }

                @screen lg {
                    grid-template-columns: auto 112px 130px 130px 120px 120px 120px 70px;
                }
            }
        `
    ],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerListComponent implements OnInit, OnDestroy {
    @ViewChild('matDrawer', { static: true }) matDrawer: MatDrawer;
    @ViewChild('filter', { static: true }) filter: ElementRef;
    @ViewChild('userMenu') userMenu: TemplateRef<any>;
    sub: Subscription;
    overlayRef: OverlayRef | null;
    customers$: Observable<Customer[]>;
    isLoading: boolean = false;
    showHeaderList: boolean = true;
    customersCount: number = 0;
    customersTableColumns: string[] = ['name', 'email', 'phoneNumber', 'job'];
    drawerMode: 'side' | 'over';
    searchInputControl: FormControl = new FormControl();
    public selectedCustomer: Customer;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;
    throttle = 300;
    scrollDistance = 1;
    scrollUpDistance = 2;
    direction = "";
    modalOpen = false;
    customerInfo: Customer = new Customer();
    customerTypes: Array<{ key: number, value: string }> = [];
    frmAdvancedSearch = new FormGroup({
        status: new FormControl(),
        name: new FormControl(),
        family: new FormControl(),
        company: new FormControl(),
        code: new FormControl(),
        phone: new FormControl(),
        type: new FormControl(),
        balanceFrom: new FormControl(),
        balanceTo: new FormControl(),
        creditFrom: new FormControl(),
        creditTo: new FormControl(),
        totalFrom: new FormControl(),
        totalTo: new FormControl()
    });

    /**
     * Constructor
     */
    constructor(
        public overlay: Overlay,
        private _activatedRoute: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        private _customerService: CustomerService,
        @Inject(DOCUMENT) private _document: any,
        private _formBuilder: FormBuilder,
        private _decimalPipe: DecimalPipe, public viewContainerRef: ViewContainerRef,
        private excelService: ExcelService,
        private _router: Router,
        private _dialogService: DialogService,
        private _fuseMediaWatcherService: FuseMediaWatcherService
    ) {

        this.customerInfo.customerTypeIdList = [];
        this.customerInfo.status = 1;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        this.getCustomerTypes();
        // Get the customers
        this._customerService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: Paging) => {

                // Update the pagination
                this.customerInfo.page = pagination;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
        this.customers$ = this._customerService.customers$;
        this._customerService.customers$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((customers: Customer[]) => {

                // Update the counts
                this.customersCount = customers.length;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the customer
        this._customerService.customer$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((customer: Customer) => {

                // Update the selected customer
                this.selectedCustomer = customer;

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

                if (!this.customers$)
                    return;


                this._customerService.customers$.pipe(map(items => items.filter(x =>
                    x.customerName.toLowerCase().includes(this.filter.nativeElement.value) ||
                    x.customerFamily.toLowerCase().includes(this.filter.nativeElement.value) ||
                    x.companyName.toString().includes(this.filter.nativeElement.value) ||
                    x.customerCode.toString().includes(this.filter.nativeElement.value) ||
                    x.customerTypeName.toLowerCase().toString().includes(this.filter.nativeElement.value) ||
                    x.statusDescription.toString().includes(this.filter.nativeElement.value) ||
                    x.budgetBalance.toString().includes(this.filter.nativeElement.value) ||
                    x.budgetCredit.toString().includes(this.filter.nativeElement.value) ||
                    x.budgetTotal.toString().includes(this.filter.nativeElement.value)))).subscribe(elements => {
                        this.customers$ = of(elements as Customer[]);
                        this._changeDetectorRef.markForCheck();
                        this._changeDetectorRef.detectChanges();
                    });

            });


        // Subscribe to MatDrawer opened change
        this.matDrawer.openedChange.subscribe((opened) => {
            if (!opened) {
                // Remove the selected customer when drawer closed
                this.selectedCustomer = null;

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
                this.createCustomer();
            });


    }
    ngAfterViewInit(): void {
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
                    this.customerInfo.page.pageNumber = this._paginator.pageIndex;
                    this.customerInfo.page.pageSize = this._paginator.pageSize;
                    this.customerInfo.page.sort = this._sort.active;
                    this.customerInfo.page.order = this._sort.direction;
                    return this._customerService.getCustomers(this.customerInfo);
                }),
                map(() => {
                    this.isLoading = false;
                    if (this._sort.active === 'customerName' || this._sort.active == '')
                        this.showHeaderList = true;
                    else
                        this.showHeaderList = false;
                })
            ).subscribe();
        }
        this.frmAdvancedSearch.controls['status'].setValue(1);
    }
    closeDetails(): void {
        // this.selectedCustomer = null;
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
     * Create customer
     */
    createCustomer(): void {
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

        let obj: Customer = new Customer();
        this._customerService.getCustomers(obj);
    }
    exportTable() {
        let columns: Array<ExcelHeader> = new Array<ExcelHeader>();
        let obj: Array<Customer> = new Array<Customer>();
        let balance: number = 0;
        let credit: number = 0;
        let remained: number = 0;
        let qty: number = 0;
        let date = formatDate(new Date(), 'yyyyMMdd_hhmmss', 'en');
        let fileName: string = 'Customer_'.concat(date.toString());

        columns.push({ basedColumnName: 'customerName', excelColumnName: 'Name' });
        columns.push({ basedColumnName: 'customerFamily', excelColumnName: 'Family' });
        columns.push({ basedColumnName: 'companyName', excelColumnName: 'Company' });
        columns.push({ basedColumnName: 'customerCode', excelColumnName: 'Code' });
        columns.push({ basedColumnName: 'phone', excelColumnName: 'Phone' });
        columns.push({ basedColumnName: 'customerTypeName', excelColumnName: 'Type' });
        columns.push({ basedColumnName: 'budgetBalance', excelColumnName: 'Balance' });
        columns.push({ basedColumnName: 'budgetCredit', excelColumnName: 'Credit' });
        columns.push({ basedColumnName: 'budgetTotal', excelColumnName: 'Remained' });
        columns.push({ basedColumnName: 'statusDescription', excelColumnName: 'Status' });


        this.customers$.subscribe(items => items.forEach(element => {
            qty = qty + 1;
            balance = balance + element.budgetBalance;
            credit = credit + element.budgetCredit;
            remained = remained + element.budgetTotal;
            obj.push(element);

        }));



        let footerData = [];

        footerData.push(['', '', '', '', '', '', '', '', 'QTY', qty]);
        footerData.push(['', '', '', '', '', '', '', '', 'Balance', balance.toString().concat(' IRR')]);
        footerData.push(['', '', '', '', '', '', '', '', 'Credit', credit.toString().concat(' IRR')]);
        footerData.push(['', '', '', '', '', '', '', '', 'Remained', remained.toString().concat(' IRR')]);

        this.excelService.exportAsExcelFile('Customer', '', columns, obj, footerData, fileName, 'Sheet1');

        obj = [];
    }
    download() {

        var pdf = new jsPDF('l');

        pdf.setFontSize(20);
        pdf.text('Customer', 14, 8);
        pdf.setFontSize(12);
        pdf.setTextColor(99);
        let header = [];
        let tableData = [];
        let footer = [];
        let balance: number = 0;
        let credit: number = 0;
        let remained: number = 0;
        let qty: number = 0;
        let date = formatDate(new Date(), 'yyyyMMdd_hhmmss', 'en');
        let fileName: string = 'Customer_'.concat(date.concat('.pdf'));

        header = [{ header: 'Name', dataKey: 'customerName' },
        { header: 'Family', dataKey: 'customerFamily' },
        { header: 'Company', dataKey: 'companyName' },
        { header: 'Code', dataKey: 'customerCode' },
        { header: 'Phone', dataKey: 'phone' },
        { header: 'Type', dataKey: 'customerTypeName' },
        { header: 'Balance', dataKey: 'budgetBalance' },
        { header: 'Credit', dataKey: 'budgetCredit' },
        { header: 'Remained', dataKey: 'budgetTotal' },
        { header: 'Status', dataKey: 'status' }];


        this.customers$.subscribe(items => items.forEach(element => {
            qty = qty + 1;
            balance = balance + element.budgetBalance;
            credit = credit + element.budgetCredit;
            remained = remained + element.budgetTotal;
            tableData.push([
                element.customerName, element.customerFamily, element.companyName,
                element.customerCode, element.phone, element.customerTypeName, this.transformDecimal(element.budgetBalance),
                this.transformDecimal(element.budgetCredit), this.transformDecimal(element.budgetTotal),
                element.statusDescription
            ]);
        }));

        footer = [['QTY', '', '', '', '', '', '', '', '', qty],
        ['BALANCE', '', '', '', '', '', '', '', '', this.transformDecimal(balance).toString().concat(' IRR')],
        ['CREDIT', '', '', '', '', '', '', '', '', this.transformDecimal(credit).toString().concat(' IRR')],
        ['REMAINED', '', '', '', '', '', '', '', '', this.transformDecimal(remained).toString().concat(' IRR')]];


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
    resetAdvancedSearch() {

    }
    search() {
        this.isLoading = true;
        this.customerInfo.customerName = this.frmAdvancedSearch.controls["name"].value;
        this.customerInfo.customerFamily = this.frmAdvancedSearch.controls["family"].value;
        this.customerInfo.customerCode = this.frmAdvancedSearch.controls["code"].value;
        this.customerInfo.phone = this.frmAdvancedSearch.controls["phone"].value;
        this.customerInfo.companyName = this.frmAdvancedSearch.controls["company"].value;
        this.customerInfo.balanceFrom = this.frmAdvancedSearch.controls["balanceFrom"].value;
        this.customerInfo.balanceTo = this.frmAdvancedSearch.controls["balanceTo"].value;
        this.customerInfo.creditFrom = this.frmAdvancedSearch.controls["creditFrom"].value;
        this.customerInfo.creditTo = this.frmAdvancedSearch.controls["creditTo"].value;
        this.customerInfo.totalFrom = this.frmAdvancedSearch.controls["totalFrom"].value;
        this.customerInfo.totalTo = this.frmAdvancedSearch.controls["totalTo"].value;
        this.customerInfo.status = this.frmAdvancedSearch.controls["status"].value;
        this.customerInfo.page.flag = true;
        this.customerInfo.page.pageNumber = 0;
        this.customerInfo.page.length = 0;
        this._customerService.getCustomers(this.customerInfo).subscribe(() => {
            this.isLoading = false;
        });
    }

    setTypeValue(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            if (event.source.value != 0 && event.source.selected) {
                this.customerInfo.customerTypeIdList.push(event.source.value);

            }
            else if (event.source.value != 0 && !event.source.selected) {
                const index: number = this.customerInfo.customerTypeIdList.indexOf(event.source.value);
                if (index !== -1)
                    this.customerInfo.customerTypeIdList.splice(index, 1);
                this.frmAdvancedSearch.controls["bank"].setValue(this.customerInfo.customerTypeIdList);
            }
        }
    }
    private getCustomerTypes() {

        this._customerService.getDrpCustomerType().subscribe(res => {
            this.customerTypes = res.data;
        });

    }
    open({ x, y }: MouseEvent, customer) {
        this.close();
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
            $implicit: customer
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
    openInNewWindow() {
        this.close();
        this._router.navigate(['./', this.selectedCustomer.customerId], { relativeTo: this._activatedRoute });
    }
    openDialog() {
        let title: string;
        title = 'Budget History';
        let configForm: FormGroup = this._formBuilder.group({
            budgetId: this.selectedCustomer.budgetId,
            title: title,
            dismissible: this._formBuilder.group({
                show: true,
                disabled: false
            })
        });
        this.close();
        const dialogRef = this._dialogService.open(configForm.value);
        dialogRef.afterClosed().subscribe((result) => {


        });
    }

}
