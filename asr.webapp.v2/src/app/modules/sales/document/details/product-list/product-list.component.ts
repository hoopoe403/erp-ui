import { ChangeDetectionStrategy, Component, Input, OnInit, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CustomerOrder, orderProduct } from '../../../order/order.types';

@Component({
    selector: 'details-product-list',
    templateUrl: './product-list.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetailsProductListComponent implements OnInit {
    frmProductList: FormGroup;
    orderInfo: CustomerOrder;
    @Input() orderData: any;
    /**
     * Constructor
     */
    constructor(
        private _formBuilder: FormBuilder
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
        this.frmProductList = this._formBuilder.group({
            extraDiscount: '',
        });
        this.setDiscount(this.orderInfo.extraDiscount.toString());

    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }
    ngOnChanges(changes: SimpleChanges) {
        if ('orderData' in changes) {
            this.orderInfo = changes.orderData.currentValue;
        }
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
        if (result == '0')
            result = result.concat(',000');
        else if (result == '')
            result = result.concat('0,000');
        return result;
    }
    setDiscount(price: string) {
        let result: string = this.processPrice(price);
        if (result == '')
            result = '0';
        this.frmProductList.controls['extraDiscount'].setValue(result);
        result = result.replace(/,/g, '');
        this.orderInfo.extraDiscount = parseInt(result);

    }
}
