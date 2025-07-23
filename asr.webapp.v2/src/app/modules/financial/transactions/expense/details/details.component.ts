import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidatorFn } from "@angular/forms";
import { ExpenseService } from "../expense.service";
import { FuseAlertService } from '@fuse/components/alert';
import { Observable, Subject, forkJoin } from 'rxjs';
import { HierarchicalKeyValue, KeyValue } from 'app/core/type/key-value/key-value.type';
import { FinancialResourceTypePaymentType, Expense } from '../expense.types';
import { Owner } from 'app/modules/configuration/owner/owner.types';
import { AuthorizedPaymentParty, Bank, ChequeType } from '../../../shared/financial.types';
import { map, startWith } from 'rxjs/operators';
import { OpResult } from 'app/core/type/result/result.types';
import { ActivatedRoute } from '@angular/router';
import { MatMenuTrigger } from '@angular/material/menu';
import { FinancialCategory } from 'app/modules/financial/category/category.types';
import { fuseAnimations } from '@fuse/animations';
import { FinancialResource, FinancialResourceDetail } from 'app/modules/financial/resource/resource.types';

@Component({
    selector: 'expense-details',
    templateUrl: './details.component.html',
    animations: fuseAnimations,
    styles: [
        /* language=SCSS */
    ],
    encapsulation: ViewEncapsulation.None
})

export class ExpenseDetailsComponent implements OnInit, OnDestroy {
    frmFinancialResourceDtAdSearch: FormGroup;
    hasRecipientPlaceholder: string = 'Disable Recipient';
    selectButtonText: string = 'Select';
    financialResourceDetailFilterValue: string = '';
    menuArray = [];
    financialCategories: Array<FinancialCategory>;
    financialResourceDetails: Array<FinancialResourceDetail>;
    financialResourceDetails$: Array<FinancialResourceDetail>;
    financialResourceDetailInfo: FinancialResourceDetail;
    selectedCat: number = 0;
    titleInfo: string;
    id: number;
    selectedCurrency: string = '';
    currencyList: Array<KeyValue> = [];
    expenseInfo: Expense = new Expense();
    _result: OpResult = new OpResult();
    pageType: string;
    private _unsubscribeAll: Subject<any>;
    isLoading: boolean = false;
    frmExpense: FormGroup;
    paymentTypes: Array<KeyValue> = [];
    banks: Array<Bank> = [];
    financialResourceTypePaymentType: Array<FinancialResourceTypePaymentType> = [];
    payerFinancialResources: Array<FinancialResource> = [];
    recipientFinancialResources: Array<FinancialResource> = [];
    filteredFinancialResources: Array<FinancialResource> = [];
    payerFilteredOptions: Observable<Owner[]>;
    payerControl = new FormControl();
    recipientControl = new FormControl();
    recipientFilteredOptions: Observable<Owner[]>;
    recipientFinancialResourceControl = new FormControl();
    recipientFinancialResourceFilteredOptions: Observable<FinancialResource[]>;
    payerFinancialResourceControl = new FormControl();
    payerFinancialResourceFilteredOptions: Observable<FinancialResource[]>;
    payers: Array<Owner>;
    recipients: Array<Owner>;
    selectedPaymentType: string = '0';
    dateObject = "";
    price: number;
    fee: number = 0;
    year: string = '';
    month: string = '';
    day: string = '';
    animationStates: any;
    visibilityStates: any;
    selectedBankUrl: string = '';
    disabledActionBtn: boolean = false;
    selectedPayerFinancialResourceTypeId: number = 0;
    hideFee: boolean = false;
    chequeTypes: Array<ChequeType>;
    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
    constructor(
        private service: ExpenseService,
        private _formBuilder: FormBuilder,
        private cdr: ChangeDetectorRef,
        private route: ActivatedRoute,
        private _fuseAlertService: FuseAlertService
    ) {

        this._unsubscribeAll = new Subject();
        // Set the default
        this.payers = new Array<Owner>();
        this.recipients = new Array<Owner>();
        this.recipientFinancialResources = new Array<FinancialResource>();
        this.financialResourceDetails = new Array<FinancialResourceDetail>();
        this.financialResourceDetails$ = new Array<FinancialResourceDetail>();
        this.financialResourceDetailInfo = new FinancialResourceDetail();
        this.financialResourceDetailInfo.financialResourceId = 0;
        this.currencyList.push({ key: 1000481, value: 'ریال' });
        this.currencyList.push({ key: 1000482, value: 'دلار' });
        this.currencyList.push({ key: 1000483, value: 'یورو' });
        this.expenseInfo.payerBankAccountTypeId = 0;
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
        this.frmExpense = this.createFormObject();
        this.isLoading = true;

        this.id = Number(this.route.snapshot.paramMap.get('id'));
        if (this.id > 0) {
            this.pageType = 'edit';
            this.getById(this.id);

        }
        else {
            this.titleInfo = 'Register New Expense';
            this.loadData();
            this.pageType = 'new';
        }

        this.frmFinancialResourceDtAdSearch = this.createFinancialResourceDtAdvancedSearchObject();

    }
    private getById(id: number) {
        this.isLoading = true;
        this.service.getExpense(id.toString())
            .subscribe(res => {
                this.expenseInfo = res.data;
                forkJoin(
                    this.getPayers(),
                    this.getPaymentType(),
                    this.getFinancialResourcePaymentType(),
                    this.getBanks(),
                    this.getRecipientsEditMode(),
                    this.getChequeTypes(),
                ).subscribe(res => {
                    this.setForkJoinValuesInEditMode(res);
                    this.isLoading = false;
                    this.setFormValues();
                    this.cdr.detectChanges();
                });
            });

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
    private setFormValues() {
        this.payerControl.setValue(this.expenseInfo.payerName);
        this.recipientControl.setValue(this.expenseInfo.recipientName);

        let payerEvent: {
            isUserInput: any;
            source: { value: any; selected: any };
        } = { isUserInput: true, source: { value: this.expenseInfo.payerName, selected: true } };
        this.setPayer(payerEvent);
        let recipientEvent: {
            isUserInput: any;
            source: { value: any; selected: any };
        } = { isUserInput: true, source: { value: this.expenseInfo.recipientName, selected: true } };
        this.setRecipient(recipientEvent);

        this.selectedPaymentType = this.expenseInfo.paymentTypeId.toString();
        this.cdr.detectChanges();
        this.payerFinancialResourceControl.enable();
        this.frmExpense.controls["paymentType"].setValue(this.selectedPaymentType);
        this.frmExpense.controls["paymentType"].disable();
        //this.frmExpense.controls["recipientFinancialResource"].setValue(this.expenseInfo.recipientFinancialResourceId);
        if (this.selectedPaymentType == '1001063' && this.expenseInfo.payerBankAccountTypeId == 1001541) {
            this.frmExpense.controls["chequeType"].setValue(this.expenseInfo.chequeTypeId);
            this.frmExpense.controls["chequeNumber"].setValue(this.expenseInfo.chequeNumber);
            this.onDateChange(this.expenseInfo.expenseLocalDate);
        }
        //this.frmExpense.controls["amount"].setValue(this.expenseInfo.amount);
        //this.frmExpense.controls["currency"].setValue(this.expenseInfo.currencyId);
        this.frmExpense.controls["paymentId"].setValue(this.expenseInfo.paymentId);
        this.frmExpense.controls["billId"].setValue(this.expenseInfo.billId);
        this.frmExpense.controls["trackingId"].setValue(this.expenseInfo.trackingId);
        this.frmExpense.controls["description"].setValue(this.expenseInfo.description);
        this.frmExpense.controls["bank"].setValue(this.expenseInfo.bankId);
        this.processPrice(this.expenseInfo.amount.toString());
        this.processFee(this.expenseInfo.fee.toString());

        if (this.expenseInfo.status === 1000007)
            this.frmExpense.controls["paymentType"].disable();
        else {
            this.payerControl.disable();
            this.frmExpense.disable();
        }
        this.cdr.detectChanges();
    }
    /**
     * On destroy
     */
    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    private getFinancialCategories(): Observable<any> {
        return this.service.getFinancialCategories();
    }

    private getExpense(id: number): Observable<any> {
        return this.service.getExpense(id.toString());
    }

    private setForkJoinValues(values: Array<any>): void {
        this.payers = values[0].data;
        this.paymentTypes = values[1].data;
        this.financialResourceTypePaymentType = values[2].data;
        this.banks = values[3].data;
        this.chequeTypes = values[4].data;
        this.payerControl.setValidators(payerForbiddenNamesValidator(this.payers));
    }

    private setForkJoinValuesInEditMode(values: Array<any>): void {
        this.payers = values[0].data;
        this.paymentTypes = values[1].data;
        this.financialResourceTypePaymentType = values[2].data;
        this.banks = values[3].data;
        this.recipients = values[4].data;
        this.chequeTypes = values[5].data;
        this.payerControl.setValidators(payerForbiddenNamesValidator(this.payers));
        this.recipientControl.setValidators(recipientForbiddenNamesValidator(this.recipients));
        this.titleInfo = this.expenseInfo.payerName.concat('-').concat(this.expenseInfo.paymentTypeName);
    }

    private createFormObject(): FormGroup {

        return this._formBuilder.group({
            paymentType: '',
            bank: '',
            chequeNumber: '',
            jdatepicker: '',
            billId: '',
            paymentId: '',
            trackingId: '',
            hasRecipient: true,
            chequeType: '',
            description: '',
            amount: '',
            fee: '',
        });
    }
    createFinancialResourceDtAdvancedSearchObject(): FormGroup {
        return this._formBuilder.group({
            chequeNumber: '',
            bank: '',
            chequeDate: '',
            balance: ''
        });
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

        this.frmExpense.controls["amount"].setValue(result);
    }
    processFee(fee: string) {
        let result: string;
        let counter: number = 0;
        fee = fee.replace(/,/g, '');
        if (!/^\d+$/.test(fee)) {
            result = fee.substring(0, fee.length - 1);
            this.fee = 0;
        }
        else {
            this.fee = Number(fee);
            for (let index = fee.length; index > 0; index--) {

                if (index === fee.length)
                    result = fee.substring(index - 1, index);
                else {
                    if (counter % 3 === 0)
                        result = ','.concat(result);

                    result = fee.substring(index - 1, index).concat(result);
                }
                counter = counter + 1;
            }
        }

        this.frmExpense.controls["fee"].setValue(result);
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
        const filterValue = value?.toLowerCase().replace(' ', '');
        return this.payerFinancialResources.filter(option => option.drpName.toLowerCase().replace(' ', '').includes(filterValue));
    }
    private getPayers(): Observable<any> {
        return this.service.getPayers();
    }
    private getChequeTypes(): Observable<any> {
        return this.service.getChequeTypes();

    }
    private getRecipients() {
        this.isLoading = true;
        let obj: AuthorizedPaymentParty = new AuthorizedPaymentParty();
        obj.payerTypeId = this.expenseInfo.payerTypeId;
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
        obj.payerTypeId = this.expenseInfo.payerTypeId;
        obj.paymentTypeId = this.expenseInfo.paymentTypeId;
        return this.service.getRecipients(obj);
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

    private getFinancialResourceDetails(financialResourceDetailInfo: FinancialResourceDetail) {
        this.isLoading = true;
        financialResourceDetailInfo.paymentTypeIdList = [];
        if (this.selectedPaymentType == '1001061' || this.selectedPaymentType == '1001062') {
            financialResourceDetailInfo.chequeId = 0;
            financialResourceDetailInfo.chequeStatusIdList = [];
        }
        else {
            financialResourceDetailInfo.chequeStatusIdList = [];
            financialResourceDetailInfo.chequeStatusIdList.push(1000082);
            financialResourceDetailInfo.chequeStatusIdList.push(1000084);
            financialResourceDetailInfo.chequeStatusIdList.push(1000061);

        }
        this.financialResourceDetails = [];
        this.financialResourceDetails$ = [];
        this.service.getFinancialResourceDetails(financialResourceDetailInfo).subscribe(res => {
            this.isLoading = false;
            this.financialResourceDetails = res.data;
            this.financialResourceDetails$ = res.data;
            this.cdr.detectChanges();
            if (this.selectedPaymentType === '1001061' && this.financialResourceDetails.length > 0)
                this.selectFinancialDetail(this.financialResourceDetails[0].financialResourceDetailId);
            if (this.pageType === 'edit' && this.expenseInfo.paymentTypeId === 1001061)
                this.onDateChange(this.expenseInfo.expenseLocalDate);
            const indx = this.banks.findIndex(x => x.bankId == this.expenseInfo.bankId);
            if (indx !== -1)
                this.selectedBankUrl = this.banks[indx].url;
            this.cdr.detectChanges();
        });
    }


    private getBanks(): Observable<any> {
        return this.service.getBanks();
    }
    changeHasRecipient(event: {
        checked: any;
        source: { value: any; selected: any };
    }) {

        if (!event.checked) {
            this.recipientControl.setValue('');
            this.recipientControl.disable();
            this.recipientFinancialResourceControl.setValue('');
            this.recipientFinancialResourceControl.disable();
            this.hasRecipientPlaceholder = "Enable Recipient";
        }
        else {
            this.recipientControl.enable();
            this.recipientFinancialResourceControl.enable();
        }

    }
    setPayer(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            this.financialResourceDetailInfo.financialResourceId = 0;
            const indx = this.payers.findIndex(x => x.ownerName.toLowerCase().replace(/\s/g, "")
                === event.source.value.toLowerCase().replace(/\s/g, ""));
            if (indx === -1) {
                return;
            }
            this.expenseInfo.payerId = this.payers[indx].ownerId;
            this.expenseInfo.payerTypeId = this.payers[indx].ownerTypeId;
            this.getFinancialResource(this.payers[indx].ownerId).subscribe(res => {
                this.isLoading = false;
                this.payerFinancialResources = res.data;
                this.payerFinancialResourceControl.setValidators(payerFinancialResourceForbiddenNamesValidator(this.payerFinancialResources));
                if (this.pageType === 'edit') {
                    let finRes = new FinancialResource();
                    let indx = this.payerFinancialResources.findIndex(x => x.financialResourceId === this.expenseInfo.payerFinancialResourceId)
                    if (indx !== -1)
                        finRes = this.payerFinancialResources[indx];
                    this.payerFinancialResourceControl.setValue(finRes.drpName);
                    let payerFinancialResourceEvent: {
                        isUserInput: any;
                        source: { value: any; selected: any };
                    } = { isUserInput: true, source: { value: finRes.drpName, selected: true } };
                    this.changePayerFinancialResource(payerFinancialResourceEvent);
                }
                this.cdr.detectChanges();
            });
            this.getRecipients();
        }

    }
    private filterRecipientFinancialResource(paymentTypeId: number) {
        /*      let obj = this.financialResourceTypePaymentType.filter(x => x.paymentTypeId === paymentTypeId);
             this.recipientFinancialResourceFilteredOptions = EMPTY;
             obj.forEach(element => {
                 let obj2: Array<FinancialResource> = this.recipientFinancialResources.filter(x => x.financialResourceTypeId === element.financialResourceTypeId);
                 obj2.forEach(element2 => {
                     this.recipientFilteredFinancialResources.push(element2);
                 });
     
             }); */
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
            this.recipientFinancialResources = [];


            this.getFinancialResource(this.recipients[indx].ownerId).subscribe(res => {
                this.isLoading = false;
                this.recipientFinancialResources = res.data;
                if (this.recipients[indx].ownerTypeId !== 1000611 && this.recipients[indx].ownerTypeId !== 1000614
                    && this.recipients[indx].ownerTypeId != 1000615
                    && this.selectedPaymentType != '1001061') {
                    let obj: FinancialResource = new FinancialResource();
                    obj.financialResourceId = 0;
                    obj.financialResourceName = 'Hand Over';
                    obj.financialResourceTypeId = 1001052;
                    obj.financialResourceTypeName = 'Safe';
                    obj.bankId = 0;
                    obj.bankName = 'none';
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

                //this.filterRecipientFinancialResource(parseInt(this.selectedPaymentType));
                this.recipientFinancialResourceControl.setValidators(recipientFinancialResourceForbiddenNamesValidator(this.recipientFinancialResources));
                if (this.pageType === 'edit') {
                    let finRes = new FinancialResource();
                    let indx = this.recipientFinancialResources.findIndex(x => x.financialResourceId === this.expenseInfo.recipientFinancialResourceId)
                    if (indx !== -1)
                        finRes = this.recipientFinancialResources[indx];
                    this.recipientFinancialResourceControl.setValue(finRes.drpName);

                }
                this.cdr.detectChanges();
            });
        }
    }
    private addSelectanItemToCatMenu() {
        let obj = new HierarchicalKeyValue();
        obj.id = 0;

        if (this.pageType === 'new' || (this.pageType === 'edit') &&
            (this.expenseInfo.financialCategoryId === null || this.expenseInfo.financialCategoryId === 0)) {
            obj.item = "Select a category";
            this.selectedCat = 0;
        }
        else {
            obj.item = this.expenseInfo.financialCategoryName;
            this.selectedCat = this.expenseInfo.financialCategoryId;
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
        this.selectedCat = selectedId;
        if (selectedId > 0)
            this.trigger.closeMenu();
    }
    private showAlert(name: string): void {
        this._fuseAlertService.show(name);
    }

    private dismissAlert(name: string): void {
        this._fuseAlertService.dismiss(name);
    }

    private filterFinnacialResource(paymentTypeId: number) {
        let obj = this.financialResourceTypePaymentType.filter(x => x.paymentTypeId === paymentTypeId);
        this.filteredFinancialResources = [];
        obj.forEach(element => {
            let obj2: Array<FinancialResource> = this.payerFinancialResources.filter(x => x.financialResourceTypeId === element.financialResourceTypeId);
            obj2.forEach(element2 => {
                this.filteredFinancialResources.push(element2);
            });

        });
    }

    setPaymentType(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {
        if (event.isUserInput) {
            this.expenseInfo.paymentTypeId = event.source.value;
            this.financialResourceDetailInfo.financialResourceId = 0;
            this.selectedPaymentType = event.source.value;
            this.recipientFinancialResources = [];
            //   this.recipientFinancialResourceFilteredOptions = EMPTY;
            this.payerFinancialResources = [];
            this.financialResourceDetails = [];
            this.financialResourceDetails$ = [];
        }
    }
    changePayerFinancialResource(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        const indx = this.payerFinancialResources.findIndex(x => x.drpName.toLowerCase().replace(/\s/g, "")
            === event.source.value.toLowerCase().replace(/\s/g, ""));
        if (indx === -1) {
            return;
        }
        this.expenseInfo.payerFinancialResourceTypeId = this.payerFinancialResources[indx].financialResourceTypeId;
        this.expenseInfo.payerBankAccountTypeId = this.payerFinancialResources[indx].bankAccountTypeId;
        this.expenseInfo.bankId = this.payerFinancialResources[indx].bankId;
        if (this.selectedPaymentType == '1001062' || this.expenseInfo.payerBankAccountTypeId == 1001541) {
            const indx = this.banks.findIndex(x => x.bankId == this.expenseInfo.bankId);
            this.selectedBankUrl = this.banks[indx].url;
        }
        this.financialResourceDetailInfo.financialResourceId = this.payerFinancialResources[indx].financialResourceId;
        this.selectedPayerFinancialResourceTypeId = this.payerFinancialResources[indx].financialResourceTypeId;
        this.getFinancialResourceDetails(this.financialResourceDetailInfo);
        if (this.selectedPayerFinancialResourceTypeId !== 1001051
            || this.selectedPaymentType != '1001061'
            || this.expenseInfo.payerTypeId !== 1000611)
            this.hideFee = true;
        else
            this.hideFee = false;

    }

    onDateChange(dateValue: string
    ) {
        if (dateValue === undefined)
            return;
        this.expenseInfo.expenseLocalDate = dateValue;
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
        this.frmExpense.controls["jdatepicker"].setValue('');
        // this.cdr.detectChanges();
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
        let { payerFinancialResourceResult, payerFinancialResourceId } = this.getPayerFinancialResourceId();
        if (!payerFinancialResourceResult) {
            this._result.succeed = false;
            this._result.message = 'All required fields should be filled';
            this.showAlert('errorMessage');
            return false
        }
        let { recipientResult, recipientId } = this.getRecipientId();
        if (this.frmExpense.controls['hasRecipient'].value) {
            if (!recipientResult) {
                this._result.succeed = false;
                this._result.message = 'All required fields should be filled';
                this.showAlert('errorMessage');
                return false
            }
            else {
                this.expenseInfo.recipientId = recipientId;

            }
            let { recipientFinancialResourceResult, recipientFinancialResourceId } = this.getRecipientFinancialResourceId();
            if (!recipientFinancialResourceResult) {
                this._result.succeed = false;
                this._result.message = 'All required fields should be filled';
                this.showAlert('errorMessage');
                return false
            }
            else {
                this.expenseInfo.recipientFinancialResourceId = recipientFinancialResourceId;
            }
        }
        else {
            this.expenseInfo.recipientId = 0;
            this.expenseInfo.recipientFinancialResourceId = 0;
        }
        if (!this.frmExpense.valid) {
            this._result.succeed = false;
            this._result.message = 'All required fields should be filled';
            this.showAlert('errorMessage');
            return false
        }

        this.expenseInfo.financialCategoryId = 0;
        this.expenseInfo.payerId = payerId;
        this.expenseInfo.payerFinancialResourceId = payerFinancialResourceId;
        this.expenseInfo.paymentTypeId = this.frmExpense.controls["paymentType"].value;
        if (this.expenseInfo.paymentTypeId == 1001063 && this.expenseInfo.payerBankAccountTypeId == 1001541) {
            this.expenseInfo.chequeTypeId = this.frmExpense.controls["chequeType"].value;
            if (this.expenseInfo.chequeTypeId == null || this.expenseInfo.chequeTypeId == 0) {
                this._result.succeed = false;
                this._result.message = 'Cheque type is not selelcted';
                this.showAlert('errorMessage');
                return false
            }

            this.expenseInfo.chequeNumber = this.frmExpense.controls["chequeNumber"].value;
            if (this.expenseInfo.chequeNumber == null || this.expenseInfo.chequeNumber == '' || this.expenseInfo.chequeNumber == '0') {
                this._result.succeed = false;
                this._result.message = 'Cheque number is not entered';
                this.showAlert('errorMessage');
                return false
            }

        }
        else
            this.expenseInfo.chequeTypeId = 0;

        this.expenseInfo.chequeNumber = this.frmExpense.controls["chequeNumber"].value;
        this.expenseInfo.amount = this.price;
        if (this.expenseInfo.paymentTypeId != 1001063 && (this.expenseInfo.amount == null || this.expenseInfo.amount <= 0)) {
            this._result.succeed = false;
            this._result.message = 'The amount of the transaction should be more than 0';
            this.showAlert('errorMessage');
            return false
        }
        this.expenseInfo.fee = this.fee;
        this.expenseInfo.paymentId = this.frmExpense.controls["paymentId"].value;
        this.expenseInfo.billId = this.frmExpense.controls["billId"].value;
        this.expenseInfo.trackingId = this.frmExpense.controls["trackingId"].value;

        if (this.selectedPaymentType == '1001061' && this.expenseInfo.payerFinancialResourceTypeId == 1001052) {
            this.expenseInfo.bankId = this.frmExpense.controls["bank"].value;
            this.expenseInfo.currencyId = 1000481;
            this.expenseInfo.chequeId = this.frmExpense.controls["chequeNumber"].value;
        } else if (this.selectedPaymentType == '1001063' && this.expenseInfo.payerFinancialResourceTypeId == 1001051 &&
            this.expenseInfo.payerBankAccountTypeId == 1001541) {
            this.expenseInfo.bankId = this.expenseInfo.bankId;
            this.expenseInfo.currencyId = 1000481;
            this.expenseInfo.chequeNumber = this.frmExpense.controls["chequeNumber"].value;
        }
        else {
            this.expenseInfo.bankId = this.financialResourceDetails.filter(x => x.financialResourceDetailId === this.expenseInfo.payerFinancialResourceDetailId)[0].bankId;
            this.expenseInfo.currencyId = this.financialResourceDetails.filter(x => x.financialResourceDetailId === this.expenseInfo.payerFinancialResourceDetailId)[0].currencyId;
            this.expenseInfo.chequeId = this.financialResourceDetails.filter(x => x.financialResourceDetailId === this.expenseInfo.payerFinancialResourceDetailId)[0].chequeId;
        }
        this.expenseInfo.description = this.frmExpense.controls["description"].value;
        return true;
    }
    save() {
        let formResult: boolean;
        this.isLoading = true;
        formResult = this.getFormInfo();
        if (!formResult) {
            this.isLoading = false;
            return;
        }
        if (this.pageType === 'new')
            this.create();
        else
            this.edit();
    }
    confirm() {
        this.isLoading = true;
        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');
        this.service.confirm(this.expenseInfo).subscribe(res => {
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
        this.service.create(this.expenseInfo).subscribe(res => {
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
        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');
        this.service.edit(this.expenseInfo).subscribe(res => {
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
    applyFilterOnFinancialResourceDetail(filterValue: string) {
        this.financialResourceDetailFilterValue = filterValue;
        this.financialResourceDetails$ = this.financialResourceDetails.filter(item =>
            item.chequeNumber.toString().toLowerCase().includes(filterValue.toLowerCase())
            || item.bankName.toString().toLocaleLowerCase().includes(filterValue.toLowerCase())
            || item.chequeLocalDateClean.toString().toLocaleLowerCase().includes(filterValue.toLowerCase())
            || item.balance.toString().toLocaleLowerCase().includes(filterValue.toLowerCase()));

    }

    selectFinancialDetail(financialResourceDetailId: number) {
        if (this.expenseInfo.payerFinancialResourceDetailId != null && this.expenseInfo.payerFinancialResourceDetailId != 0
            && this.selectedPaymentType == '1001063')
            this.deselectFinancialDetail();
        this.expenseInfo.payerFinancialResourceDetailId = financialResourceDetailId;
        this.toggleAnimationState('fadeIn.in', 'void', '*');
    }
    deselectFinancialDetail() {
        const indx = this.financialResourceDetails$.findIndex(x => x.financialResourceDetailId === this.expenseInfo.payerFinancialResourceDetailId);
        this.financialResourceDetails$[indx].chequeStatus = 1000082;
        const indx2 = this.financialResourceDetails.findIndex(x => x.financialResourceDetailId === this.expenseInfo.payerFinancialResourceDetailId);
        this.financialResourceDetails[indx2].chequeStatus = 1000082;
        this.expenseInfo.payerFinancialResourceDetailId = 0;
        this.toggleAnimationState('fadeOut.out', 'void', '*');
        this.cdr.detectChanges();
    }
    public applyAdvancedSearch() {
        this.financialResourceDetailInfo.chequeNumber = this.frmFinancialResourceDtAdSearch.controls['chequeNumber'].value;
        this.financialResourceDetailInfo.chequeDate = this.frmFinancialResourceDtAdSearch.controls['chequeDate'].value;
        this.financialResourceDetailInfo.balance = this.frmFinancialResourceDtAdSearch.controls['balance'].value;
        this.financialResourceDetailInfo.bankIdList = this.frmFinancialResourceDtAdSearch.controls['bank'].value;
        this.getFinancialResourceDetails(this.financialResourceDetailInfo);
    }
    public resetAdSearch() {
        this.frmFinancialResourceDtAdSearch.controls['chequeNumber'].setValue('');
        this.frmFinancialResourceDtAdSearch.controls['bank'].setValue('');
        this.frmFinancialResourceDtAdSearch.controls['chequeDate'].setValue('');
        this.frmFinancialResourceDtAdSearch.controls['balance'].setValue('');

    }

    private toggleAnimationState(animation: string, firstState: string | boolean, secondState: string | boolean, timeout: number = 100): void {
        // Split the animation
        const animationPath = animation.split('.');

        // Toggle the animation state
        this.animationStates[animationPath[0]][animationPath[1]] = firstState;

        setTimeout(() => {
            this.animationStates[animationPath[0]][animationPath[1]] = secondState;
        }, timeout);
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