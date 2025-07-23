import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { Observable, Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { OrderService } from '../order.service';
import { CustomerOrder } from '../order.types';
import { Status } from 'app/core/type/status/status.types';
import { Customer } from 'app/modules/configuration/customer/customer/customer.types';
import { Router } from '@angular/router';
import { FuseAlertService } from '@fuse/components/alert';
import { OpResult } from 'app/core/type/result/result.types';
import { KeyValue } from 'app/core/type/key-value/key-value.type';
import { Product } from 'app/modules/configuration/branding/product/product.types';

@Component({
    selector: 'order-details',
    templateUrl: './details.component.html',
    styles: [`.no-gap .mat-form-field-wrapper {
        margin-top: 0 !important;
        padding-top: 0 !important;
      }
      
      .no-gap .mat-form-field-flex {
        margin-top: 0 !important;
        padding-top: 0 !important;
      }
      
      .no-gap .mat-form-field-infix {
        margin-top: 0 !important;
        padding-top: 0 !important;
      }`],
    encapsulation: ViewEncapsulation.None
})
export class OrderDetailsComponent implements OnInit, OnDestroy {
    @ViewChild('drawer') drawer: MatDrawer;
    drawerMode: 'over' | 'side' = 'side';
    drawerOpened: boolean = true;
    panels: any[] = [];
    selectedPanel: string = '';
    orderInfo: CustomerOrder;
    brands: Array<KeyValue>;
    pageType: string;
    id: number = 0;
    titleInfo: string;
    statusHistory: Array<Status>;
    customerInfo: Customer;
    _result: OpResult = new OpResult();
    private resultDisapearingTime: number = 7000;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(public service: OrderService,
        private cdr: ChangeDetectorRef,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _router: Router,
        private _fuseAlertService: FuseAlertService,
    ) {
        this.customerInfo = new Customer();
        this.orderInfo = new CustomerOrder();
        this.brands = new Array<KeyValue>();
        this.orderInfo.productList = [];
        this.orderInfo.customerDiscount = 0;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Setup available panels


        // Subscribe to media changes
        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({ matchingAliases }) => {

                // Set the drawerMode and drawerOpened
                if (matchingAliases.includes('lg')) {
                    this.drawerMode = 'side';
                    this.drawerOpened = true;
                }
                else {
                    this.drawerMode = 'over';
                    this.drawerOpened = false;
                }

                // Mark for check
                this.cdr.markForCheck();
            });

        this.service.isLoading = true;
        this.orderInfo.customerId = parseInt(localStorage.getItem('customerId'));
        this.orderInfo.orderId = parseInt(localStorage.getItem('orderId'));
        if (this.orderInfo.orderId > 0) {
            this.pageType = 'edit';
            this.getById();
        }
        else {
            this.titleInfo = 'Register New Order';
            this.pageType = 'new';
            this.loadData();
        }

    }
    onCustomerDataChange(data: Customer) {
        this.customerInfo = data; // Update parent's data
    }
    private initialPanels(pageType: string) {
        this.panels.push({
            id: 'customer',
            icon: 'heroicons_outline:user-circle',
            title: 'Customer',
            description: 'Customer Information'
        });
        if (pageType == 'edit')
            this.panels.push({
                id: 'change-history',
                icon: 'history',
                title: 'Change History',
                description: 'Manage your password and 2-step verification preferences'
            });
        this.panels.push({
            id: 'products',
            icon: 'mat_outline:inventory_2',
            title: 'Prodcuts',
            description: 'Manage order products'
        });
        this.panels.push({
            id: 'preview',
            icon: 'mat_outline:wysiwyg',
            title: 'Preview',
            description: 'Manage covers, panels, and their prices'
        });

    }
    private loadData() {
        forkJoin(
            this.getCovers(),
            this.getBrands(),
        ).subscribe(res => {
            this.setForkJoinValues(res);
        });

    }
    private getById() {
        this.service.isLoading = true;
        forkJoin(
            this.getOrder(this.orderInfo.orderId),
            this.getCustomerInfo(this.orderInfo.customerId),
            this.getStatusHistory(this.orderInfo.orderId),
            this.getCovers(),
            this.getBrands(),
        ).subscribe(res => {
            this.setForkJoinValuesInEditMode(res);
            // this.setFormValues();
        });

    }
    private setForkJoinValuesInEditMode(values: Array<any>): void {
        this.orderInfo = values[0].data;
        this.customerInfo = values[1].data;
        this.statusHistory = values[2].data;
        this.service.setPanelCovers(values[3].data.filter(x => x.conformityId === 1000652 || x.conformityId === 1000653));
        this.service.setFrameCovers(values[3].data.filter(x => x.conformityId === 1000651 || x.conformityId === 1000653));
        this.brands = values[4].data;
        let specificationList: Array<string> = [];
        specificationList.push('10');
        specificationList.push('11');
        this.loadProducts(this.orderInfo.orderTypeId);
        this.selectedPanel = 'customer';
        this.titleInfo = this.orderInfo.orderCode;
        this.initialPanels(this.pageType);
        this.service.setIsActionDisabled(this.orderInfo.status >= 1000034);

    }
    private setForkJoinValues(values: Array<any>): void {
        let specificationList: Array<string> = [];
        specificationList.push('10');
        specificationList.push('11');
        this.service.setPanelCovers(values[0].data.filter(x => x.conformityId === 1000652 || x.conformityId === 1000653));
        this.service.setFrameCovers(values[0].data.filter(x => x.conformityId === 1000651 || x.conformityId === 1000653));
        this.brands = values[1].data;
        this.orderInfo.orderTypeId = 1000531;
        this.loadProducts(this.orderInfo.orderTypeId);
        this.selectedPanel = 'customer';
        this.initialPanels(this.pageType);
        this.service.setIsActionDisabled(false);
    }
    private getOrder(id: number): Observable<any> {
        return this.service.getOrder(id);
    }
    private getCovers(): Observable<any> {
        return this.service.getCovers();
    }
    private getCustomerInfo(customerId: number): Observable<any> {
        return this.service.getCustomerInfo(customerId);
    }

    private getStatusHistory(id: number): Observable<any> {
        return this.service.getStatusHistory(id);
    }
    private getBrands(): Observable<any> {
        return this.service.getBrands();
    }
    private getProductsTree(brands: Array<KeyValue>, productTypeId: number): Observable<any> {

        const observables = brands.map(item => this.getProducts(item.key, productTypeId));
        return forkJoin(observables);

    }
    private getProducts(brandId: number, productTypeId: number): Observable<any> {
        let obj: Product = new Product();
        let specificationList: Array<string> = new Array<string>();
        specificationList.push('11');
        if (productTypeId == 1000531)
            specificationList.push('10');
        else
            specificationList.push('01');
        obj.brandId = brandId;
        obj.specificationList = specificationList;
        obj.productTypeId = productTypeId;
        return this.service.getProducts(obj);
    }

    private getByIdUpdateChangesOnly() {
        this.service.isLoading = true;
        forkJoin(
            this.getOrder(this.orderInfo.orderId),
            this.getCustomerInfo(this.orderInfo.customerId),
            this.getStatusHistory(this.orderInfo.orderId),
            this.getCovers(),
        ).subscribe(res => {
            this.setForkJoinValuesAfterConfirm(res);
            // this.setFormValues();
        });

    }

    private loadProducts(productTypeId: number) {
        this.service.isLoading = true;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
        this.getProductsTree(this.brands, productTypeId).pipe(takeUntil(this._unsubscribeAll))
            .subscribe((products: any) => {
                this.service.isLoading = false;
                this.service.setProductList(products.reduce((acc, cur) => {
                    if (cur.data.length > 0) {
                        return acc.concat(cur.data);
                    } else {
                        return acc;
                    }
                }, []));
                this.cdr.detectChanges();
            });
    }
    private setForkJoinValuesAfterConfirm(values: Array<any>): void {
        this.orderInfo = values[0].data;
        this.statusHistory = values[2].data;
        this.service.isLoading = false;
        this.cdr.detectChanges();
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        if (this._router.routerState.snapshot.url.indexOf('sales/order/payment') == -1) {
            localStorage.setItem('customerId', '');
            localStorage.setItem('orderId', '');
        }

        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
        this.service.disposeExpandedNodes();
        this.service.disposeSelectedProducts();
        this.service.disposeProducts();

    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Navigate to the panel
     *
     * @param panel
     */
    goToPanel(panel: string): void {
        this.selectedPanel = panel;

        // Close the drawer on 'over' mode
        if (this.drawerMode === 'over') {
            this.drawer.close();
        }
    }

    /**
     * Get the details of the panel
     *
     * @param id
     */
    getPanelInfo(id: string): any {
        if (this.selectedPanel != '')
            return this.panels.find(panel => panel.id == id);
        else
            return {
                id: 'loading',
                icon: 'heroicons_outline:lock-closed',
                title: 'Loading',
                description: 'Data is loading'
            }
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
    private showAlert(name: string): void {
        this._fuseAlertService.show(name);
    }

    private dismissAlert(name: string): void {
        this._fuseAlertService.dismiss(name);
    }
    confirm() {
        this.service.isLoading = true;
        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');
        this.service.confirmSalesDep(this.orderInfo).subscribe(res => {
            this.service.isLoading = false;
            this._result.succeed = res.succeed;
            this._result.message = res.message;
            if (this._result.succeed) {
                this.showAlert('successMessage');
                window.setTimeout(function () {
                    this.dismissAlert('successMessage');
                }.bind(this), this.resultDisapearingTime);
                this.getByIdUpdateChangesOnly();
            }
            else
                this.showAlert('errorMessage');
            this.cdr.detectChanges();
        });
    }
    revoke() {
        this.service.isLoading = true;
        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');
        this.service.revoke(this.orderInfo).subscribe(res => {
            this.service.isLoading = false;
            this._result.succeed = res.succeed;
            this._result.message = res.message;
            if (this._result.succeed) {
                this.showAlert('successMessage');
                window.setTimeout(function () {
                    this.dismissAlert('successMessage');
                }.bind(this), this.resultDisapearingTime);
                this.getByIdUpdateChangesOnly();
            }
            else
                this.showAlert('errorMessage');
            this.cdr.detectChanges();
        });
    }
    rollback() {
        this.service.isLoading = true;
        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');
        this.service.rollback(this.orderInfo).subscribe(res => {
            this.service.isLoading = false;
            this._result.succeed = res.succeed;
            this._result.message = res.message;
            if (this._result.succeed) {
                this.showAlert('successMessage');
                window.setTimeout(function () {
                    this.dismissAlert('successMessage');
                    this.cd.detectChanges();
                }.bind(this), this.resultDisapearingTime);
                this.getByIdUpdateChangesOnly();
            }
            else
                this.showAlert('errorMessage');
            this.cdr.detectChanges();
        });
    }

    confirmPayement() {
        this.service.isLoading = true;
        this.orderInfo.accessKey = 'PYM_CWP';
        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');
        this.service.confirmPayment(this.orderInfo).subscribe(res => {
            this.orderInfo.accessKey = '';
            this.service.isLoading = false;
            this._result.succeed = res.succeed;
            this._result.message = res.message;
            if (this._result.succeed) {
                this.showAlert('successMessage');
                window.setTimeout(function () {
                    if (!this.service.isLoading)
                        this.dismissAlert('successMessage');
                    this.cd.detectChanges();
                }.bind(this), this.resultDisapearingTime);
                this.getByIdUpdateChangesOnly();
            }
            else
                this.showAlert('errorMessage');
            this.cdr.detectChanges();
        });
    }
}
