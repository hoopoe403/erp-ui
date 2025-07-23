import { ChangeDetectorRef, Component, OnDestroy, OnInit,  ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup } from "@angular/forms";
import { CustomerTypeService } from "../customer-type.service";
import { FuseAlertService } from '@fuse/components/alert';
import { Subject, forkJoin, Observable } from 'rxjs';
import { CustomerType } from '../customer-type.types';
import { OpResult } from 'app/core/type/result/result.types';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'CustomerTypes-details',
    templateUrl: './details.component.html',
    styles: [
        /* language=SCSS */
    ],
    encapsulation: ViewEncapsulation.None
})

export class CustomerTypeDetailsComponent implements OnInit, OnDestroy {
    pageType: string;
    id: number = 0;
    customerTypeInfo: CustomerType = new CustomerType();
    _result: OpResult = new OpResult();
    titleInfo: string;
    private _unsubscribeAll: Subject<any>;
    isLoading: boolean = false;
    actionDisable: boolean = false;
    frmCustomerType: FormGroup;
    dateObject;

    

    constructor(
        private service: CustomerTypeService,
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
        this.frmCustomerType = this.createFormObject();
        this.isLoading = true;
        this.id = Number(this.route.snapshot.paramMap.get('id'));
        if (this.id > 0) {
            this.pageType = 'edit';
            this.getById(this.id);
        }
        else {
            this.customerTypeInfo.customerTypeCode = 0;
            this.customerTypeInfo.customerTypeName = 0;
            this.customerTypeInfo.discountPercent = 0;
            this.titleInfo = 'Register New Customer Type';
            this.pageType = 'new';
            this.isLoading = false;
        }
    }

    /**
     * On destroy
     */

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }
  

    private getById(id: number) {
        this.isLoading = true;
        forkJoin(
            this.getCustomerType(id),
        ).subscribe(res => {
            this.setForkJoinValuesInEditMode(res);
        });

    }
   

    private setForkJoinValuesInEditMode(values: Array<any>): void {
        this.customerTypeInfo = values[0].data;
        this.titleInfo = this.customerTypeInfo.customerTypeName.toString()
        this.frmCustomerType.controls['code'].setValue(this.customerTypeInfo.customerTypeCode)
        this.frmCustomerType.controls['name'].setValue(this.customerTypeInfo.customerTypeName)
        this.frmCustomerType.controls['discountPrecent'].setValue(this.customerTypeInfo.discountPercent)
        this.frmCustomerType.controls['status'].setValue(this.customerTypeInfo.status === 1 ? 1 : 0)
        this.isLoading = false;
    }

    private showAlert(name: string): void {
        this._fuseAlertService.show(name);
    }

    private dismissAlert(name: string): void {
        this._fuseAlertService.dismiss(name);
    }
    
    private getCustomerType(id: number): Observable<any> {
        return this.service.getCustomerType(id);
    }


    private createFormObject(): FormGroup {

        return this._formBuilder.group({
            code: [this.customerTypeInfo.customerTypeCode],
            name: [this.customerTypeInfo.customerTypeName],
            discountPrecent: [this.customerTypeInfo.discountPercent],
            status : [this.customerTypeInfo.status],
            id : [this.customerTypeInfo.customerTypeId]
        });
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
        this.service.create(this.customerTypeInfo).subscribe(res => {
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
        this.service.edit(this.customerTypeInfo).subscribe(res => {
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
        if (this.frmCustomerType.controls['code'].value == null ||
            this.frmCustomerType.controls['name'].value == null || 
            this.frmCustomerType.controls['discountPrecent'].value == null){
            this._result.succeed = false;
            this._result.message = 'All required fields should be filled';
            this.showAlert('errorMessage');
            return false
        }
        this.customerTypeInfo.customerTypeCode = this.frmCustomerType.controls['code'].value;
        this.customerTypeInfo.customerTypeName = this.frmCustomerType.controls['name'].value;
        this.customerTypeInfo.discountPercent = this.frmCustomerType.controls['discountPrecent'].value;
        this.customerTypeInfo.status = ((this.frmCustomerType.controls['status'].value == "" || this.frmCustomerType.controls['status'].value == null ) ? 0 : 1);
        this.customerTypeInfo.customerTypeId = this.id;
            return true
    }
  

   
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }
 
}