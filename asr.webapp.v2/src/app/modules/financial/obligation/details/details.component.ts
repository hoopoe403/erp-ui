import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn } from "@angular/forms";
import { ObligationService } from "../obligation.service";
import { FuseAlertService } from '@fuse/components/alert';
import { Subject, forkJoin, Observable } from 'rxjs';
import { Obligation } from '../obligation.types';
import { OpResult } from 'app/core/type/result/result.types';
import { ActivatedRoute } from '@angular/router';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Customer, CustomerDrp } from 'app/modules/configuration/customer/customer/customer.types';
import { Bank, ChequeType } from '../../shared/financial.types';
import { FinancialResource } from '../../resource/resource.types';
@Component({
    selector: 'obligation-details',
    templateUrl: './details.component.html',
    styles: [
        /* language=SCSS */
    ],
    encapsulation: ViewEncapsulation.None
})

export class ObligationDetailsComponent implements OnInit, OnDestroy {
    chequeTypes: Array<ChequeType>;
    pageType: string;
    id: number = 0;
    customerTypes: any = [];
    banks: Array<Bank> = [];
    obligationInfo: Obligation = new Obligation();
    _result: OpResult = new OpResult();
    titleInfo: string;
    private _unsubscribeAll: Subject<any>;
    isLoading: boolean = false;
    actionDisable: boolean = false;
    frmObligation: FormGroup;
    customer: Customer = new Customer();
    filteredCustomers: Array<CustomerDrp> = new Array<CustomerDrp>();
    pledgerFinancialResources: Array<FinancialResource> = [];
    dateObject = "";
    year: string = '';
    month: string = '';
    day: string = '';
    selectedBankUrl: string = '';
    yearValue: Array<string> = [];
    constructor(
        private service: ObligationService,
        private _formBuilder: FormBuilder,
        private cdr: ChangeDetectorRef,
        private route: ActivatedRoute,
        private _fuseAlertService: FuseAlertService
    ) {
        this._unsubscribeAll = new Subject();
    }

    /**
     * On init
     */
    ngOnInit(): void {
        this.frmObligation = this.createFormObject();
        this.createPledger();
        this.isLoading = true;
        this.obligationInfo.pledgerTypeId = 1000612;
        this.id = Number(this.route.snapshot.paramMap.get('id'));
        if (this.id > 0) {
            this.pageType = 'edit';
            this.getById(this.id);
        }
        else {
            this.loadData();
            this.titleInfo = 'Register New Obligation';
            this.pageType = 'new';
            this.isLoading = false;
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
    private loadData() {
        forkJoin(
            this.getDrpCustomerType(),
            this.getBanks(),
            this.getChequeTypes(),
        ).subscribe(res => {
            this.setForkJoinValues(res);
        });

    }

    private getById(id: number) {
        this.isLoading = true;
        forkJoin(
            this.getObligation(id),
            this.getDrpCustomerType(),
            this.getBanks(),
            this.getChequeTypes(),
        ).subscribe(res => {
            this.setForkJoinValuesInEditMode(res);
        });

    }
    private createPledger() {
        this.frmObligation.controls['pledger'].valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(150),
                distinctUntilChanged()
            )
            .subscribe(() => {

                this.customer.customerName = this.frmObligation.controls['pledger'].value.toUpperCase();
                if (this.customer.customerName.length >= 3) {
                    this.isLoading = true;
                    this.cdr.markForCheck();
                    this.cdr.detectChanges();
                    this.service.getCustomersWithFilter(this.customer).subscribe(res => {
                        this.filteredCustomers = res.data;
                        this.frmObligation.controls['pledger'].setValidators(forbiddenNamesValidator(res.data));
                        this.isLoading = false;
                        this.cdr.markForCheck();
                        this.cdr.detectChanges();
                    });
                }
                else {
                    this.filteredCustomers = [];
                    this.cdr.markForCheck();
                    this.cdr.detectChanges();
                }


            });


    }
    private setForkJoinValues(values: Array<any>): void {
        this.customerTypes = values[0].data;
        this.banks = values[1].data;
        this.chequeTypes = values[2].data;
        this.isLoading = false;
    }
    private setForkJoinValuesInEditMode(values: Array<any>): void {

        this.customerTypes = values[1].data;
        this.banks = values[2].data;
        this.chequeTypes = values[3].data;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
        this.obligationInfo = values[0].data;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
        this.setFormValues();
        this.isLoading = false;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
    }
    private setFormValues() {
        this.frmObligation.controls['pledgee'].setValue(this.obligationInfo.pledgeeId);
        this.frmObligation.controls['pledger'].setValue(this.obligationInfo.pledgerName);
        this.frmObligation.controls['bank'].setValue(this.obligationInfo.bankId);
        this.frmObligation.controls['chequeNumber'].setValue(this.obligationInfo.chequeNumber);
        this.frmObligation.controls['chequeType'].setValue(this.obligationInfo.chequeTypeId);
        this.frmObligation.controls["pledgeeFinancialResource"].setValue(this.obligationInfo.pledgeeFinancialResourceId);
        this.onDateChange(this.obligationInfo.obligationLocalDate);
        this.frmObligation.controls["amount"].setValue(this.obligationInfo.amount);
        this.processPrice(this.obligationInfo.amount.toString());
        this.titleInfo = this.obligationInfo.pledgerName.toString();
    }
    private showAlert(name: string): void {
        this._fuseAlertService.show(name);
    }

    private dismissAlert(name: string): void {
        this._fuseAlertService.dismiss(name);
    }

    private getObligation(id: number): Observable<any> {
        return this.service.getObligation(id);
    }

    private getFinancialResource(ownerId: number): Observable<any> {
        this.isLoading = true;
        let obj: FinancialResource = new FinancialResource();
        obj.ownerId = ownerId;
        obj.financialResourceTypeId = 1001052;
        return this.service.getFinancialResources(obj);
    }
    private createFormObject(): FormGroup {

        return this._formBuilder.group({
            type: [this.obligationInfo.obligationTypeId],
            pledgerType: { value: 1000612, disabled: true },
            customerType: [],
            pledger: [this.obligationInfo.pledgerId],
            pledgeeType: { value: 1000611, disabled: true },
            pledgee: [this.obligationInfo.pledgeeId],
            collateralType: [this.obligationInfo.pledgeeId],
            obligationType: [this.obligationInfo.obligationTypeId],
            bank: [this.obligationInfo.bankId],
            chequeNumber: [this.obligationInfo.chequeNumber],
            chequeType: [this.obligationInfo.chequeTypeId],
            jdatepicker: '',
            amount: [this.obligationInfo.amount],
            pledgeeFinancialResource: [this.obligationInfo.pledgeeFinancialResourceId]
        });

    }

    save() {
        let formResult: boolean;
        formResult = this.getFormInfo();
        if (!formResult)
            return;
        if (this.pageType == 'new')
            this.create();
        else
            this.edit();
    }

    create() {
        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');
        this.isLoading = true;
        this.actionDisable = true;
        this.service.create(this.obligationInfo).subscribe(res => {
            this.isLoading = false;
            this._result.succeed = res.succeed;
            this._result.message = res.message;
            if (this._result.succeed) {
                this.showAlert('successMessage');
                this.pageType = 'edit';
                this.obligationInfo.status = 1000007;
                this.obligationInfo.obligationId = res.data;
                this.titleInfo = this.obligationInfo.pledgerName;
            }
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
        this.service.edit(this.obligationInfo).subscribe(res => {
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


    private getFormInfo(): boolean {
        this.obligationInfo.chequeNumber = this.frmObligation.controls["chequeNumber"].value;
        /*   if (this.frmObligation.controls['code'].value == null ||
              this.frmObligation.controls['name'].value == null ||
              this.frmObligation.controls['discountPrecent'].value == null) {
              this._result.succeed = false;
              this._result.message = 'All required fields should be filled';
              this.showAlert('errorMessage');
              return false
          } */
        /*   this.obligationInfo.customerTypeCode = this.frmObligation.controls['code'].value;
          this.obligationInfo.customerTypeName = this.frmObligation.controls['name'].value;
          this.obligationInfo.discountPercent = this.frmObligation.controls['discountPrecent'].value;
          this.obligationInfo.status = ((this.frmObligation.controls['status'].value == "" || this.frmObligation.controls['status'].value == null) ? 0 : 1);
          this.obligationInfo.customerTypeId = this.id; */
        return true
    }
    changeCustomer(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            this.customer.customerId = this.getCustomerId(event.source.value);
            this.obligationInfo.pledgerId = this.customer.customerId;
            this.obligationInfo.pledgerName = event.source.value;
        }


    }
    private getCustomerId(value: string): number {
        let indx: number;
        if (value === null)
            indx = -1;
        else
            indx = this.filteredCustomers.findIndex(x => x.customerNameFamily == value);
        return this.filteredCustomers[indx].customerId;
    }
    private getDrpCustomerType(): Observable<any> {
        return this.service.getDrpCustomerType();
    }
    private getBanks(): Observable<any> {
        return this.service.getBanks();
    }
    private getChequeTypes(): Observable<any> {
        return this.service.getChequeTypes();

    }
  
    onDateChange(dateValue: string
    ) {
        if (dateValue === undefined)
            return;
        this.obligationInfo.obligationLocalDate = dateValue;
        dateValue = dateValue.replace('/', '');
        dateValue = dateValue.replace('/', '');
        dateValue = dateValue.replace('-', '');
        dateValue = dateValue.replace('-', '');
        this.year = dateValue.substring(0, 4);
        this.month = dateValue.substring(4, 6);
        this.day = dateValue.substring(6, 8);
        this.yearValue = [];
        this.yearValue.push(dateValue.substring(0, 1));
        this.yearValue.push(dateValue.substring(1, 2));
        this.yearValue.push(dateValue.substring(2, 3));
        this.yearValue.push(dateValue.substring(3, 4));
        this.yearValue.push(dateValue.substring(4, 5));
        this.yearValue.push(dateValue.substring(5, 6));
        this.yearValue.push(dateValue.substring(6, 7));
        this.yearValue.push(dateValue.substring(7, 8));
        console.log(this.yearValue);
        this.dateObject = '';
        this.frmObligation.controls["jdatepicker"].setValue('');
        this.cdr.markForCheck();
        this.cdr.detectChanges();
    }
    setBank(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {


        const indx = this.banks.findIndex(x => x.bankId == event.source.value.toString());
        this.selectedBankUrl = this.banks[indx].url;


    }
    setPledgee(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {


        this.getFinancialResource(event.source.value).subscribe(res => {
            this.pledgerFinancialResources = res.data;
            this.isLoading = false;
            this.cdr.detectChanges();
        });


    }
    processPrice(price: string) {
        let result: string;
        let counter: number = 0;
        price = price.replace(/,/g, '');
        if (!/^\d+$/.test(price)) {
            result = price.substring(0, price.length - 1);
            this.obligationInfo.amount = 0;
        }
        else {
            this.obligationInfo.amount = Number(price);
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

        this.frmObligation.controls["amount"].setValue(result);
    }
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }
    confirm() {
        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');
        this.service.confirm(this.obligationInfo).subscribe(res => {
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

}

export function forbiddenNamesValidator(customers: CustomerDrp[]): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
        // below findIndex will check if control.value is equal to one of our options or not
        const index = customers.findIndex(customer => {
            return customer.customerNameFamily.toLowerCase().replace(/\s/g, "")
                == control.value.toLowerCase().replace(/\s/g, "");
        });
        return index < 0 ? { 'forbiddenNames': { value: control.value } } : null;
    };
}