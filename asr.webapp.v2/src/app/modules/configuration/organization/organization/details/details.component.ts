import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { OpResult } from '../../../../../core/type/result/result.types';
import { fuseAnimations } from "../../../../../../@fuse/animations";
import { Organization } from "../organization.types";
import { FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { animate, state, style, transition, trigger } from "@angular/animations";
import { OrganizationService } from "../organization.service";
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { FuseAlertService } from '@fuse/components/alert';


@Component({
    selector: 'organization-details',
    templateUrl: './details.component.html',
    animations: [fuseAnimations, trigger('detailExpand', [
        state('collapsed', style({ height: '0px', minHeight: '0' })),
        state('expanded', style({ height: '*' })),
        transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
    ],
    encapsulation: ViewEncapsulation.None
})
export class OrganizationDetailsComponent implements OnInit, OnDestroy {
    organization: Organization;
    pageType: string;
    frmOrgInfo: FormGroup;
    frmFileUploader: FormGroup;
    newItemName = '';
    selectedFile = null;
    _result: OpResult = new OpResult();

    name = 'Angular';
    image: File;
    resData: any;

    files: any = [];


    placeHolderImages = [
        '/assets/images/organization-placeholders/building2.png',
        '/assets/images/organization-placeholders/building3.png',
        '/assets/images/organization-placeholders/building4.png',
        '/assets/images/organization-placeholders/building5.png',
        '/assets/images/organization-placeholders/building6.png',
        '/assets/images/organization-placeholders/building7.png'
    ];

    public showSaveWarning: boolean = false;
    Id: number;
    private _unsubscribeAll: Subject<any>;
    isLoading: boolean;

    constructor(
        private organizationService: OrganizationService,
        private _formBuilder: FormBuilder,
        private http: HttpClient,
        private route: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseAlertService: FuseAlertService
    ) {

        // Set the default
        this.organization = new Organization();
        this._unsubscribeAll = new Subject();
    }


    /**
     * On init
     */
    ngOnInit(): void {
        this.isLoading = true;
        this.GetById();
        this.frmOrgInfo = this.createOrganizationForm();
        this.frmFileUploader = new FormGroup({
            uploader: new FormControl()
        });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }
    private showAlert(name: string): void {
        this._fuseAlertService.show(name);
    }

    private dismissAlert(name: string): void {
        this._fuseAlertService.dismiss(name);
    }

    private setControlsValues() {
        this.frmOrgInfo.controls["organizationName"].setValue(this.organization.organizationName);
        this.frmOrgInfo.controls["organizationCode"].setValue(this.organization.organizationCode);
        this.frmOrgInfo.controls["organizationDescription"].setValue(this.organization.organizationDescription);
        this.frmOrgInfo.controls["status"].setValue(this.organization.status);
        this.frmOrgInfo.controls["isBeneficiary"].setValue(this.organization.isBeneficiary);
        this.organization.organizationId = this.Id;
    }

    private getControlsValues() {
        this.organization.organizationName = this.frmOrgInfo.controls["organizationName"].value;
        this.organization.organizationCode = this.frmOrgInfo.controls["organizationCode"].value;
        this.organization.organizationDescription = this.frmOrgInfo.controls["organizationDescription"].value;
        this.organization.status = this.frmOrgInfo.controls["status"].value;
        this.organization.isBeneficiary = this.frmOrgInfo.controls["isBeneficiary"].value;

    }
    private GetById() {

        this.Id = Number(this.route.snapshot.paramMap.get('id'));

        if (this.Id > 0) {
            this.pageType = 'edit';
            this.organizationService.getOrganizationById(this.Id.toString()).subscribe(res => {
                this.organization = res.data;
                this.isLoading = false;
                this.setControlsValues();
            });

        } else {
            this.pageType = 'new';
        }



    }


    /**
     * Create product form
     *
     * @returns {FormGroup}
     */
    createOrganizationForm(): FormGroup {
        return this._formBuilder.group({
            organizationName: [this.organization.organizationName],
            organizationCode: [this.organization.organizationCode],
            organizationDescription: [this.organization.organizationDescription],  //checkpouya
            status: [this.organization.status],
            isBeneficiary: [this.organization.isBeneficiary],
            //logo: [this.organization.logo],
        });
    }

    /**
     * Save product
     */
    saveProduct(): void {

    }


    Save() {
        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');

        this.getControlsValues();
        if (!this.frmOrgInfo.valid) {
            this.frmOrgInfo.markAllAsTouched();
            this._result.succeed = false;
            this._result.message = "Please save the organization to continue.";
            this.showAlert('errorMessage');
            return;
        }
        this.isLoading = true;

        if (this.pageType == 'edit') {
            this.Edit();
            return;
        }

        this.organizationService.create(this.organization)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((organization: any) => {
                this._result.succeed = organization.succeed;
                this._result.message = organization.data;
                if (this._result.succeed)
                    this.showAlert('successMessage');
                else
                    this.showAlert('errorMessage');

                this._changeDetectorRef.markForCheck();
                this.isLoading = false;
            });

    }


    Edit() {

        this.isLoading = true;
        this.organizationService.edit(this.organization)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((organization: any) => {
                this._result.succeed = organization.succeed;
                this._result.message = organization.message;
                if (this._result.succeed)
                    this.showAlert('successMessage');
                else
                    this.showAlert('errorMessage');
                this._changeDetectorRef.markForCheck();
                this.isLoading = false;
            });

    }

    gotoupload() {
        this._result.message = "";
        if (!this.frmOrgInfo.valid) {
            this.frmOrgInfo.markAllAsTouched();
            this._result.succeed = false;
            this._result.message = "Please save the organization to continue.";
            return;
        }


        this.isLoading = false;

    }




    sendFile(orgId: string) {
        const file = new FormData();
        file.append('orgId', orgId);
        file.append('file', this.selectedFile);

        /*   this.api.uploadLogo(file).subscribe((data: any) => {
              this.resData = data;
  
          }); */


    }

    uploadFile(event) {
        for (let index = 0; index < event.length; index++) {
            const element = event[index];
            this.files.push(element.name)
        }

        this.selectedFile = event[0];
    }

    deleteAttachment(index) {
        this.files.splice(index, 1)
    }



}


