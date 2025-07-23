import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { Observable, Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { DocumentService } from '../document.service';
import { CustomerOrder } from '../../order/order.types';
import { Status } from 'app/core/type/status/status.types';
import { Customer } from 'app/modules/configuration/customer/customer/customer.types';
import { Router } from '@angular/router';
import { FuseAlertService } from '@fuse/components/alert';
import { OpResult } from 'app/core/type/result/result.types';
import { RevokeRequest } from '../document.types';

@Component({
    selector: 'document-details',
    templateUrl: './details.component.html',
    encapsulation: ViewEncapsulation.None
})
export class DocumentDetailsComponent implements OnInit, OnDestroy {
    @ViewChild('drawer') drawer: MatDrawer;
    drawerMode: 'over' | 'side' = 'side';
    drawerOpened: boolean = true;
    panels: any[] = [];
    selectedPanel: string = '';
    orderInfo: CustomerOrder;
    isLoading: boolean = false;
    statusHistory: Array<Status>;
    customerInfo: Customer;
    _result: OpResult = new OpResult();
    panelCovers = [];
    frameCovers = [];
    private resultDisapearingTime: number = 7000;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(private service: DocumentService,
        private cdr: ChangeDetectorRef,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _router: Router,
        private _fuseAlertService: FuseAlertService,
    ) {
        this.customerInfo = new Customer();
        this.orderInfo = new CustomerOrder();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void { 
        // Setup available panels
        this.panels = [
            {
                id: 'customer',
                icon: 'heroicons_outline:user-circle',
                title: 'Customer',
                description: 'Customer Information'
            },
            {
                id: 'change-history',
                icon: 'history',
                title: 'Change History',
                description: 'Manage your password and 2-step verification preferences'
            },
            {
                id: 'product-list',
                icon: 'mat_outline:inventory_2',
                title: 'Products',
                description: 'Manage your subscription plan, payment method and billing information'
            },
            {
                id: 'invoice',
                icon: 'mat_outline:receipt_long',
                title: 'Invoice',
                description: 'Manage when you\'ll be notified on which channels'
            }
        ];

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

        this.isLoading = true;
        this.orderInfo.customerId = parseInt(localStorage.getItem('customerId'));
        this.orderInfo.orderId = parseInt(localStorage.getItem('orderId'));
        this.getById();

    }
    private getDocument(id: number): Observable<any> {
        return this.service.getDocument(id);
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
    private getById() {
        this.isLoading = true;
        forkJoin(
            this.getDocument(this.orderInfo.orderId),
            this.getCustomerInfo(this.orderInfo.customerId),
            this.getStatusHistory(this.orderInfo.orderId),
            this.getCovers(),
        ).subscribe(res => {
            this.setForkJoinValues(res);
            // this.setFormValues();
        });

    }
    private getByIdUpdateChangesOnly() {
        this.isLoading = true;
        forkJoin(
            this.getDocument(this.orderInfo.orderId),
            this.getCustomerInfo(this.orderInfo.customerId),
            this.getStatusHistory(this.orderInfo.orderId),
            this.getCovers(),
        ).subscribe(res => {
            this.setForkJoinValuesAfterConfirm(res);
            // this.setFormValues();
        });

    }
    private setForkJoinValues(values: Array<any>): void {
        this.orderInfo = values[0].data;
        this.customerInfo = values[1].data;
        this.statusHistory = values[2].data;
        this.panelCovers = values[3].data.filter(x => x.conformityId === 1000652 || x.conformityId === 1000653);
        this.frameCovers = values[3].data.filter(x => x.conformityId === 1000651 || x.conformityId === 1000653);
        this.selectedPanel = 'customer';
        this.isLoading = false;
        this.cdr.detectChanges();
    }
    private setForkJoinValuesAfterConfirm(values: Array<any>): void {
        this.orderInfo = values[0].data;
        this.statusHistory = values[2].data;
        this.isLoading = false;
        this.cdr.detectChanges();
    }
    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        if (this._router.routerState.snapshot.url.indexOf('sales/document/payment') == -1) {
            localStorage.setItem('customerId', '');
            localStorage.setItem('orderId', '');
        }

        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();

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
        this.isLoading = true;
        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');
        this.service.confirmSalesDep(this.orderInfo).subscribe(res => {
            this.isLoading = false;
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
        this.isLoading = true;
        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');
        let revoke: RevokeRequest = new RevokeRequest();
        revoke.requestIdList = [];
        revoke.requestIdList.push(this.orderInfo.orderId);
        this.service.revoke(revoke).subscribe(res => {
            this.isLoading = false;
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
        this.isLoading = true;
        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');
        let revoke: RevokeRequest = new RevokeRequest();
        revoke.requestIdList = [];
        revoke.requestIdList.push(this.orderInfo.orderId);
        this.service.rollback(revoke).subscribe(res => {
            this.isLoading = false;
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
        this.isLoading = true;
        this.orderInfo.accessKey = 'PYM_CWP';
        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');
        this.service.confirmPayment(this.orderInfo).subscribe(res => {
            this.orderInfo.accessKey = '';
            this.isLoading = false;
            this._result.succeed = res.succeed;
            this._result.message = res.message;
            if (this._result.succeed) {
                this.showAlert('successMessage');
                window.setTimeout(function () {
                    if (!this.isLoading)
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
