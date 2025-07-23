import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { fuseAnimations } from "../../../../../@fuse/animations";
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidatorFn } from "@angular/forms";
import { animate, state, style, transition, trigger } from "@angular/animations";
import { FinancialResourceService } from "../resource.service";
import { FuseAlertService } from '@fuse/components/alert';
import { Observable, Subject, forkJoin } from 'rxjs';
import { FinancialResource } from '../resource.types';
import { OpResult } from 'app/core/type/result/result.types';
import { ActivatedRoute } from '@angular/router';
import { MatMenuTrigger } from '@angular/material/menu';
import { Bank } from '../../transactions/revenue/revenue.types';
import { BankAccountType, FinancialResourceType } from '../../shared/financial.types';
import { Owner } from 'app/modules/configuration/owner/owner.types';
import { map, startWith } from 'rxjs/operators';
@Component({
    selector: 'resource-details',
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

export class ResourceDetailsComponent implements OnInit, OnDestroy {
    titleInfo: string;
    id: number;
    resourceInfo: FinancialResource = new FinancialResource();
    _result: OpResult = new OpResult();
    pageType: string;
    private _unsubscribeAll: Subject<any>;
    isLoading: boolean = false;
    frmResource: FormGroup;
    banks: Array<Bank> = [];
    resourceTypes: Array<FinancialResourceType> = [];
    bankAccountTypes: Array<BankAccountType> = [];
    owners: Array<Owner> = [];
    ownerFilteredOptions: Observable<Owner[]>;
    ownerControl = new FormControl();
    beneficiaries: Array<Owner> = [];
    selectedBankUrl: string = '';
    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
    constructor(
        private service: FinancialResourceService,
        private _formBuilder: FormBuilder,
        private cdr: ChangeDetectorRef,
        private route: ActivatedRoute,
        private _fuseAlertService: FuseAlertService
    ) {
        this.owners = new Array<Owner>();
        this._unsubscribeAll = new Subject();
        // Set the default

    }

    /**
     * On init
     */
    ngOnInit(): void {
        this.ownerFilteredOptions = this.ownerControl.valueChanges.pipe(
            startWith(''),
            map(value => this._ownerFilter(value))
        );
        this.frmResource = this.createFormObject();
        this.isLoading = true;

        this.id = Number(this.route.snapshot.paramMap.get('id'));
        if (this.id > 0) {
            this.pageType = 'edit';
            this.getById(this.id);

        }
        else {
            this.titleInfo = 'Register New Resource';
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
            this.getBanks(),
            this.getResourceTypes(),
            this.getowners(),
            this.getBankAccountTypes(),
        ).subscribe(res => {
            this.setForkJoinValues(res);
            this.isLoading = false;
            this.cdr.detectChanges();
        });

    }
    private getById(id: number) {
        this.isLoading = true;

        forkJoin(
            this.getResource(id),
            this.getBanks(),
            this.getResourceTypes(),
            this.getowners(),
            this.getBankAccountTypes(),
        ).subscribe(res => {
            this.setForkJoinValuesInEditMode(res);
            this.isLoading = false;
            this.setFormValues();
            this.cdr.detectChanges();
        });

    }



    private getResource(id: number): Observable<any> {
        return this.service.getResource(id.toString());
        /* .subscribe(res => {
            this.goodsInfo = res.data;
        }); */
    }

    private setForkJoinValues(values: Array<any>): void {
        this.banks = values[0].data;
        this.resourceTypes = values[1].data;
        this.owners = values[2].data;
        this.bankAccountTypes = values[3].data;
        this.ownerControl.setValidators(ownerForbiddenNamesValidator(this.owners));

    }

    private setForkJoinValuesInEditMode(values: Array<any>): void {
        this.resourceInfo = values[0].data;
        this.banks = values[1].data;
        this.resourceTypes = values[2].data;
        this.owners = values[3].data;
        this.bankAccountTypes = values[4].data;
        this.ownerControl.setValidators(ownerForbiddenNamesValidator(this.owners));
        this.titleInfo = this.resourceInfo.financialResourceName.concat('-').concat(this.resourceInfo.financialResourceCode);
    }

    private createFormObject(): FormGroup {

        return this._formBuilder.group({
            code: '',
            name: '',
            resourceType: '',
            beneficiary: '',
            bank: { value: null, disabled: true },
            accountHolder: { value: null, disabled: true },
            accountNumber: { value: null, disabled: true },
            bankAccountType: { value: null, disabled: true },
            status: '',
        });
    }


    private getBanks(): Observable<any> {
        return this.service.getBanks();
    }

    private getResourceTypes(): Observable<any> {
        return this.service.getResourceType();
    }

    private getBankAccountTypes(): Observable<any> {
        return this.service.getBankAccountType();
    }
    private getowners(): Observable<any> {
        return this.service.getOwner();
    }

    private _ownerFilter(value: string): Owner[] {
        const filterValue = value.toLowerCase().replace(' ', '');
        return this.owners.filter(option => option.ownerName.toLowerCase().replace(' ', '').includes(filterValue));
    }

    private showAlert(name: string): void {
        this._fuseAlertService.show(name);
    }

    private dismissAlert(name: string): void {
        this._fuseAlertService.dismiss(name);
    }

    changeBankInfoStatus(stauts: string) {
        if (stauts === 'enable') {
            this.frmResource.controls['bank'].enable();
            this.frmResource.controls['accountHolder'].enable();
            this.frmResource.controls['accountNumber'].enable();
            this.frmResource.controls['bankAccountType'].enable();
        }
        else {
            this.frmResource.controls['bank'].disable();
            this.frmResource.controls['accountHolder'].disable();
            this.frmResource.controls['accountNumber'].disable();
            this.frmResource.controls['bankAccountType'].disable();
            this.frmResource.controls['bank'].setValue('');
            this.frmResource.controls['accountHolder'].setValue('');
            this.frmResource.controls['accountNumber'].setValue('');
            this.frmResource.controls['bankAccountType'].setValue('');
        }
    }


    setResourceType(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {

            if (event.source.value === 1001051)
                this.changeBankInfoStatus('enable');
            else
                this.changeBankInfoStatus('disable');

        }

    }

    setBankAccountType(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {

            if (this.frmResource.controls['resourceType'].value == 1001051)
                this.changeBankInfoStatus('enable');
            else
                this.changeBankInfoStatus('disable');

        }

    }

    setOwner(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            this.beneficiaries = [];
            const indx = this.owners.findIndex(x => x.ownerName.toLowerCase().replace(/\s/g, "")
                === event.source.value.toLowerCase().replace(/\s/g, ""));
            if (indx === -1) {
                return;
            }

            if (this.owners[indx].ownerTypeId === 1000614) {
                this.frmResource.controls["beneficiary"].enable();
                let orgObj: Owner = new Owner();
                orgObj.ownerId = 1000010;
                orgObj.ownerName = 'Arian System Ro';
                orgObj.ownerTypeId = 1000611;
                this.beneficiaries.push(orgObj);

                let perObj: Owner = new Owner();
                perObj.ownerId = this.owners[indx].ownerId;
                perObj.ownerName = this.owners[indx].ownerName;
                perObj.ownerTypeId = this.owners[indx].ownerTypeId;
                this.beneficiaries.push(perObj);
            }
            else {
                let perObj: Owner = new Owner();
                perObj.ownerId = this.owners[indx].ownerId;
                perObj.ownerName = this.owners[indx].ownerName;
                perObj.ownerTypeId = this.owners[indx].ownerTypeId;
                this.beneficiaries.push(perObj);
                this.frmResource.controls["beneficiary"].setValue(perObj.ownerId);
                this.frmResource.controls["beneficiary"].disable();

            }

        }

    }


    private getOwnerId() {
        let result: boolean;
        let ownerId: number;
        if (this.ownerControl.value === null) {
            result = false;
            ownerId = 0;
        }
        else {
            const indx = this.owners.findIndex(x => x.ownerName.toLowerCase().replace(/\s/g, "")
                === this.ownerControl.value.toLowerCase().replace(/\s/g, ""));
            if (indx === -1) {
                result = false;
                ownerId = 0;
            }
            else {
                result = true;
                ownerId = this.owners[indx].ownerId;
            }
        }
        return { result, ownerId };
    }
    private setFormValues() {
        this.ownerControl.setValue(this.resourceInfo.ownerName);
        let ownerEvent: {
            isUserInput: any;
            source: { value: any; selected: any };
        } = { isUserInput: true, source: { value: this.resourceInfo.ownerName, selected: true } };
        this.setOwner(ownerEvent);

        this.frmResource.controls["code"].setValue(this.resourceInfo.financialResourceCode);
        this.frmResource.controls["name"].setValue(this.resourceInfo.financialResourceName);
        this.frmResource.controls["beneficiary"].setValue(this.resourceInfo.beneficiaryId);
        this.frmResource.controls["resourceType"].setValue(this.resourceInfo.financialResourceTypeId);
        if (this.resourceInfo.financialResourceTypeId === 1001051) {
            this.frmResource.controls["bank"].setValue(this.resourceInfo.bankId);
            this.frmResource.controls["accountHolder"].setValue(this.resourceInfo.accountHolder);
            this.frmResource.controls["accountNumber"].setValue(this.resourceInfo.accountNumber);
            this.frmResource.controls["bankAccountType"].setValue(this.resourceInfo.bankAccountTypeId);
            this.frmResource.controls["bank"].enable();
            this.frmResource.controls["accountHolder"].enable();
            this.frmResource.controls["accountNumber"].enable();
            this.frmResource.controls["bankAccountType"].enable();
        }
        else {
            this.resourceInfo.bankId = 0;
            this.resourceInfo.accountHolder = '0';
            this.resourceInfo.accountNumber = '0';
        }
        this.frmResource.controls["status"].setValue(this.resourceInfo.status);
        this.ownerControl.disable();
        this.frmResource.controls["beneficiary"].disable();
        this.frmResource.controls["resourceType"].disable();

    }
    private getFormInfo(): boolean {
        let finalResult: boolean = true;
        const controls = this.frmResource.controls;
        for (const name in controls) {
            if (this.frmResource.controls["resourceType"].value === 1001052 &&
                (name == 'bank' || name == 'accountHolder' || name == 'accountNumber'))
                continue;
            if (controls[name] != undefined && !controls[name].disabled && !controls[name].valid) {
                this._result.succeed = false;
                this._result.message = "There is atleast one unfilled element! Please fill all the elements in the all tabs";
                finalResult = false;
                return finalResult;
            }
        }
        this.resourceInfo.financialResourceCode = this.frmResource.controls["code"].value;
        this.resourceInfo.financialResourceName = this.frmResource.controls["name"].value;
        let { result, ownerId } = this.getOwnerId();
        if (!result) {
            this._result.succeed = false;
            this._result.message = 'All required fields should be filled';
            this.showAlert('errorMessage');
            return false
        }
        this.resourceInfo.ownerId = ownerId;
        this.resourceInfo.beneficiaryId = this.frmResource.controls["beneficiary"].value;
        this.resourceInfo.financialResourceTypeId = this.frmResource.controls["resourceType"].value;
        if (this.resourceInfo.financialResourceTypeId === 1001051) {
            this.resourceInfo.bankId = this.frmResource.controls["bank"].value;
            this.resourceInfo.accountHolder = this.frmResource.controls["accountHolder"].value;
            this.resourceInfo.accountNumber = this.frmResource.controls["accountNumber"].value;
            this.resourceInfo.bankAccountTypeId = this.frmResource.controls["bankAccountType"].value;
        }
        else {
            this.resourceInfo.bankId = 0;
            this.resourceInfo.accountHolder = '0';
            this.resourceInfo.accountNumber = '0';
        }
        this.resourceInfo.status = this.frmResource.controls["status"].value;

        return finalResult;
    }
    save() {
        let formResult: boolean;
        formResult = this.getFormInfo();
        if (!formResult) {
            this.showAlert('errorMessage');
            this.cdr.detectChanges();
            return;
        }

        if (this.pageType === 'new')
            this.create();
        else
            this.edit();
    }

    private create() {
        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');
        this.service.create(this.resourceInfo).subscribe(res => {
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

    private edit() {

        this.service.edit(this.resourceInfo).subscribe(res => {
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

export function ownerForbiddenNamesValidator(owners: Owner[]): ValidatorFn {

    return (control: AbstractControl): { [key: string]: any } | null => {
        // below findIndex will check if control.value is equal to one of our options or not
        const index = owners.findIndex(owner => {
            return owner.ownerName.toLowerCase().replace(/\s/g, "")
                == control.value.toLowerCase().replace(/\s/g, "");
        });
        return index < 0 ? { 'forbiddenNames': { value: control.value } } : null;
    };
}

