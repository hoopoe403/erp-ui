import { ChangeDetectorRef, Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CashChequeDialogConfig } from '../dialog.types';
import { ChequeService } from '../../cheque.service';
import { Cheque, ChequeTransaction } from '../../cheque.types';
import { FuseAlertService } from '@fuse/components/alert';
import { OpResult } from 'app/core/type/result/result.types';
import { Owner, OwnerType } from 'app/modules/configuration/owner/owner.types';
import { forkJoin, Observable } from 'rxjs';
import { FormBuilder, FormGroup } from '@angular/forms';
import { FinancialResource } from 'app/modules/financial/resource/resource.types';

@Component({
    selector: 'fuse-confirmation-dialog',
    templateUrl: './dialog.component.html',
    encapsulation: ViewEncapsulation.None
})
export class CashChequeDialogComponent implements OnInit {
    /**
     * Constructor
     */
    private recipientTypes: Array<OwnerType> = [];
    filteredRecipientTypes: Array<OwnerType> = [];
    chequeInfo: Cheque;
    recipients: Array<Owner> = [];
    payers: Array<Owner> = [];
    payerFinancialResources: Array<FinancialResource> = [];
    recipientFinancialResources: Array<FinancialResource> = [];
    firstChequeTransaction: ChequeTransaction;
    isDataLoading: boolean;
    isLoading: boolean;
    _result: OpResult = new OpResult();
    confirmResult: boolean = false;
    frmCashCheque: FormGroup;

    constructor(private service: ChequeService,
        private _fuseAlertService: FuseAlertService,
        private cdr: ChangeDetectorRef,
        private _formBuilder: FormBuilder,
        @Inject(MAT_DIALOG_DATA) public data: CashChequeDialogConfig,
        public matDialogRef: MatDialogRef<CashChequeDialogComponent>
    ) {
        this.firstChequeTransaction = new ChequeTransaction();
        this.chequeInfo = new Cheque();
        this.chequeInfo.chequeId = data.chequeId;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        this.frmCashCheque = this.createFormObject();
        this.loadData();

    }
    private createFormObject(): FormGroup {

        return this._formBuilder.group({
            payer: '',
            payerFinancialResource: '',
            recipientType: '',
            recipient: '',
            recipientFinancialResource: '',
            fee: '',
        });
    }
    private setForkJoinValues(values: Array<any>): void {
        this.chequeInfo = values[0].data;
        this.recipientTypes = values[1].data;
        let obj: Owner = new Owner();
        obj.ownerId = this.chequeInfo.recipientId;
        obj.ownerName = this.chequeInfo.recipientName;
        this.frmCashCheque.controls['payer'].setValue(this.chequeInfo.recipientId);
        this.frmCashCheque.controls['payer'].disable();
        this.payers.push(obj);
        let payerFinRes: FinancialResource = new FinancialResource();
        payerFinRes.financialResourceId = this.chequeInfo.financialResourceId;
        payerFinRes.financialResourceName = this.chequeInfo.financialResourceName;
        this.payerFinancialResources.push(payerFinRes);
        this.frmCashCheque.controls['payerFinancialResource'].setValue(this.chequeInfo.financialResourceId);
        this.frmCashCheque.controls['payerFinancialResource'].disable();
        if (this.data.requestType === 'bounce') {
            this.filteredRecipientTypes = this.recipientTypes.filter(x => x.ownerTypeId === 1000611);
        }
        else if (this.data.requestType === 'cash') {
            if (this.chequeInfo.recipientTypeId !== 1000611) {
                this.filteredRecipientTypes = this.recipientTypes.filter(x => x.ownerTypeId === this.chequeInfo.recipientTypeId);
            }
            else {
                this.filteredRecipientTypes = this.recipientTypes.filter(x => x.ownerTypeId === 1000611
                    || x.ownerTypeId === 1000613
                    || x.ownerTypeId === 1000615);
            }
        }


    }
    private loadData() {
        this.isDataLoading = true;
        if (this.data.requestType === 'refund')
            this.getFirstChequeTransaction(this.chequeInfo.chequeId);
        forkJoin(
            this.getChequeInfo(this.chequeInfo.chequeId),
            this.getOwnerTypes(),
        ).subscribe(res => {
            this.setForkJoinValues(res);
            this.isDataLoading = false;
            this.cdr.detectChanges();
        });
    }

    private getChequeInfo(chequeId: number): Observable<any> {
        return this.service.getCheque(chequeId.toString());
    }

    private getRecipients(ownerTypeId: number) {
        let obj: Owner = new Owner;
        obj.ownerTypeIdList = [];
        obj.ownerTypeId = ownerTypeId;
        this.recipients = [];
        if (ownerTypeId != 1000611 && this.chequeInfo.recipientTypeId !== 1000611) {
            obj.ownerId = this.chequeInfo.recipientId;
            obj.ownerName = this.chequeInfo.recipientName;
            this.frmCashCheque.controls['recipient'].setValue(this.chequeInfo.recipientId);
            this.recipients.push(obj);
            this.isLoading = false;
            this.cdr.detectChanges();
        }
        else {
            this.service.getRecipients(obj).subscribe(res => {
                this.recipients = res.data;
                this.isLoading = false;
                this.cdr.detectChanges();
            });
        }
    }
    private getOwnerTypes(): Observable<any> {
        return this.service.getOwnerTypes();
    }
    private getFirstChequeTransaction(chequeId: number) {
        let obj: ChequeTransaction = new ChequeTransaction();
        obj.chequeId = chequeId;
        this.service.getFirstChequeTransaction(obj).subscribe(res => {
            this.firstChequeTransaction = res.data;

            let ownerType: OwnerType = new OwnerType();
            ownerType.ownerTypeId = this.firstChequeTransaction.payerTypeId;
            ownerType.ownerTypeName = this.firstChequeTransaction.payerTypeName;
            this.filteredRecipientTypes.push(ownerType);
            this.frmCashCheque.controls["recipientType"].setValue(this.firstChequeTransaction.payerTypeId);
            this.frmCashCheque.controls["recipientType"].disable();

            let owner: Owner = new Owner();
            owner.ownerId = this.firstChequeTransaction.payerId;
            owner.ownerName = this.firstChequeTransaction.payerName;
            this.recipients.push(owner);
            this.frmCashCheque.controls["recipient"].setValue(this.firstChequeTransaction.payerId);
            this.frmCashCheque.controls["recipient"].disable();

            let obj: FinancialResource = new FinancialResource();
            if (this.firstChequeTransaction.payerFinancialResourceId === 0) {
                obj.financialResourceId = 0;
                obj.financialResourceName = 'Hand Over';
                obj.financialResourceTypeName = 'Manual';
                obj.financialResourceTypeId = 1001052;
                obj.drpName = obj.financialResourceName.concat('-').concat(obj.financialResourceTypeName).concat('-').concat(obj.bankName);
            }
            else {
                obj.financialResourceId = this.firstChequeTransaction.payerFinancialResourceId;
                obj.financialResourceName = this.firstChequeTransaction.payerFinancialResourceName;
            }

            this.recipientFinancialResources.push(obj);
            this.frmCashCheque.controls["recipientFinancialResource"].setValue(this.firstChequeTransaction.payerFinancialResourceId);
            if (this.firstChequeTransaction.payerTypeId != 1000611)
                this.frmCashCheque.controls["recipientFinancialResource"].disable();
            this.isLoading = false;
            this.cdr.detectChanges();
        });
    }

    private getFormInfo(): boolean {
        if (this.recipients.findIndex(x => x.ownerId == this.frmCashCheque.controls['recipient'].value) == -1) {
            this._result.succeed = false;
            this._result.message = 'All required fields should be filled';
            this.showAlert('errorMessage');
            return false
        }
        if (this.recipientFinancialResources.findIndex(x => x.financialResourceId == this.frmCashCheque.controls['recipientFinancialResource'].value) == -1) {
            this._result.succeed = false;
            this._result.message = 'All required fields should be filled';
            this.showAlert('errorMessage');
            return false
        }
        this.chequeInfo.recipientId = this.frmCashCheque.controls['recipient'].value;
        this.chequeInfo.financialResourceId = this.frmCashCheque.controls['recipientFinancialResource'].value;
        this.chequeInfo.fee = this.frmCashCheque.controls['fee'].value;
        return true;
    }
    register() {
        this.isLoading = true;
        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');
        let formResult: boolean;
        formResult = this.getFormInfo();
        if (!formResult) {
            this.isLoading = false;
            return;
        }
        if (this.data.requestType === 'cash')
            this.cashCheque();
        else if (this.data.requestType === 'bounce')
            this.bounceCheque();
        else if (this.data.requestType === 'refund')
            this.refundCheque();
    }
    private cashCheque(): void {
        this.service.cashCheque(this.chequeInfo).subscribe(res => {
            this.isLoading = false;
            this._result.succeed = res.succeed;
            this._result.message = res.message;
            this.confirmResult = this._result.succeed;
            if (this._result.succeed)
                this.showAlert('successMessage');
            else
                this.showAlert('errorMessage');
            this.cdr.detectChanges();
        });
    }
    private bounceCheque(): void {
        this.service.bounceCheque(this.chequeInfo).subscribe(res => {
            this.isLoading = false;
            this._result.succeed = res.succeed;
            this._result.message = res.message;
            this.confirmResult = this._result.succeed;
            if (this._result.succeed)
                this.showAlert('successMessage');
            else
                this.showAlert('errorMessage');
            this.cdr.detectChanges();
        });
    }
    private refundCheque(): void {
        this.service.refundCheque(this.chequeInfo).subscribe(res => {
            this.isLoading = false;
            this._result.succeed = res.succeed;
            this._result.message = res.message;
            this.confirmResult = this._result.succeed;
            if (this._result.succeed)
                this.showAlert('successMessage');
            else
                this.showAlert('errorMessage');
            this.cdr.detectChanges();
        });
    }
    private showAlert(name: string): void {
        this._fuseAlertService.show(name);
    }
    setRecipient(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {


        const indx = this.recipients.findIndex(x => x.ownerId == event.source.value);
        if (indx === -1) {
            return;
        }
        this.isLoading = true;
        this.getFinancialResource(this.recipients[indx].ownerId).subscribe(res => {
            this.isLoading = false;
            this.recipientFinancialResources = res.data;
            if (this.recipients[indx].ownerTypeId !== 1000611 && this.recipients[indx].ownerTypeId !== 1000615) {
                let obj: FinancialResource = new FinancialResource();
                obj.financialResourceId = 0;
                obj.financialResourceName = 'Hand Over';
                obj.financialResourceTypeName = 'Manual';
                obj.financialResourceTypeId = 1001052;
                obj.drpName = obj.financialResourceName.concat('-').concat(obj.financialResourceTypeName).concat('-').concat(obj.bankName);
                this.recipientFinancialResources.push(obj);
            }
            else if (this.recipients[indx].ownerTypeId !== 1000611 && this.recipients[indx].ownerTypeId !== 1000615) {
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

            this.cdr.detectChanges();
        });



    }
    setRecipientType(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            this.recipientFinancialResources = [];
            if (event.source.value === 1000611)
                this.frmCashCheque.controls['fee'].enable();
            else {
                this.frmCashCheque.controls['fee'].setValue('');
                this.frmCashCheque.controls['fee'].disable();
            }


            this.isLoading = true;
            this.getRecipients(event.source.value);
        }


    }
    private getFinancialResource(ownerId: number): Observable<any> {
        this.isLoading = true;
        let obj: FinancialResource = new FinancialResource();
        obj.ownerId = ownerId;
        if (this.data.requestType == 'bounce' || this.data.requestType == 'refund')
            obj.financialResourceTypeId = 1001052;
        return this.service.getFinancialResources(obj);
    }
    private dismissAlert(name: string): void {
        this._fuseAlertService.dismiss(name);
    }
    closeDialog() {
        this.matDialogRef.close(this.confirmResult);
    }
    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

}
