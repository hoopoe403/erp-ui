import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { fuseAnimations } from "../../../../../@fuse/animations";
import { AbstractControl, FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { animate, state, style, transition, trigger } from "@angular/animations";
import { DocumentService } from "../document.service";
import { FuseAlertService } from '@fuse/components/alert';
import { Subject, forkJoin } from 'rxjs';
import { CustomerOrder, Budget, customerPayment } from '../../order/order.types';
import { OpResult } from 'app/core/type/result/result.types';
import { ActivatedRoute, Router } from '@angular/router';
import { Customer } from 'app/modules/configuration/customer/customer/customer.types';
import { DialogService } from './dialog.service';
@Component({
    selector: 'payment',
    templateUrl: './payment.component.html',
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

export class PaymentComponent implements OnInit, OnDestroy {
    fadeInId: number = 0;
    progressBarColor
    selectedOrderId: number;
    animationStates: any;
    visibilityStates: any;
    titleInfo: string;
    customerPayment: Array<customerPayment> = [];
    customerInfo: Customer = new Customer();
    id: number;
    paymentInfo: CustomerOrder = new CustomerOrder();
    customerOrders: Array<CustomerOrder> = new Array<CustomerOrder>();
    filteredCustomerOrders: Array<CustomerOrder> = new Array<CustomerOrder>();
    customerBudget: Budget = new Budget();
    _result: OpResult = new OpResult();
    private _unsubscribeAll: Subject<any>;
    isLoading: boolean = false;
    frmPayment: FormGroup;
    price: number;
    selectedInfoRow: CustomerOrder = new CustomerOrder();
    constructor(
        private service: DocumentService,
        private _formBuilder: FormBuilder,
        private cdr: ChangeDetectorRef, private _dialogService: DialogService,
        private _fuseAlertService: FuseAlertService,
        private _router: Router
    ) {

        this._unsubscribeAll = new Subject();
        this.customerBudget.balance = 0;
        // Set the default
    }

    /**
     * On init
     */
    ngOnInit(): void {
        this.frmPayment = this.createFormObject();
        this.isLoading = true;
        this.loadData();
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
        this.service.disposeDocuments$();
        this.service.disponsePaginator$();
        if (this._router.routerState.snapshot.url.indexOf('sales/document/details') == -1) {
            localStorage.setItem('customerId', '');
            localStorage.setItem('orderId', '');
        }

    }
    private loadData() {
        this.paymentInfo.customerId = parseInt(localStorage.getItem('customerId'));

        forkJoin(
            this.service.getCustomerOrders(this.paymentInfo),
            this.service.getCustomerBudget(this.paymentInfo.customerId),
            this.service.getCustomerInfo(this.paymentInfo.customerId),
        ).subscribe(res => {
            this.setForkJoinValues(res);
            this.isLoading = false;
            this.cdr.detectChanges();
        });

    }
    private getById(id: number) {
        this.isLoading = true;

        forkJoin(
        ).subscribe(res => {
            this.setForkJoinValuesInEditMode(res);
            this.isLoading = false;
            this.setFormValues();
            this.cdr.detectChanges();
        });

    }

    private setFormValues() {

    }


    private setForkJoinValues(values: Array<any>): void {
        this.isLoading = false;
        this.customerOrders = values[0].data;
        this.filteredCustomerOrders = values[0].data;
        this.customerBudget = values[1].data[0];
        this.customerInfo = values[2].data;
        this.titleInfo = this.customerInfo.customerName.concat(' ').concat(this.customerInfo.customerFamily);

        this.customerOrders.forEach(order => {
            this.frmPayment.addControl(order.orderId.toString(), new FormControl(''));
            this.frmPayment.controls[order.orderId.toString()].disable();
        });
    }

    private setForkJoinValuesInEditMode(values: Array<any>): void {
    }

    private createFormObject(): FormGroup {

        return this._formBuilder.group({
            amount: '',
        });
    }

    private showAlert(name: string): void {
        this._fuseAlertService.show(name);
    }

    private dismissAlert(name: string): void {
        this._fuseAlertService.dismiss(name);
    }

    setPriceInInput(price: number, orderId: number) {


        let finalPrice: string;
        price = Math.ceil(price);
        finalPrice = this.processPrice(price.toString(), true);
        if (this.customerBudget.balance + this.customerBudget.credit < price)
            return;

        this.frmPayment.controls[orderId.toString()].setValue(finalPrice);
        const indx = this.customerPayment.findIndex(x => x.orderId === orderId);
        if (price == 0 && indx !== -1) {
            const increaseAmount: number = Number(this.customerPayment[indx].paymentSet);
            this.customerBudget.balance = this.customerBudget.balance + increaseAmount;
            this.customerPayment.splice(indx, 1);
        }
        else if (price != 0 && indx !== -1) {
            const increaseAmount: number = Number(this.customerPayment[indx].paymentSet);
            this.customerPayment[indx].paymentSet = price;
            this.customerBudget.balance = this.customerBudget.balance + increaseAmount - price;
        }
        else if (price != 0 && indx === -1) {
            this.customerPayment.push({ orderId: orderId, paymentSet: price });
            this.customerBudget.balance = this.customerBudget.balance - price;
        }
        this.cdr.detectChanges();

    }
    processPrice(price: string, setPrice: boolean) {
        let result: string;
        let counter: number = 0;
        let decimalPart: string;
        price = price.replace(/,/g, '');
        price = Number(price).toFixed(2);
        decimalPart = price.toString().substring(price.toString().indexOf('.', 0) + 1);
        price = Number(price).toFixed(0);
        if (setPrice)
            this.price = Number(price);
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


        return result.concat('.').concat(decimalPart);
    }
    getNewPaymentSet(orderId: number): number {
        const indx = this.customerPayment.findIndex(x => x.orderId === orderId);
        if (indx === -1)
            return 0;
        else
            return this.customerPayment[indx].paymentSet;

    }
    private getFormInfo(): boolean {
        this.paymentInfo.paymentAdjustmentList = [];
        this.customerPayment.forEach(element => {
            if (element.paymentSet !== null && element.paymentSet > 0)
                this.paymentInfo.paymentAdjustmentList.push(element);
        });
        return true;
    }

    confirm() {
        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');
        this.getFormInfo();
        this.service.paymentAdjustment(this.paymentInfo).subscribe(res => {
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
    selectOrder(orderId: number) {
        this.animationStates.expandCollapse = 'collapsed';
        this.selectedOrderId = orderId;
        this.animationStates.expandCollapse = 'expanded';
    }
    clearAdjustment(orderId: number) {
        this.setPriceInInput(0, orderId);
    }
    showClearIcon(orderId: number) {
        this.fadeInId = orderId;
        this.toggleAnimationState('fadeOut.out', 'void', '*');

    }
    hideClearIcon() {
        this.fadeInId = 0;
        this.toggleAnimationState('fadeIn.in', 'void', '*');
    }
    applyFilterOnCustomerOrders(filterValue: string) {
        this.filteredCustomerOrders = this.customerOrders.filter(item =>
            item.orderCode.toLowerCase().includes(filterValue.toLowerCase())
            || item.orderTypeName.toLocaleLowerCase().includes(filterValue.toLowerCase())
            || item.rowQuantity.toString().toLocaleLowerCase().includes(filterValue.toLowerCase())
            || item.productQuantity.toString().toLocaleLowerCase().includes(filterValue.toLowerCase())
            || item.total.toString().toLocaleLowerCase().includes(filterValue.toLowerCase())
            || item.paidAmount.toString().toLocaleLowerCase().includes(filterValue.toLowerCase())
            || (item.total - item.paidAmount).toString().toLocaleLowerCase().includes(filterValue.toLowerCase()));

    }
    openDetailDialog(requestId: number) {
        let configForm: FormGroup = this._formBuilder.group({
            requestId: requestId,
            requestTypeId: 0,
            title: 'Order Details '
        });
        const dialogRef = this._dialogService.open(configForm.value);
        dialogRef.afterClosed().subscribe((result) => {
            /*    if (result !== 'cancelled')
                   this.categoryTreeModification(result, 0, 0, 'new'); */
        });
    }
    paymentConfirmation(orderId: number) {
        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');
        this.paymentInfo.orderId = orderId;
        this.paymentInfo.accessKey = 'PYM_CWP';
        this.service.confirmPayment(this.paymentInfo).subscribe(res => {
            this.isLoading = false;
            this._result.succeed = res.succeed;
            this._result.message = res.message;
            if (this._result.succeed) {
                this.showAlert('successMessage');
                this.paymentInfo.orderId = null;
            }
            else
                this.showAlert('errorMessage');
            this.cdr.detectChanges();
        });
    }
}

