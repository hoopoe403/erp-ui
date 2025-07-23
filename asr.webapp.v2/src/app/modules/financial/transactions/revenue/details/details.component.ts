import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { fuseAnimations } from "../../../../../../@fuse/animations";
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidatorFn } from "@angular/forms";
import { animate, state, style, transition, trigger } from "@angular/animations";
import { RevenueService } from "../revenue.service";
import { FuseAlertService } from '@fuse/components/alert';
import { Observable, Subject, forkJoin } from 'rxjs';
import { HierarchicalKeyValue, KeyValue } from 'app/core/type/key-value/key-value.type';
import { Bank, FinancialResourceTypePaymentType, Revenue } from '../revenue.types';
import { Owner } from 'app/modules/configuration/owner/owner.types';
import { FinancialResource } from 'app/modules/financial/resource/resource.types';
import { map, startWith } from 'rxjs/operators';
import { OpResult } from 'app/core/type/result/result.types';
import { ActivatedRoute } from '@angular/router';
import { MatMenuTrigger } from '@angular/material/menu';
import { AuthorizedPaymentParty, ChequeType } from 'app/modules/financial/shared/financial.types';
@Component({
    selector: 'revenue-details',
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

export class RevenueDetailsComponent implements OnInit, OnDestroy {
    hasPayerPlaceholder: string = 'Disable Payer';
    menuArray = [];
    selectedCat: number = 0;
    titleInfo: string;
    id: number;
    selectedCurrency: string = '';
    currencyList: Array<KeyValue> = [];
    revenueInfo: Revenue = new Revenue();
    _result: OpResult = new OpResult();
    pageType: string;
    private _unsubscribeAll: Subject<any>;
    isLoading: boolean = false;
    disabledActionBtn: boolean = false;
    frmRevenue: FormGroup;
    paymentTypes: Array<KeyValue> = [];
    banks: Array<Bank> = [];
    selectedBankUrl: string = '';
    financialResourceTypePaymentType: Array<FinancialResourceTypePaymentType> = [];
    payerFinancialResources: Array<FinancialResource> = [];
    payerFilteredFinancialResources: Array<FinancialResource> = [];
    recipientFinancialResources: Array<FinancialResource> = [];
    recipientFilteredFinancialResources: Array<FinancialResource> = [];
    payerFilteredOptions: Observable<Owner[]>;
    payerControl = new FormControl();
    payers: Array<Owner>;
    recipientFilteredOptions: Observable<Owner[]>;
    recipientControl = new FormControl();
    recipients: Array<Owner>;
    recipientFinancialResourceControl = new FormControl();
    recipientFinancialResourceFilteredOptions: Observable<FinancialResource[]>;
    payerFinancialResourceControl = new FormControl();
    payerFinancialResourceFilteredOptions: Observable<FinancialResource[]>;
    selectedPaymentType: string = '0';
    dateObject = "";
    price: number;
    year: string = '';
    month: string = '';
    day: string = '';
    chequeTypes: Array<ChequeType>;
    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
    constructor(
        private service: RevenueService,
        private _formBuilder: FormBuilder,
        private cdr: ChangeDetectorRef,
        private route: ActivatedRoute,
        private _fuseAlertService: FuseAlertService
    ) {

        this._unsubscribeAll = new Subject();
        // Set the default
        this.payers = new Array<Owner>();
        this.recipients = new Array<Owner>();
        this.currencyList.push({ key: 1000481, value: 'ریال' });
        this.currencyList.push({ key: 1000482, value: 'دلار' });
        this.currencyList.push({ key: 1000483, value: 'یورو' });
    }

    /**
     * On init
     */
    ngOnInit(): void {
        this.payerFilteredOptions = this.payerControl.valueChanges.pipe(
            startWith(''),
            map(value => this._payerFilter(value))
        );
        this.recipientFilteredOptions = this.recipientControl.valueChanges.pipe(
            startWith(''),
            map(value => this._recipientFilter(value))
        );
        this.recipientFinancialResourceFilteredOptions = this.recipientFinancialResourceControl.valueChanges.pipe(
            startWith(''),
            map(value => this._recipientFinancialResourceFilter(value))
        );
        this.payerFinancialResourceFilteredOptions = this.payerFinancialResourceControl.valueChanges.pipe(
            startWith(''),
            map(value => this._payerFinancialResourceFilter(value))
        );
        this.frmRevenue = this.createFormObject();
        this.isLoading = true;

        this.id = Number(this.route.snapshot.paramMap.get('id'));
        if (this.id > 0) {
            this.pageType = 'edit';
            this.getById(this.id);

        }
        else {
            this.titleInfo = 'Register New Revenue';
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
            this.getPayers(),
            this.getPaymentType(),
            this.getFinancialResourcePaymentType(),
            this.getBanks(),
            this.getChequeTypes(),
        ).subscribe(res => {
            this.setForkJoinValues(res);
            this.isLoading = false;
            this.cdr.detectChanges();
        });

    }
    private getById(id: number) {
        this.isLoading = true;
        this.service.getRevenue(id.toString())
            .subscribe(res => {
                this.revenueInfo = res.data;
                forkJoin(
                    this.getPayers(),
                    this.getPaymentType(),
                    this.getFinancialResourcePaymentType(),
                    this.getBanks(),
                    this.getChequeTypes(),
                    this.getRecipientsEditMode(),
                ).subscribe(res => {
                    this.setForkJoinValuesInEditMode(res);
                    this.isLoading = false;
                    this.setFormValues();
                    this.cdr.detectChanges();
                });
            });


    }

    private setFormValues() {
        this.payerControl.setValue(this.revenueInfo.payerName);
        this.recipientControl.setValue(this.revenueInfo.recipientName);
        this.selectedPaymentType = this.revenueInfo.paymentTypeId.toString();
        this.frmRevenue.controls["paymentType"].setValue(this.selectedPaymentType);
        this.frmRevenue.controls["paymentType"].disable();
        let payerEvent: {
            isUserInput: any;
            source: { value: any; selected: any };
        } = { isUserInput: true, source: { value: this.revenueInfo.payerName, selected: true } };
        this.setPayer(payerEvent);
        let recipientEvent: {
            isUserInput: any;
            source: { value: any; selected: any };
        } = { isUserInput: true, source: { value: this.revenueInfo.recipientName, selected: true } };
        this.setRecipient(recipientEvent);
        this.filterPayerFinancialResource(parseInt(this.selectedPaymentType));
        this.filterRecipientFinancialResource(parseInt(this.selectedPaymentType));
        this.cdr.detectChanges();
        this.onDateChange(this.revenueInfo.revenueLocalDate);
        this.frmRevenue.controls["bank"].setValue(this.revenueInfo.bankId);
        this.frmRevenue.controls["chequeNumber"].setValue(this.revenueInfo.chequeNumber);
        this.frmRevenue.controls["amount"].setValue(this.revenueInfo.amount);
        this.frmRevenue.controls["currency"].setValue(this.revenueInfo.currencyId);
        this.frmRevenue.controls["paymentId"].setValue(this.revenueInfo.paymentId);
        this.frmRevenue.controls["billId"].setValue(this.revenueInfo.billId);
        this.frmRevenue.controls["trackingId"].setValue(this.revenueInfo.trackingId);
        this.frmRevenue.controls["description"].setValue(this.revenueInfo.description);
        if (this.selectedPaymentType == '1001063')
            this.frmRevenue.controls["chequeType"].setValue(this.revenueInfo.chequeTypeId);
        this.processPrice(this.revenueInfo.amount.toString());
        const indx = this.banks.findIndex(x => x.bankId == this.revenueInfo.bankId);
        if (indx !== -1)
            this.selectedBankUrl = this.banks[indx].url;
        if (this.revenueInfo.status === 1000007)
            this.frmRevenue.controls["paymentType"].disable();
        else {
            this.payerControl.disable();
            this.frmRevenue.disable();
        }
        this.cdr.detectChanges();
    }
    private getFinancialCategories(): Observable<any> {
        return this.service.getFinancialCategories();
    }
    private getRevenue(id: number): Observable<any> {
        return this.service.getRevenue(id.toString());
        /* .subscribe(res => {
            this.goodsInfo = res.data;
        }); */
    }

    private setForkJoinValues(values: Array<any>): void {
        this.payers = values[0].data;
        this.paymentTypes = values[1].data;
        this.financialResourceTypePaymentType = values[2].data;
        this.banks = values[3].data;
        this.payerControl.setValidators(payerForbiddenNamesValidator(this.payers));
        this.chequeTypes = values[4].data;
    }

    private setForkJoinValuesInEditMode(values: Array<any>): void {
        // this.revenueInfo = values[0].data;
        this.payers = values[0].data;
        this.paymentTypes = values[1].data;
        this.financialResourceTypePaymentType = values[2].data;
        this.banks = values[3].data;
        this.chequeTypes = values[4].data;
        this.recipients = values[5].data;
        this.payerControl.setValidators(payerForbiddenNamesValidator(this.payers));
        this.recipientControl.setValidators(recipientForbiddenNamesValidator(this.recipients));
        this.titleInfo = this.revenueInfo.payerName.concat('-').concat(this.revenueInfo.paymentTypeName);
    }
    private addSelectanItemToCatMenu() {
        let obj = new HierarchicalKeyValue();
        obj.id = 0;

        if (this.pageType === 'new' || (this.pageType === 'edit') &&
            (this.revenueInfo.financialCategoryId === null || this.revenueInfo.financialCategoryId === 0)) {
            obj.item = "Select a category";
            this.selectedCat = 0;
        }
        else {
            obj.item = this.revenueInfo.financialCategoryName;
            this.selectedCat = this.revenueInfo.financialCategoryId;
        }
        obj.parentId = -1;
        obj.children = [];
        for (var i = 0; i < this.menuArray.length; i++) {
            obj.children.push(this.menuArray[i]);
        }
        this.menuArray = [];
        this.menuArray.push(obj);

    }
    private createFormObject(): FormGroup {

        return this._formBuilder.group({
            paymentType: '',
            bank: '',
            chequeNumber: '',
            jdatepicker: '',
            amount: '',
            billId: '',
            paymentId: '',
            trackingId: '',
            currency: '',
            hasPayer: true,
            chequeType: '',
            description: '',
        });
    }

    private _payerFilter(value: string): Owner[] {
        const filterValue = value.toLowerCase().replace(' ', '');
        return this.payers.filter(option => option.ownerName.toLowerCase().replace(' ', '').includes(filterValue));
    }
    private _recipientFilter(value: string): Owner[] {
        const filterValue = value.toLowerCase().replace(' ', '');
        return this.recipients.filter(option => option.ownerName.toLowerCase().replace(' ', '').includes(filterValue));
    }
    private _recipientFinancialResourceFilter(value: string): FinancialResource[] {
        const filterValue = value.toLowerCase().replace(' ', '');
        return this.recipientFinancialResources.filter(option => option.drpName.toLowerCase().replace(' ', '').includes(filterValue));
    }
    private _payerFinancialResourceFilter(value: string): FinancialResource[] {
        const filterValue = value.toLowerCase().replace(' ', '');
        return this.payerFinancialResources.filter(option => option.drpName.toLowerCase().replace(' ', '').includes(filterValue));
    }
    private getPayers(): Observable<any> {
        return this.service.getPayers();
    }

    private getChequeTypes(): Observable<any> {
        return this.service.getChequeTypes();

    }
    private getPaymentType(): Observable<any> {
        return this.service.getPaymentTypes();
    }
    private getFinancialResourcePaymentType(): Observable<any> {
        return this.service.getFinancialResourceTypePaymentType();
    }
    private getFinancialResource(payerId: number): Observable<any> {
        this.isLoading = true;
        let obj: FinancialResource = new FinancialResource();
        obj.ownerId = payerId;
        return this.service.getFinancialResources(obj);
    }

    private getBanks(): Observable<any> {
        return this.service.getBanks();
    }

    private showAlert(name: string): void {
        this._fuseAlertService.show(name);
    }

    private dismissAlert(name: string): void {
        this._fuseAlertService.dismiss(name);
    }

    private filterPayerFinancialResource(paymentTypeId: number) {
        let obj = this.financialResourceTypePaymentType.filter(x => x.paymentTypeId === paymentTypeId);
        this.payerFilteredFinancialResources = [];
        obj.forEach(element => {
            let obj2: Array<FinancialResource> = this.payerFinancialResources.filter(x => x.financialResourceTypeId === element.financialResourceTypeId);
            obj2.forEach(element2 => {
                this.payerFilteredFinancialResources.push(element2);
            });

        });
    }
    private getRecipients() {
        this.isLoading = true;
        let obj: AuthorizedPaymentParty = new AuthorizedPaymentParty();
        obj.payerTypeId = this.revenueInfo.payerTypeId;
        obj.paymentTypeId = parseInt(this.selectedPaymentType);
        this.service.getRecipients(obj).subscribe(res => {
            this.isLoading = false;
            this.recipients = res.data;
            this.recipientControl.setValidators(recipientForbiddenNamesValidator(this.recipients));
            this.cdr.detectChanges();
        });
    }
    private getRecipientsEditMode(): Observable<any> {
        let obj: AuthorizedPaymentParty = new AuthorizedPaymentParty();
        obj.payerTypeId = this.revenueInfo.payerTypeId;
        obj.paymentTypeId = this.revenueInfo.paymentTypeId;
        return this.service.getRecipients(obj);
    }

    private filterRecipientFinancialResource(paymentTypeId: number) {
        let obj = this.financialResourceTypePaymentType.filter(x => x.paymentTypeId === paymentTypeId);
        this.recipientFilteredFinancialResources = [];
        obj.forEach(element => {
            let obj2: Array<FinancialResource> = this.recipientFinancialResources.filter(x => x.financialResourceTypeId === element.financialResourceTypeId);
            obj2.forEach(element2 => {
                this.recipientFilteredFinancialResources.push(element2);
            });

        });
    }

    setPaymentType(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            this.revenueInfo.paymentTypeId = event.source.value;
            this.payerFinancialResources = [];
            this.recipientFinancialResources = [];
            this.payerFilteredFinancialResources = [];
            this.recipientFilteredFinancialResources = [];
            this.selectedPaymentType = event.source.value;
            if (this.selectedPaymentType == '1001063')
                this.frmRevenue.controls['chequeType'].setValue(1001321);

        }

    }
    setBank(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            const indx = this.banks.findIndex(x => x.bankId == event.source.value.toString());
            this.selectedBankUrl = this.banks[indx].url;
        }

    }

    onDateChange(dateValue: string
    ) {
        if (dateValue === undefined)
            return;
        this.revenueInfo.revenueLocalDate = dateValue;
        dateValue = dateValue.replace('/', '');
        dateValue = dateValue.replace('/', '');
        dateValue = dateValue.replace('-', '');
        dateValue = dateValue.replace('-', '');
        this.year = dateValue.substring(0, 4);
        this.month = dateValue.substring(4, 6);
        this.day = dateValue.substring(6, 8);
        document.getElementById("year1").innerText = dateValue.substring(0, 1);
        document.getElementById("year2").innerText = dateValue.substring(1, 2);
        document.getElementById("year3").innerText = dateValue.substring(2, 3);
        document.getElementById("year4").innerText = dateValue.substring(3, 4);
        document.getElementById("month1").innerText = dateValue.substring(4, 5);
        document.getElementById("month2").innerText = dateValue.substring(5, 6);
        document.getElementById("day1").innerText = dateValue.substring(6, 7);
        document.getElementById("day2").innerText = dateValue.substring(7, 8);
        this.dateObject = '';
        this.frmRevenue.controls["jdatepicker"].setValue('');
        // this.cdr.detectChanges();
    }
    processPrice(price: string) {
        let result: string;
        let counter: number = 0;
        price = price.replace(/,/g, '');
        if (!/^\d+$/.test(price)) {
            result = price.substring(0, price.length - 1);
            this.price = 0;
        }
        else {
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
        }

        this.frmRevenue.controls["amount"].setValue(result);
    }
    setPayer(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            const indx = this.payers.findIndex(x => x.ownerName.toLowerCase().replace(/\s/g, "")
                === event.source.value.toLowerCase().replace(/\s/g, ""));
            if (indx === -1) {
                return;
            }
            this.payerFinancialResources = [];
            this.revenueInfo.payerId = this.payers[indx].ownerId;
            this.revenueInfo.payerTypeId = this.payers[indx].ownerTypeId;
            if (this.payers[indx].ownerTypeId !== 1000611 && this.payers[indx].ownerTypeId !== 1000614
                && this.selectedPaymentType != '1001061') {
                let obj: FinancialResource = new FinancialResource();
                obj.financialResourceId = 0;
                obj.financialResourceName = 'Hand Over';
                obj.financialResourceTypeId = 1001052;
                obj.financialResourceTypeName = 'Safe';
                obj.bankId = 0;
                obj.bankName = 'none';
                obj.drpName = obj.financialResourceName.concat('-').concat(obj.financialResourceTypeName).concat('-').concat(obj.bankName);
                this.payerFinancialResources.push(obj);
                this.payerFinancialResourceControl.setValidators(payerFinancialResourceForbiddenNamesValidator(this.payerFinancialResources));
                if (this.pageType === 'edit') {
                    let finRes = new FinancialResource();
                    let indx = this.payerFinancialResources.findIndex(x => x.financialResourceId === this.revenueInfo.payerFinancialResourceId)
                    if (indx !== -1)
                        finRes = this.payerFinancialResources[indx];
                    this.payerFinancialResourceControl.setValue(this.payerFinancialResources[indx].drpName);
                }
            }
            else if (this.payers[indx].ownerTypeId !== 1000611 && this.payers[indx].ownerTypeId !== 1000614
                && this.selectedPaymentType == '1001061') {
                let obj: FinancialResource = new FinancialResource();
                obj.financialResourceId = 0;
                obj.financialResourceName = 'Unknown';
                obj.financialResourceTypeId = 1001051;
                obj.financialResourceTypeName = 'Bank Account';
                obj.bankId = 0;
                obj.bankName = 'none';
                obj.drpName = obj.financialResourceName.concat('-').concat(obj.financialResourceTypeName).concat('-').concat(obj.bankName);
                this.payerFinancialResources.push(obj);
                this.payerFinancialResourceControl.setValidators(payerFinancialResourceForbiddenNamesValidator(this.payerFinancialResources));
                if (this.pageType === 'edit') {
                    let finRes = new FinancialResource();
                    let indx = this.payerFinancialResources.findIndex(x => x.financialResourceId === this.revenueInfo.payerFinancialResourceId)
                    if (indx !== -1)
                        finRes = this.payerFinancialResources[indx];
                    this.payerFinancialResourceControl.setValue(this.payerFinancialResources[indx].drpName);
                }
            }
            else {
                this.getFinancialResource(this.payers[indx].ownerId).subscribe(res => {
                    // this.isLoading = false;
                    this.payerFinancialResources = res.data;
                    this.payerFinancialResourceControl.setValidators(payerFinancialResourceForbiddenNamesValidator(this.payerFinancialResources));
                    if (this.pageType === 'edit') {
                        let finRes = new FinancialResource();
                        let indx = this.payerFinancialResources.findIndex(x => x.financialResourceId === this.revenueInfo.payerFinancialResourceId)
                        if (indx !== -1)
                            finRes = this.payerFinancialResources[indx];
                        this.payerFinancialResourceControl.setValue(finRes.drpName);
                    }
                    this.cdr.detectChanges();
                });
            }
            this.getRecipients();
        }

    }
    setRecipient(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            const indx = this.recipients.findIndex(x => x.ownerName.toLowerCase().replace(/\s/g, "")
                === event.source.value.toLowerCase().replace(/\s/g, ""));
            if (indx === -1) {
                return;
            }
            this.getFinancialResource(this.recipients[indx].ownerId).subscribe(res => {
                this.isLoading = false;
                this.recipientFinancialResources = res.data;
                if (this.recipients[indx].ownerTypeId !== 1000611 && this.recipients[indx].ownerTypeId !== 1000614
                    && this.selectedPaymentType != '1001061') {
                    let obj: FinancialResource = new FinancialResource();
                    obj.financialResourceId = 0;
                    obj.financialResourceName = 'Hand Over';
                    obj.financialResourceTypeName = 'Manual';
                    obj.financialResourceTypeId = 1001052;
                    obj.drpName = obj.financialResourceName.concat('-').concat(obj.financialResourceTypeName).concat('-').concat(obj.bankName);
                    this.recipientFinancialResources.push(obj);
                }
                else if (this.recipients[indx].ownerTypeId !== 1000611 && this.recipients[indx].ownerTypeId !== 1000614
                    && this.selectedPaymentType == '1001061') {
                    let obj: FinancialResource = new FinancialResource();
                    obj.financialResourceId = 0;
                    obj.financialResourceName = 'Unknown';
                    obj.financialResourceTypeId = 1001051;
                    obj.financialResourceTypeName = 'Bank Account';
                    obj.bankId = 0;
                    obj.bankName = 'none';
                    obj.drpName = obj.financialResourceName.concat('-').concat(obj.financialResourceTypeName).concat('-').concat(obj.bankName);
                    this.recipientFinancialResources.push(obj);
                }
                this.recipientFinancialResourceControl.setValidators(recipientFinancialResourceForbiddenNamesValidator(this.recipientFinancialResources));
                if (this.pageType === 'edit') {
                    let finRes = new FinancialResource();
                    let indx = this.recipientFinancialResources.findIndex(x => x.financialResourceId === this.revenueInfo.recipientFinancialResourceId)
                    if (indx !== -1)
                        finRes = this.recipientFinancialResources[indx];
                    this.recipientFinancialResourceControl.setValue(finRes.drpName);
                }
                this.cdr.detectChanges();
            });
        }
    }
    changeHasPayer(event: {
        checked: any;
        source: { value: any; selected: any };
    }) {

        if (!event.checked) {
            this.payerControl.setValue('');
            this.payerControl.disable();
            this.payerFinancialResourceControl.setValue('');
            this.payerFinancialResourceControl.disable();
            this.hasPayerPlaceholder = "Enable Payer";
        }
        else {
            this.payerControl.enable();
            this.payerFinancialResourceControl.enable();
        }

    }
    private getPayerId() {
        let result: boolean;
        let payerId: number;
        if (this.payerControl.value === null) {
            result = false;
            payerId = 0;
        }
        else {
            const indx = this.payers.findIndex(x => x.ownerName.toLowerCase().replace(/\s/g, "")
                === this.payerControl.value.toLowerCase().replace(/\s/g, ""));
            if (indx === -1) {
                result = false;
                payerId = 0;
            }
            else {
                result = true;
                payerId = this.payers[indx].ownerId;
            }
        }
        return { result, payerId };
    }
    private getRecipientId() {
        let recipientResult: boolean;
        let recipientId: number;
        if (this.recipientControl.value === null) {
            recipientResult = false;
            recipientId = 0;
        }
        else {
            const indx = this.recipients.findIndex(x => x.ownerName.toLowerCase().replace(/\s/g, "")
                === this.recipientControl.value.toLowerCase().replace(/\s/g, ""));
            if (indx === -1) {
                recipientResult = false;
                recipientId = 0;
            }
            else {
                recipientResult = true;
                recipientId = this.recipients[indx].ownerId;
            }
        }
        return { recipientResult, recipientId };
    }
    private getRecipientFinancialResourceId() {
        let recipientFinancialResourceResult: boolean;
        let recipientFinancialResourceId: number;
        if (this.recipientFinancialResourceControl.value === null) {
            recipientFinancialResourceResult = false;
            recipientFinancialResourceId = 0;
        }
        else {
            const indx = this.recipientFinancialResources.findIndex(x => x.drpName.toLowerCase().replace(/\s/g, "")
                === this.recipientFinancialResourceControl.value.toLowerCase().replace(/\s/g, ""));
            if (indx === -1) {
                recipientFinancialResourceResult = false;
                recipientFinancialResourceId = 0;
            }
            else {
                recipientFinancialResourceResult = true;
                recipientFinancialResourceId = this.recipientFinancialResources[indx].financialResourceId;
            }
        }
        return { recipientFinancialResourceResult, recipientFinancialResourceId };
    }

    private getPayerFinancialResourceId() {
        let payerFinancialResourceResult: boolean;
        let payerFinancialResourceId: number;
        if (this.payerFinancialResourceControl.value === null) {
            payerFinancialResourceResult = false;
            payerFinancialResourceId = 0;
        }
        else {
            const indx = this.payerFinancialResources.findIndex(x => x.drpName.toLowerCase().replace(/\s/g, "")
                === this.payerFinancialResourceControl.value.toLowerCase().replace(/\s/g, ""));
            if (indx === -1) {
                payerFinancialResourceResult = false;
                payerFinancialResourceId = 0;
            }
            else {
                payerFinancialResourceResult = true;
                payerFinancialResourceId = this.payerFinancialResources[indx].financialResourceId;
            }
        }
        return { payerFinancialResourceResult, payerFinancialResourceId };
    }
    private getFormInfo(): boolean {
        let { result, payerId } = this.getPayerId();
        if (!result) {
            this._result.succeed = false;
            this._result.message = 'All required fields should be filled';
            this.showAlert('errorMessage');
            return false
        }
        let { recipientResult, recipientId } = this.getRecipientId();
        if (!recipientResult) {
            this._result.succeed = false;
            this._result.message = 'All required fields should be filled';
            this.showAlert('errorMessage');
            return false
        }
        let { recipientFinancialResourceResult, recipientFinancialResourceId } = this.getRecipientFinancialResourceId();
        if (!recipientFinancialResourceResult) {
            this._result.succeed = false;
            this._result.message = 'All required fields should be filled';
            this.showAlert('errorMessage');
            return false
        }
        let { payerFinancialResourceResult, payerFinancialResourceId } = this.getPayerFinancialResourceId();
        if (!payerFinancialResourceResult) {
            this._result.succeed = false;
            this._result.message = 'All required fields should be filled';
            this.showAlert('errorMessage');
            return false
        }
        Object.keys(this.frmRevenue.controls).forEach(key => {
            if (this.frmRevenue.get(key).invalid) {
                if (this.selectedPaymentType === '1001061' && key == 'currency')
                    null;
                else {
                    this._result.succeed = false;
                    this._result.message = 'All required fields should be filled';
                    this.showAlert('errorMessage');
                    return false
                }
            }
        });


        this.revenueInfo.paymentTypeId = this.frmRevenue.controls["paymentType"].value;
        if (this.selectedPaymentType == '1001063') {
            this.revenueInfo.chequeTypeId = this.frmRevenue.controls["chequeType"].value;
            if (this.revenueInfo.chequeTypeId == null || this.revenueInfo.chequeTypeId == 0) {
                this._result.succeed = false;
                this._result.message = 'Cheque type is not selelcted';
                this.showAlert('errorMessage');
                return false
            }
            this.revenueInfo.chequeNumber = this.frmRevenue.controls["chequeNumber"].value;
            if (this.revenueInfo.chequeNumber == null || this.revenueInfo.chequeNumber == '' || this.revenueInfo.chequeNumber == '0') {
                this._result.succeed = false;
                this._result.message = 'Cheque number is not entered';
                this.showAlert('errorMessage');
                return false
            }
        }
        else
            this.revenueInfo.chequeTypeId = 0;
        this.revenueInfo.payerId = payerId;
        this.revenueInfo.payerFinancialResourceId = payerFinancialResourceId;
        this.revenueInfo.recipientId = recipientId;
        this.revenueInfo.recipientFinancialResourceId = recipientFinancialResourceId;
        if (this.selectedPaymentType != '1001062')
            this.revenueInfo.bankId = this.frmRevenue.controls["bank"].value;
        else
            this.revenueInfo.bankId = 0;


        if (this.selectedPaymentType != '1001062' && (this.revenueInfo.bankId == null || this.revenueInfo.bankId == 0)) {
            this._result.succeed = false;
            this._result.message = 'Bank is not selelcted';
            this.showAlert('errorMessage');
            return false
        }
        this.revenueInfo.amount = this.price;
        this.revenueInfo.paymentId = this.frmRevenue.controls["paymentId"].value;
        this.revenueInfo.billId = this.frmRevenue.controls["billId"].value;
        this.revenueInfo.trackingId = this.frmRevenue.controls["trackingId"].value;
        this.revenueInfo.currencyId = this.frmRevenue.controls["currency"].value;
        this.revenueInfo.description = this.frmRevenue.controls["description"].value;
        this.revenueInfo.financialCategoryId = 0;
        return true;
    }
    save() {
        let formResult: boolean;
        this.isLoading = true;
        formResult = this.getFormInfo();
        if (!formResult)
            return;
        if (this.pageType === 'new')
            this.create();
        else
            this.edit();
    }
    confirm() {
        this.isLoading = true;
        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');
        this.service.confirm(this.revenueInfo).subscribe(res => {
            this.isLoading = false;
            this._result.succeed = res.succeed;
            this._result.message = res.message;
            if (this._result.succeed) {
                this.disabledActionBtn = true;
                this.showAlert('successMessage');
            }
            else
                this.showAlert('errorMessage');
            this.cdr.detectChanges();
        });
    }
    private create() {
        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');
        this.service.create(this.revenueInfo).subscribe(res => {
            this.isLoading = false;
            this._result.succeed = res.succeed;
            this._result.message = res.message;
            if (this._result.succeed) {
                this.disabledActionBtn = true;
                this.showAlert('successMessage');
            }
            else
                this.showAlert('errorMessage');
            this.cdr.detectChanges();
        });
    }

    private edit() {

        this.service.edit(this.revenueInfo).subscribe(res => {
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
    setCurrency(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {
        if (event.isUserInput) {
            this.selectedCurrency = this.currencyList.filter(x => x.key == event.source.value.toString())[0].value;
        }

    }
    public setSelectedCat(selectedId: number, selectedItem: string) {

        this.selectedCat = selectedId;
        if (selectedId > 0)
            this.trigger.closeMenu();
    }
}
export function payerForbiddenNamesValidator(payers: Owner[]): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
        // below findIndex will check if control.value is equal to one of our options or not
        const index = payers.findIndex(payer => {
            return payer.ownerName.toLowerCase().replace(/\s/g, "")
                == control.value.toLowerCase().replace(/\s/g, "");
        });
        return index < 0 ? { 'forbiddenNames': { value: control.value } } : null;
    };
}
export function recipientForbiddenNamesValidator(recipients: Owner[]): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
        // below findIndex will check if control.value is equal to one of our options or not
        const index = recipients.findIndex(recipient => {
            return recipient.ownerName.toLowerCase().replace(/\s/g, "")
                == control.value.toLowerCase().replace(/\s/g, "");
        });
        return index < 0 && control.value.toString().length > 0 ? { 'forbiddenNames': { value: control.value } } : null;
    };
}

export function recipientFinancialResourceForbiddenNamesValidator(recipientFinancialResources: FinancialResource[]): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
        // below findIndex will check if control.value is equal to one of our options or not
        const index = recipientFinancialResources.findIndex(recipient => {
            let obj: string = recipient.financialResourceName.concat('-')
                .concat(recipient.financialResourceTypeName).concat('-').concat(recipient.bankName);
            return obj.toLowerCase().replace(/\s/g, "")
                == control.value.toLowerCase().replace(/\s/g, "");

        });
        return index < 0 && control.value.toString().length > 0 ? { 'forbiddenNames': { value: control.value } } : null;
    };
}
export function payerFinancialResourceForbiddenNamesValidator(payerFinancialResources: FinancialResource[]): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
        // below findIndex will check if control.value is equal to one of our options or not
        const index = payerFinancialResources.findIndex(payer => {
            let obj: string = payer.financialResourceName.concat('-')
                .concat(payer.financialResourceTypeName).concat('-').concat(payer.bankName);
            return obj.toLowerCase().replace(/\s/g, "")
                == control.value.toLowerCase().replace(/\s/g, "");

        });
        return index < 0 && control.value.toString().length > 0 ? { 'forbiddenNames': { value: control.value } } : null;
    };
}