import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnInit, SimpleChanges, TemplateRef, ViewChild, ViewContainerRef, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, NgModel } from '@angular/forms';
import { CustomerOrder } from '../../../order/order.types';
import { Customer } from 'app/modules/configuration/customer/customer/customer.types';
import { Overlay, OverlayRef } from "@angular/cdk/overlay";
import { TemplatePortal } from '@angular/cdk/portal';
import { Subscription, fromEvent } from 'rxjs';
import { filter, take } from "rxjs/operators";
@Component({
    selector: 'details-invoice',
    templateUrl: './invoice.component.html',
    styles: [
        /* language=SCSS */
        `
            .font-yekan {
                font-family: "Yekan"
            }
            .font-monospace
            {
                font-family: "monospace"
            }      
            .align-sub{ 
                vertical-align: sub;
            }
            tr{ 
                page-break-inside: avoid;
            }
            
            
        `
    ],
    styleUrls: ['../../../../../layout/common/right-click-menu/right-click.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetailsInvoiceComponent implements OnInit {
    @ViewChild('deliveryDaysHiddenText') deliveryDaysHiddenText: ElementRef;
    invoiceForm: FormGroup;
    orderInfo: CustomerOrder;
    @Input() orderData: any;
    customerInfo: Customer;
    @Input() customerData: any;
    showAddItem: boolean = false;
    selectedRowNumber: number = 0;
    overlayRef: OverlayRef | null;
    @ViewChild('userMenu') userMenu: TemplateRef<any>;
    sub: Subscription;
    deliveryDaysWidth: number = 8;
    /**
     * Constructor
     */
    constructor(
        private _formBuilder: FormBuilder,
        public overlay: Overlay,
        public viewContainerRef: ViewContainerRef,
        private cdr: ChangeDetectorRef,
    ) {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */

    ngOnInit(): void {
        // Create the form
        this.invoiceForm = this._formBuilder.group({
            estimatedDeliveryTime: '1'
        });
        this.orderInfo.descriptionList.forEach(element => {
            this.invoiceForm.addControl('description'.concat(element.rowNumber.toString()), new FormControl(element.description));
        });
        this.resizeDeliveryDays();
    }
    ngOnChanges(changes: SimpleChanges) {
        if ('orderData' in changes) {
            this.orderInfo = changes.orderData.currentValue;
        }
        if ('customerData' in changes) {
            this.customerInfo = changes.customerData.currentValue;
        }
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

    addNewDescription() {
        let rowNumber: number;
        if (this.orderInfo.descriptionList.length == 0)
            rowNumber = 11;
        else
            rowNumber = Math.max(...this.orderInfo.descriptionList.map(x => x.rowNumber)) + 1;
        this.orderInfo.descriptionList.push({ rowNumber: rowNumber, description: '' });
        this.invoiceForm.addControl('description'.concat(rowNumber.toString()), new FormControl(''));
    }

    removeDescription(rowNumber: number) {
        const indx = this.orderInfo.descriptionList.findIndex(x => x.rowNumber == rowNumber);
        if (indx != -1) {
            this.orderInfo.descriptionList.splice(indx, 1);
            this.orderInfo.descriptionList.filter(x => x.rowNumber > rowNumber).forEach(element => {
                element.rowNumber = element.rowNumber - 1;
            });
            this.cdr.detectChanges();
            this.close();
        }
    }

    resizeDeliveryDays() {
        setTimeout(() => {
            const minWidth = 8
            this.deliveryDaysWidth = Math.max(minWidth, this.deliveryDaysHiddenText.nativeElement.offsetWidth);
            this.cdr.detectChanges();
        })

    }
}
