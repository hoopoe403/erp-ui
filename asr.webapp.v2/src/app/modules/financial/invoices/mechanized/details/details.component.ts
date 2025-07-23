import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { fuseAnimations } from "../../../../../../@fuse/animations";
import { FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { animate, state, style, transition, trigger } from "@angular/animations";
import { InvoiceService } from "../invoice.service";
import { FuseAlertService } from '@fuse/components/alert';
import { Subject, forkJoin, Observable } from 'rxjs';
import { Invoice } from '../invoice.types';
import { OpResult } from 'app/core/type/result/result.types';
import { ActivatedRoute } from '@angular/router';
import { Customer } from 'app/modules/configuration/customer/customer/customer.types';
import { HierarchicalKeyValue } from 'app/core/type/key-value/key-value.type';
import { MatMenuTrigger } from '@angular/material/menu';
@Component({
    selector: 'invoice-details',
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

export class InvoiceDetailsComponent implements OnInit, OnDestroy {
    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
    menuArray = [];
    selectedCat: number = 0;
    pageType: string;
    fadeInId: number = 0;
    progressBarColor
    animationStates: any;
    visibilityStates: any;
    titleInfo: string;
    customerInfo: Customer = new Customer();
    id: number;
    invoiceInfo: Invoice = new Invoice();
    _result: OpResult = new OpResult();

    private _unsubscribeAll: Subject<any>;
    isLoading: boolean = false;
    frmInvoice: FormGroup;
    price: number;
    constructor(
        private service: InvoiceService,
        private _formBuilder: FormBuilder,
        private cdr: ChangeDetectorRef,
        private route: ActivatedRoute,
        private _fuseAlertService: FuseAlertService
    ) {

        this._unsubscribeAll = new Subject();
        this.invoiceInfo.invoiceDetailList = [];
        // Set the default
    }

    /**
     * On init
     */
    ngOnInit(): void {
        this.pageType = 'edit';
        this.frmInvoice = this.createFormObject();
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
        this.invoiceInfo.invoiceId = Number(this.route.snapshot.paramMap.get('id'));
        forkJoin(
            this.service.getInvoice(this.invoiceInfo.invoiceId),
            // this.getFinancialCategories(),
        ).subscribe(res => {
            this.setForkJoinValues(res);
            this.isLoading = false;
            this.cdr.detectChanges();
        });

    }


    private setForkJoinValues(values: Array<any>): void {

        this.invoiceInfo = values[0].data;
        this.invoiceInfo.invoiceDetailList.forEach(element => {
            this.frmInvoice.addControl(element.invoiceDetailId.toString(), new FormControl(this.processPrice(element.unitPrice.toString())));
        });
        // this.menuArray = values[1].data;
        // this.addSelectanItemToCatMenu();
        this.titleInfo = this.invoiceInfo.requestTypeName.concat(' Invoice-').concat(this.invoiceInfo.requestCode);
    }


    private createFormObject(): FormGroup {

        return this._formBuilder.group({
            referenceNo: '',
        });
    }

    private showAlert(name: string): void {
        this._fuseAlertService.show(name);
    }

    private dismissAlert(name: string): void {
        this._fuseAlertService.dismiss(name);
    }
    private addSelectanItemToCatMenu() {
        let obj = new HierarchicalKeyValue();
        obj.id = 0;

        if (this.pageType === 'new' || (this.pageType === 'edit') &&
            (this.invoiceInfo.financialCategoryId === null || this.invoiceInfo.financialCategoryId === 0)) {
            obj.item = "";
            this.selectedCat = 0;
        }
        else {
            obj.item = this.invoiceInfo.financialCategoryName;
            this.selectedCat = this.invoiceInfo.financialCategoryId;
        }
        obj.parentId = -1;
        obj.children = [];
        for (var i = 0; i < this.menuArray.length; i++) {
            obj.children.push(this.menuArray[i]);
        }
        this.menuArray = [];
        this.menuArray.push(obj);

    }

    public setSelectedCat(selectedId: number, selectedItem: string) {
        var re = / /gi;
        selectedItem = selectedItem.replace(re, " > ");
        this.selectedCat = selectedId;
        if (selectedId > 0) {
            this.trigger.closeMenu();
            const element = document.getElementById('categorySpan');
            element.innerHTML = selectedItem;
        }
    }
    private getFinancialCategories(): Observable<any> {
        return this.service.getFinancialCategories();
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
        let result: boolean = true;
        this.invoiceInfo.referenceNo = this.frmInvoice.controls['referenceNo'].value;
        this.invoiceInfo.invoiceDetailList.forEach(element => {
            if (element.unitPrice === null || Number.isNaN(element.unitPrice) || element.unitPrice <= 0) {
                result = false;
                return result;
            }
        });
        if (!result) {
            this._result.succeed = false;
            this._result.message = "The unit price should be more than zero and can not be null";
            this.showAlert('errorMessage');
            return false;
        }


        this.invoiceInfo.financialCategoryId = 0;
        return true;
    }

    confirm() {
        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');
        if (!this.getFormInfo())
            return;
        this.service.confirm(this.invoiceInfo).subscribe(res => {
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
    setPriceInInput(price: string, invoiceDetailId: number) {
        price = price.replace(/,/g, '');
        let difference: number = 0;
        const indx = this.invoiceInfo.invoiceDetailList.findIndex(x => x.invoiceDetailId === invoiceDetailId);
        difference = parseFloat(price) * this.invoiceInfo.invoiceDetailList[indx].measure - this.invoiceInfo.invoiceDetailList[indx].total;
        this.invoiceInfo.invoiceDetailList[indx].unitPrice = parseFloat(price);
        this.invoiceInfo.invoiceDetailList[indx].total = this.invoiceInfo.invoiceDetailList[indx].measure * parseFloat(price);

        this.invoiceInfo.total = this.invoiceInfo.total + difference;
        let finalPrice: string = this.processPrice(price);
        this.frmInvoice.controls[invoiceDetailId.toString()].setValue(finalPrice);

    }

}

