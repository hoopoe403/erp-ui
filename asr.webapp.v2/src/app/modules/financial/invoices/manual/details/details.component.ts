import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { fuseAnimations } from "../../../../../../@fuse/animations";
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidatorFn } from "@angular/forms";
import { animate, state, style, transition, trigger } from "@angular/animations";
import { ManualInvoiceService } from "../manual-invoice.service";
import { FuseAlertService } from '@fuse/components/alert';
import { Subject, forkJoin, Observable } from 'rxjs';
import { ManualInvoice, ManualInvoiceDetail } from '../manual-invoice.types';
import { OpResult } from 'app/core/type/result/result.types';
import { ActivatedRoute } from '@angular/router';
import { HierarchicalKeyValue } from 'app/core/type/key-value/key-value.type';
import { MatMenuTrigger } from '@angular/material/menu';
import { Owner, OwnerType } from 'app/modules/configuration/owner/owner.types';
import { map, startWith } from 'rxjs/operators';
import * as moment from "jalali-moment";

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

export class ManualInvoiceDetailsComponent implements OnInit, OnDestroy {
    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
    showAddItem: boolean = false;
    debtorFilteredOptions: Observable<Owner[]>;
    creditorFilteredOptions: Observable<Owner[]>;
    debtors: Array<Owner>;
    creditors: Array<Owner>;
    debtorControl = new FormControl();
    creditorControl = new FormControl();
    pageType: string;
    id: number = 0;
    menuArray = [];
    selectedCat: number = 0;
    invoiceInfo: ManualInvoice = new ManualInvoice();
    _result: OpResult = new OpResult();
    titleInfo: string;
    private _unsubscribeAll: Subject<any>;
    isLoading: boolean = false;
    actionDisable: boolean = false;
    frmInvoice: FormGroup;
    price: number;
    dateObject;
    ownerTypes: Array<OwnerType>;
    @ViewChild('jdatepicker') myDiv: ElementRef<HTMLElement>;

    constructor(
        private service: ManualInvoiceService,
        private _formBuilder: FormBuilder,
        private cdr: ChangeDetectorRef,
        private route: ActivatedRoute,
        private _fuseAlertService: FuseAlertService
    ) {
        this.debtors = new Array<Owner>();
        this.creditors = new Array<Owner>();
        this._unsubscribeAll = new Subject();
        this.invoiceInfo.manualInvoiceDetailList = [];
        // Set the default

    }

    /**
     * On init
     */
    ngOnInit(): void {
        this.debtorFilteredOptions = this.debtorControl.valueChanges.pipe(
            startWith(''),
            map(value => this._debtorFilter(value))
        );
        this.creditorFilteredOptions = this.creditorControl.valueChanges.pipe(
            startWith(''),
            map(value => this._creditorFilter(value))
        );
        this.frmInvoice = this.createFormObject();
        this.isLoading = true;
        this.id = Number(this.route.snapshot.paramMap.get('id'));
        if (this.id > 0) {
            this.pageType = 'edit';
            this.getById(this.id);

        }
        else {
            this.invoiceInfo.total = 0;
            this.invoiceInfo.subTotal = 0;
            this.invoiceInfo.discount = 0;
            this.frmInvoice.controls['discount'].setValue('0,000');
            this.titleInfo = 'Register New Manual Invoice';
            this.pageType = 'new';
            this.loadData();
        }
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }
    private loadData() {
        forkJoin(
            this.getFinancialCategories(),
            this.getOwnerTypes(),
        ).subscribe(res => {
            this.setForkJoinValues(res);
            this.isLoading = false;
            this.cdr.detectChanges();
        });

    }
    private getById(id: number) {
        this.isLoading = true;

        forkJoin(
            this.getManualInvoice(id),
            this.getFinancialCategories(),
            this.getOwnerTypes(),
        ).subscribe(res => {
            this.setForkJoinValuesInEditMode(res);
            this.setFormValues();
        });

    }
    private getOwnerTypes(): Observable<any> {
        return this.service.getOwnerTypes();
    }
    private setForkJoinValues(values: Array<any>): void {
        this.menuArray = values[0].data;
        this.ownerTypes = values[1].data;
        // this.addOthersToContractors();
        this.addSelectanItemToCatMenu();
    }

    private setForkJoinValuesInEditMode(values: Array<any>): void {
        this.invoiceInfo = values[0].data;
        this.menuArray = values[1].data;
        this.ownerTypes = values[2].data;
        //this.addOthersToContractors();
        this.addSelectanItemToCatMenu();
        this.titleInfo = this.invoiceInfo.debtorName.concat('-').concat(this.invoiceInfo.debtorTypeName);
        this.frmInvoice.controls['creditorType'].setValue(this.invoiceInfo.creditorTypeId);
        this.frmInvoice.controls['debtorType'].setValue(this.invoiceInfo.debtorTypeId);
        this.isLoading = true;
        forkJoin(
            this.getDebtorsWithoutSubscribe(this.invoiceInfo.debtorTypeId),
            this.getCreditorsWithoutSubscriber(this.invoiceInfo.creditorTypeId),
        ).subscribe(res => {
            this.debtors = res[0].data;
            this.debtorControl.setValidators(debtorForbiddenNamesValidator(this.debtors));
            this.creditors = res[1].data;
            this.creditorControl.setValidators(creditorForbiddenNamesValidator(this.creditors));
            this.isLoading = false;
            this.cdr.detectChanges();
        });

    }
    private setFormValues() {
        this.debtorControl.setValue(this.invoiceInfo.debtorName);
        let debtorEvent: {
            isUserInput: any;
            source: { value: any; selected: any };
        } = { isUserInput: true, source: { value: this.invoiceInfo.debtorName, selected: true } };
        this.setDebtor(debtorEvent);
        if (this.invoiceInfo.creditorId !== 0) {
            this.creditorControl.setValue(this.invoiceInfo.creditorName);
            let creditorEvent: {
                isUserInput: any;
                source: { value: any; selected: any };
            } = { isUserInput: true, source: { value: this.invoiceInfo.creditorName, selected: true } };
            this.setCreditor(creditorEvent);
        }
        this.frmInvoice.controls["title"].setValue(this.invoiceInfo.title);
        this.frmInvoice.controls["description"].setValue(this.invoiceInfo.invoiceDescription);
        this.setDiscount(this.invoiceInfo.discount.toString());
        this.dateObject = moment(this.invoiceInfo.invoiceLocalDate, "jYYYY,jMM,jDD");

        this.invoiceInfo.manualInvoiceDetailList.forEach(element => {
            this.frmInvoice.addControl('item'.concat(element.manualInvoiceDetailId.toString()), new FormControl(element.itemDesc));
            this.frmInvoice.addControl('rate'.concat(element.manualInvoiceDetailId.toString()), new FormControl(this.processPrice(element.unitPrice.toString())));
            this.frmInvoice.addControl('qty'.concat(element.manualInvoiceDetailId.toString()), new FormControl(element.measure));
        });


    }
    private createFormObject(): FormGroup {

        return this._formBuilder.group({
            jdatepicker: '',
            title: '',
            description: '',
            creditorType: '',
            debtorType: '',
            discount: '',
        });
    }

    private showAlert(name: string): void {
        this._fuseAlertService.show(name);
    }

    private dismissAlert(name: string): void {
        this._fuseAlertService.dismiss(name);
    }
    setCreditorTypeValue(event: {
        isUserInput: any;
        source: { value: any; };
    }) {

        if (event.isUserInput) {
            this.invoiceInfo.creditorTypeId = event.source.value;
            this.getCreditors(event.source.value);
        }


    }
    setDebtorTypeValue(event: {
        isUserInput: any;
        source: { value: any; };
    }) {

        if (event.isUserInput) {
            this.invoiceInfo.debtorTypeId = event.source.value;
            this.getDebtors(event.source.value);
        }


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
            obj.item = "";
            this.setSelectedCat(this.invoiceInfo.financialCategoryId, this.invoiceInfo.financialCategoryName, false);

        }
        obj.parentId = -1;
        obj.children = [];
        for (var i = 0; i < this.menuArray.length; i++) {
            obj.children.push(this.menuArray[i]);
        }
        this.menuArray = [];
        this.menuArray.push(obj);

    }

    public setSelectedCat(selectedId: number, selectedItem: string, closeMenu: boolean) {

        var re = / /gi;
        selectedItem = selectedItem.replace(re, " > ");
        this.selectedCat = selectedId;
        if (selectedId > 0) {
            if (closeMenu)
                this.trigger.closeMenu();
            const element = document.getElementById('categorySpan');
            element.innerHTML = selectedItem;
        }
    }

    private getManualInvoice(id: number): Observable<any> {
        return this.service.getManualInvoice(id);
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
        if (result == '0')
            result = result.concat(',000');
        else if (result == '')
            result = result.concat('0,000');
        return result;
    }

    private getFormInfo(): boolean {
        let result: boolean = true;
        if (this.invoiceInfo.manualInvoiceDetailList.length <= 0) {
            this._result.succeed = false;
            this._result.message = "At least one item in the invoice should be entered";
            this.showAlert('errorMessage');
            return false;
        }
        this.invoiceInfo.manualInvoiceDetailList.forEach(element => {
            element.itemDesc = this.frmInvoice.controls['item'.concat(element.manualInvoiceDetailId.toString())].value;
            if (element.unitPrice === null || Number.isNaN(element.unitPrice) || element.unitPrice <= 0
                || element.itemDesc === null || element.itemDesc == '' ||
                element.measure === null || Number.isNaN(element.measure) || element.measure <= 0) {
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
        if (this.selectedCat === 0) {
            this._result.succeed = false;
            this._result.message = "Please select a financial category";
            this.showAlert('errorMessage');
            return false;
        }

        this.invoiceInfo.financialCategoryId = this.selectedCat;
        this.invoiceInfo.title = this.frmInvoice.controls['title'].value;
        this.invoiceInfo.invoiceDescription = this.frmInvoice.controls['description'].value;
        if (this.invoiceInfo.title == null || this.invoiceInfo.title == '') {
            this._result.succeed = false;
            this._result.message = "Please enter the title";
            this.showAlert('errorMessage');
            return false;
        }
        if (typeof (this.dateObject) == 'string')
            this.invoiceInfo.invoiceLocalDate = this.dateObject;
        else
            this.invoiceInfo.invoiceLocalDate = this.dateObject.format('jYYYY/jMM/jD');

        if (this.invoiceInfo.invoiceLocalDate == null || this.invoiceInfo.invoiceLocalDate == '') {
            this._result.succeed = false;
            this._result.message = "Please enter the date";
            this.showAlert('errorMessage');
            return false;
        }
        let { debtorResult, debtorId } = this.getdebtorId();
        if (!debtorResult || debtorId === 0) {
            this._result.succeed = false;
            this._result.message = 'Please select a debtor';
            this.showAlert('errorMessage');
            return false
        }

        let { creditorResult, creditorId } = this.getcreditorId();
        if (!creditorResult || creditorId === 0) {
            this._result.succeed = false;
            this._result.message = 'Please select a creditor';
            this.showAlert('errorMessage');
            return false
        }


        this.invoiceInfo.debtorId = debtorId;
        this.invoiceInfo.creditorId = creditorId;

        return true;
    }
    save() {
        let formResult: boolean;
        formResult = this.getFormInfo();
        if (!formResult)
            return;
        if (this.pageType === 'new')
            this.create();
        else
            this.edit();
    }
    create() {
        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');
        this.isLoading = true;
        this.actionDisable = true;
        this.service.create(this.invoiceInfo).subscribe(res => {
            this.isLoading = false;
            this._result.succeed = res.succeed;
            this._result.message = res.message;
            if (this._result.succeed)
                this.showAlert('successMessage');
            else {
                this.actionDisable = false;
                this.showAlert('errorMessage');
            }
            this.cdr.detectChanges();
        });
    }

    edit() {
        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');
        this.isLoading = true;
        this.actionDisable = true;
        this.service.edit(this.invoiceInfo).subscribe(res => {
            this.isLoading = false;
            this.actionDisable = false;
            this._result.succeed = res.succeed;
            this._result.message = res.message;
            if (this._result.succeed)
                this.showAlert('successMessage');
            else
                this.showAlert('errorMessage');
            this.cdr.detectChanges();
        });
    }
    confirm() {
        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');
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

    setUnitPrice(price: string, invoiceDetailId: number) {
        if (price == '')
            return;
        price = price.replace(/,/g, '');
        let difference: number = 0;
        const indx = this.invoiceInfo.manualInvoiceDetailList.findIndex(x => x.manualInvoiceDetailId === invoiceDetailId);
        difference = parseFloat(price) * this.invoiceInfo.manualInvoiceDetailList[indx].measure - this.invoiceInfo.manualInvoiceDetailList[indx].total;
        this.invoiceInfo.manualInvoiceDetailList[indx].unitPrice = parseFloat(price);
        this.invoiceInfo.manualInvoiceDetailList[indx].total = this.invoiceInfo.manualInvoiceDetailList[indx].measure * parseFloat(price);

        this.invoiceInfo.subTotal = this.invoiceInfo.subTotal + difference;
        let finalPrice: string = this.processPrice(price);
        this.frmInvoice.controls['rate'.concat(invoiceDetailId.toString())].setValue(finalPrice);

    }

    setMeasure(measure: string, invoiceDetailId: number) {
        if (measure == '')
            return;
        let difference: number = 0;
        const indx = this.invoiceInfo.manualInvoiceDetailList.findIndex(x => x.manualInvoiceDetailId === invoiceDetailId);
        difference = parseFloat(measure) * this.invoiceInfo.manualInvoiceDetailList[indx].unitPrice - this.invoiceInfo.manualInvoiceDetailList[indx].total;
        this.invoiceInfo.manualInvoiceDetailList[indx].measure = parseFloat(measure);
        this.invoiceInfo.manualInvoiceDetailList[indx].total = this.invoiceInfo.manualInvoiceDetailList[indx].unitPrice * parseFloat(measure);

        this.invoiceInfo.subTotal = this.invoiceInfo.subTotal + difference;


    }
    setDiscount(price: string) {
        let result: string = this.processPrice(price);
        if (result == '')
            result = '0';
        this.frmInvoice.controls['discount'].setValue(result);
        result = result.replace(/,/g, '');
        this.invoiceInfo.discount = parseInt(result);

    }


    private _debtorFilter(value: string): Owner[] {
        const filterValue = value.toLowerCase().replace(' ', '');
        return this.debtors.filter(option => option.ownerName.toLowerCase().replace(' ', '').includes(filterValue));
    }
    private getDebtors(creditorTypeId: number) {
        this.isLoading = true;
        this.debtors = [];
        this.service.getDebtors(creditorTypeId).subscribe(res => {
            this.debtors = res.data;
            this.debtorControl.setValidators(debtorForbiddenNamesValidator(this.debtors));
            this.isLoading = false;
            this.cdr.detectChanges();
        });
    }
    private getDebtorsWithoutSubscribe(creditorTypeId: number): Observable<any> {
        this.isLoading = true;
        this.debtors = [];
        return this.service.getDebtors(creditorTypeId);
    }
    setDebtor(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            const indx = this.debtors.findIndex(x => x.ownerName.toLowerCase().replace(/\s/g, "")
                === event.source.value.toLowerCase().replace(/\s/g, ""));
            if (indx === -1) {
                return;
            }

        }

    }
    private _creditorFilter(value: string): Owner[] {
        const filterValue = value.toLowerCase().replace(' ', '');
        return this.creditors.filter(option => option.ownerName.toLowerCase().replace(' ', '').includes(filterValue));
    }
    private getCreditors(creditorTypeId: number) {
        this.creditors = [];
        this.isLoading = true;
        this.service.getCreditors(creditorTypeId).subscribe(res => {
            this.creditors = res.data;
            this.creditorControl.setValidators(creditorForbiddenNamesValidator(this.creditors));
            this.isLoading = false;
            this.cdr.detectChanges();
        });
    }
    private getCreditorsWithoutSubscriber(creditorTypeId: number): Observable<any> {
        this.creditors = [];
        this.isLoading = true;
        return this.service.getCreditors(creditorTypeId);
    }
    setCreditor(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            const indx = this.creditors.findIndex(x => x.ownerName.toLowerCase().replace(/\s/g, "")
                === event.source.value.toLowerCase().replace(/\s/g, ""));
            if (indx === -1) {
                return;
            }

        }
    }
    addNewItem() {
        let detail: ManualInvoiceDetail = new ManualInvoiceDetail();
        detail.manualInvoiceDetailId = - (this.invoiceInfo.manualInvoiceDetailList.length + 1);
        detail.measure = 1;
        detail.unitPrice = 0;
        detail.total = 0;
        detail.rowNumber = this.invoiceInfo.manualInvoiceDetailList.length + 1;
        this.frmInvoice.addControl('item'.concat(detail.manualInvoiceDetailId.toString()), new FormControl(''));
        this.frmInvoice.addControl('rate'.concat(detail.manualInvoiceDetailId.toString()), new FormControl('0'));
        this.frmInvoice.addControl('qty'.concat(detail.manualInvoiceDetailId.toString()), new FormControl('1'));
        this.invoiceInfo.manualInvoiceDetailList.push(detail);
    }
    removeItem(manualInvoiceDetailId: number) {
        const indx = this.invoiceInfo.manualInvoiceDetailList.findIndex(x => x.manualInvoiceDetailId === manualInvoiceDetailId);
        this.invoiceInfo.subTotal = this.invoiceInfo.subTotal -
            (this.invoiceInfo.manualInvoiceDetailList[indx].total == null ? 0 : this.invoiceInfo.manualInvoiceDetailList[indx].total);
        this.frmInvoice.removeControl('item'.concat(manualInvoiceDetailId.toString()));
        this.frmInvoice.removeControl('rate'.concat(manualInvoiceDetailId.toString()));
        this.frmInvoice.removeControl('qty'.concat(manualInvoiceDetailId.toString()));
        this.invoiceInfo.manualInvoiceDetailList.splice(indx, 1);
    }

    private getdebtorId() {
        let debtorResult: boolean;
        let debtorId: number;
        if (this.debtorControl.value === null) {
            debtorResult = true;
            debtorId = -1;
        }
        else {
            const indx = this.debtors.findIndex(x => x.ownerName.toLowerCase().replace(/\s/g, "")
                === this.debtorControl.value.toLowerCase().replace(/\s/g, ""));
            if (indx === -1) {
                debtorResult = true;
                debtorId = -1;
            }
            else {
                debtorResult = true;
                debtorId = this.debtors[indx].ownerId;
            }
        }
        return { debtorResult, debtorId };
    }

    private getcreditorId() {
        let creditorResult: boolean;
        let creditorId: number;
        if (this.creditorControl.value === null) {
            creditorResult = true;
            creditorId = -1;
        }
        else {
            const indx = this.creditors.findIndex(x => x.ownerName.toLowerCase().replace(/\s/g, "")
                === this.creditorControl.value.toLowerCase().replace(/\s/g, ""));
            if (indx === -1) {
                creditorResult = true;
                creditorId = -1;
            }
            else {
                creditorResult = true;
                creditorId = this.creditors[indx].ownerId;
            }
        }
        return { creditorResult, creditorId };
    }
    public openDatePicker() {

    }
}

export function debtorForbiddenNamesValidator(debtors: Owner[]): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
        // below findIndex will check if control.value is equal to one of our options or not
        const index = debtors.findIndex(debtor => {
            return debtor.ownerName.toLowerCase().replace(/\s/g, "")
                == control.value.toLowerCase().replace(/\s/g, "");
        });
        return index < 0 ? { 'forbiddenNames': { value: control.value } } : null;
    };
}
export function creditorForbiddenNamesValidator(creditors: Owner[]): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
        // below findIndex will check if control.value is equal to one of our options or not
        const index = creditors.findIndex(creditor => {
            return creditor.ownerName.toLowerCase().replace(/\s/g, "")
                == control.value == null ? '' : control.value.toLowerCase().replace(/\s/g, "");
        });
        return index < 0 && control.value.toString().length > 0 ? { 'forbiddenNames': { value: control.value } } : null;
    };
}