import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { fuseAnimations } from "../../../../../@fuse/animations";
import { FormBuilder, FormGroup } from "@angular/forms";
import { animate, state, style, transition, trigger } from "@angular/animations";
import { ShippedConfirmationService } from "../shipped-confirmation.service";
import { FuseAlertService } from '@fuse/components/alert';
import { Subject, forkJoin } from 'rxjs';
import { CustomerOrder } from '../../order/order.types';
import { OpResult } from 'app/core/type/result/result.types';
import { ActivatedRoute } from '@angular/router';
import { Customer } from 'app/modules/configuration/customer/customer/customer.types';
@Component({
    selector: 'shipped-confirmation-details',
    templateUrl: './details.component.html',
    animations: [fuseAnimations, trigger('detailExpand', [
        state('collapsed', style({ height: '0px', minHeight: '0' })),
        state('expanded', style({ height: '*' })),
        transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
    ],
    styles: [
        /* language=SCSS */
    ],
    encapsulation: ViewEncapsulation.None
})

export class ShipedConfirmationDetailsComponent implements OnInit, OnDestroy {
    fadeInId: number = 0;
    progressBarColor
    selectedOrderId: number;
    animationStates: any;
    visibilityStates: any;
    titleInfo: string;
    customerInfo: Customer = new Customer();
    id: number;
    orderInfo: CustomerOrder = new CustomerOrder();
    filteredCustomerOrders: Array<CustomerOrder> = new Array<CustomerOrder>();
    _result: OpResult = new OpResult();

    private _unsubscribeAll: Subject<any>;
    isLoading: boolean = false;
    frmShippedConfirmation: FormGroup;
    price: number;
    constructor(
        private service: ShippedConfirmationService,
        private _formBuilder: FormBuilder,
        private cdr: ChangeDetectorRef,
        private route: ActivatedRoute,
        private _fuseAlertService: FuseAlertService
    ) {

        this._unsubscribeAll = new Subject();
        this.orderInfo.productList = [];
        // Set the default
    }

    /**
     * On init
     */
    ngOnInit(): void {
        this.frmShippedConfirmation = this.createFormObject();
        this.loadData();
        this.isLoading = true;
        this.animationStates = {
            expandCollapse: 'expanded',
            fadeIn: {
                direction: 'in',
                in: '*',
                top: '*',
                bottom: '*',
                left: '*',
                right: '*'
            },
            fadeOut: {
                direction: 'out',
                out: '*',
                top: '*',
                bottom: '*',
                left: '*',
                right: '*'
            },
        };
        this.visibilityStates = {
            expandCollapse: true, fadeIn: {
                in: true,
                top: true,
                bottom: true,
                left: true,
                right: true
            },
            fadeOut: {
                out: true,
                top: true,
                bottom: true,
                left: true,
                right: true
            }
        };
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
        localStorage.setItem('customerId', '');
    }
    private loadData() {
        this.orderInfo.orderId = Number(this.route.snapshot.paramMap.get('id'));
        forkJoin(
            this.service.getOrderInfo(this.orderInfo.orderId),
        ).subscribe(res => {
            this.setForkJoinValues(res);
        });

    }



    private setForkJoinValues(values: Array<any>): void {
        this.isLoading = false;
        this.orderInfo = values[0].data;
        this.getCustomerInfo(this.orderInfo.customerId);
        //  this.filteredCustomerOrders = values[0].data;
        //  this.customerInfo = values[2].data;

    }

    private getCustomerInfo(customerId: number) {
        this.service.getCustomerInfo(customerId).subscribe(res => {
            this.customerInfo = res.data;
            this.isLoading = false;
            this.titleInfo = this.customerInfo.customerName.concat(' ').concat(this.customerInfo.customerFamily).concat('-').concat(this.orderInfo.orderCode);
            this.cdr.detectChanges();
        });;
    }

    private createFormObject(): FormGroup {

        return this._formBuilder.group({

        });
    }

    private showAlert(name: string): void {
        this._fuseAlertService.show(name);
    }

    private dismissAlert(name: string): void {
        this._fuseAlertService.dismiss(name);
    }

    processPrice(price: string): string {
        let result: string;
        let counter: number = 0;
        price = price.replace(/,/g, '');
        if (!/^\d+$/.test(price)) {
            result = price.substring(0, price.length - 1);

        }
        else {

            for (let index = price.length; index > 0; index--) {

                if (index === price.length)
                    result = price.substring(index - 1, index);
                else {
                    if (counter % 3 === 0)
                        result = ','.concat(result);

                    result = price.substring(index - 1, index).concat(result);
                }
                counter = counter + 1;
            }
        }

        return result;
    }

    private getFormInfo(): boolean {
        this.orderInfo.paymentAdjustmentList = [];
        return true;
    }

    confirm() {
        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');
        this.getFormInfo();
        this.service.confirm(this.orderInfo).subscribe(res => {
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

    trackByFn(index: number, item: any): any {
        return item.id || index;
    }
    private toggleAnimationState(animation: string, firstState: string | boolean, secondState: string | boolean, timeout: number = 500): void {
        // Split the animation
        const animationPath = animation.split('.');

        // Toggle the animation state
        this.animationStates[animationPath[0]][animationPath[1]] = firstState;

        setTimeout(() => {
            this.animationStates[animationPath[0]][animationPath[1]] = secondState;
        }, timeout);
    }


}

