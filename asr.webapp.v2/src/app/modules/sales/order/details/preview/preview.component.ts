import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { CustomerOrder, orderProduct, OrderProductInfo } from '../../order.types';
import { Product } from 'app/modules/configuration/branding/product/product.types';
import { OrderService } from '../../order.service';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { fuseAnimations } from '@fuse/animations';

@Component({
    selector: 'details-preview',
    templateUrl: './preview.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [fuseAnimations, trigger('detailExpand', [
        state('collapsed', style({ height: '0px', minHeight: '0' , opacity: 0 })),
        state('expanded', style({ height: '*' , opacity : 1})),
        transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
    ],
    styles: [
        `
         .goods-grid-list {
            grid-template-columns:  75px 300px auto;

            @screen sm {
                grid-template-columns: 48px auto 112px 72px;
            }

            @screen md {
                grid-template-columns:   auto  100px 90px 150px 50px 50px ;
            }

            @screen lg {
                grid-template-columns:   auto  100px 90px 150px 50px 50px ;
            }
        }
        `
        ],
})
export class DetailsPreviewComponent implements OnInit {
    isHovered = false;
    disabledPanelCoverId : number;
    disabledFrameCoverId : number;
    showTotalPerItem: boolean = false;
    isExpanded: boolean = false;
    expandedList: Array<number> = [];
    frmPreviewList: FormGroup;
    orderInfo: CustomerOrder;
    selectedInfoRow : CustomerOrder
    selectedCoverId: string | null = null;
    panelCover = [
        {accessKey: null,
            changeDate: null,
            clientIP: "127.0.0.1",
            conformityId: 1000653,
            coverId: 0,
            coverName: "1013/Oyster white/Glossy",
            language: "EN",
            localChangeDate: "1400/01/01",
            localChangeTime: "12:00:00",
            registerUserID:  "1000120",
            registerUserName:  "admin",
            status: 1000001,
            token: null},
        {accessKey: null,
                changeDate: null,
                clientIP: "127.0.0.1",
                conformityId: 1000653,
                coverId: 10005631,
                coverName: "1013/Oyster white/Leather",
                language: "EN",
                localChangeDate: "1400/01/01",
                localChangeTime: "12:00:00",
                registerUserID:  "1000120",
                registerUserName:  "admin",
                status: 1000001,
                token: null}
    ];
    public orderProducts: Array<OrderProductInfo> = [];
    @Input() orderData: any;
    /**
     * Constructor
     */
    constructor(
        private _formBuilder: FormBuilder,
        public service: OrderService,
        private cdr: ChangeDetectorRef
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
        this.frmPreviewList = this._formBuilder.group({
            extraDiscount: '',
        });
      
            // console.log(this.service.getFrameCovers());
        this.setDiscount(this.orderInfo.extraDiscount?.toString());
        if (this.service.getIsActionDisabled())
            this.toggleFormControls();
        else
            this.getProductInfoBasedOnChanges();

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
        // console.log(this.orderInfo.productList);
    }
    processPrice(price: string): string {
        let result: string;
        let counter: number = 0;
        price = price != undefined ? price : '0';
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
        this.frmPreviewList.controls['extraDiscount'].setValue(result);
        result = result.replace(/,/g, '');
        this.orderInfo.extraDiscount = parseInt(result);

    }


    // private addControlWithUniqueName(baseName: string, defaultValue: any, validator?: any): void {
    //     let uniqueName = baseName;
    //     let counter = 1;
    
        
    //     while (this.frmPreviewList.contains(uniqueName)) {
    //         uniqueName = `${baseName}_${counter}`;
    //         counter++;
    //     }
    
 
    //     this.frmPreviewList.addControl(uniqueName, new FormControl(defaultValue, validator));
    // }

    addSameRecord(product){
                const obj = this.orderInfo.productList.filter(x => x == product)[0];
                this.orderInfo.productList.push({
                    productId:  obj.productId , productName: obj.productName,
                    brandId:  obj.brandId, brandName: obj.brandName, unitPrice:obj.unitPrice , panelCoverName: '',
                    productCoverName: '', productCoverId: 0, panelCoverId: 0, controlId: this.generateUniqueId(),
                    orderDetailId: 0, orderDetailNumber: 0, orderId: 0, panelCoverPrice: null,
                    productCoverPrice: null, quantity: 1 , rowNumber: 0, frameConformity: 1,
                    panelConformity: 1 
                });
            this.disabledPanelCoverId = obj.panelCoverId;
            // this.disabledFrameCoverId = obj.frameCoverId;
            const lastValue = this.orderInfo.productList[this.orderInfo.productList.length - 1];
            this.addFormControl(lastValue);
    }

    removeSameRecord(product){
        const index  = this.orderInfo.productList.findIndex(x => x.controlId == product.controlId);
        if (index  !== -1) {
            const obj = this.orderInfo.productList.splice(index, 1)[0];
            this.frmPreviewList.removeControl('pq'.concat(obj.controlId))
            if (obj.frameConformity == 1) {
                this.frmPreviewList.removeControl('fc'.concat(obj.controlId));
                this.frmPreviewList.removeControl('fcp'.concat(obj.controlId));
            }
            if (obj.panelConformity == 1) {
                this.frmPreviewList.removeControl('pc'.concat(obj.controlId));
                this.frmPreviewList.removeControl('pcp'.concat(obj.controlId));
            }
        }
        this.onSubTotalChange();
    }

    addFormControl(element){
        this.frmPreviewList.addControl('pq'.concat(element.controlId), new FormControl('', Validators.required));
        if (element.frameConformity == 1) {
            this.frmPreviewList.addControl('fc'.concat(element.controlId), new FormControl('', Validators.required));
            this.frmPreviewList.addControl('fcp'.concat(element.controlId), new FormControl('', Validators.required));
        }
        if (element.panelConformity == 1) {
            this.frmPreviewList.addControl('pc'.concat(element.controlId), new FormControl('', Validators.required));
            this.frmPreviewList.addControl('pcp'.concat(element.controlId), new FormControl('', Validators.required));
        }
    }

    private generateUniqueId(): string {
        return Date.now() + Math.floor(Math.random() * 1000).toString(); 
    }

    private toggleFormControls() {
        this.orderInfo.productList.forEach(element => {
            if (!this.service.getIsActionDisabled()) {
                const obj = this.service.getSelectedPoducts().filter(x => x.productId == element.productId)[0];
                element.brandId = obj.brandId;
                element.brandName = obj.brandName;
                element.productName = obj.productName;
                element.unitPrice = obj.price;
            }
            element.controlId = this.generateUniqueId();
            this.addFormControl(element);
        });
        this.onSubTotalChange();
    }
    sortProductList(property: string) {
        this.orderInfo.productList.sort((a, b) => {
            if (a[property] < b[property]) {
                return -1;
            } else if (a[property] > b[property]) {
                return 1;
            } else {
                return 0;
            }
        });

        this.cdr.detectChanges();
    }
    private getProductInfoBasedOnChanges(): void {
        const newProducts = this.orderInfo.productList.filter(x => !this.service.getSelectedPoducts().some(y => y.productId == x.productId));
        let obj: Product = new Product();
        obj.productIdList = newProducts.map(x => x.productId);
        this.service.setSelectedPoducts(this.service.getSelectedPoducts().filter(x => this.orderInfo.productList.some(y => y.productId == x.productId)));
        this.service.isLoading = true;
        this.cdr.detectChanges();
        if (obj.productIdList.length > 0)
            this.service.getProductsInfo(obj).subscribe(res => {
                this.service.setSelectedPoducts([...this.service.getSelectedPoducts(), ...res.data]);
                this.toggleFormControls();
                this.service.isLoading = false;
                this.cdr.detectChanges();
            });
        else {
            this.toggleFormControls();
            this.service.isLoading = false;
            this.cdr.detectChanges();
        }

    }
    onSubTotalChange() {
        this.orderInfo.subTotal = this.orderInfo.productList.reduce((sum, item) => sum + item.unitPrice * item.quantity + item.quantity * item.productCoverPrice + item.quantity * item.panelCoverPrice, 0);
    }

    checkIfExpanded(element : orderProduct): boolean {
        if (this.expandedList.findIndex(x => x === element.productId) === -1)
            return false;
          else
            return true;
    }

    toggleRow(element: orderProduct) {
        const indx = this.expandedList.findIndex(x => x === element.productId);
        if (indx === -1)
          this.expandedList.push(element.productId);
        else
          this.expandedList.splice(indx, 1);
    }

}
