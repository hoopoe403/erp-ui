import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { FuseAlertService } from "@fuse/components/alert";
import { OpResult } from "app/core/type/result/result.types";
import { ActivatedRoute } from "@angular/router";
import { Location } from "@angular/common";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { Contractor } from "../contractor.type";
import { forkJoin, Observable } from "rxjs";
import { ContractorService } from "../contractor.service";

@Component({
  selector: "app-details",
  templateUrl: "./details.component.html",
})
export class ContractorsDetailsComponent implements OnInit {
  pageType: string;
  titleInfo: string;
  isLoading = false;
  contractorInfo = new Contractor();
  formContractor: FormGroup;
  result = new OpResult();
  contractorTypes = [];
  settlementTypes = [];

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private formBuilder: FormBuilder,
    private contractorService: ContractorService,
    private cdr: ChangeDetectorRef,
    private fuseAlertService: FuseAlertService
  ) { }

  ngOnInit(): void {


    const id = Number(this.route.snapshot.paramMap.get("id"));
    this.getContractorTypes();
    this.getSettlementTypes();
    if (id > 0) {
      this.pageType = "edit";
      this.formContractor = this.createFormObj();
      this.getById(id);
    } else {
      this.settlementTypes
      this.titleInfo = "Register New Contractor";
      this.pageType = "new";
      this.formContractor = this.createFormObj();
    }
  }

  private showAlert(name: string): void {
    this.fuseAlertService.show(name);
  }

  private dismissAlert(name: string): void {
    this.fuseAlertService.dismiss(name);
  }

  // private loadData(): void {}

  private getById(id: number): void {
    this.isLoading = true;
    forkJoin(this.getContractor(id)).subscribe((res) => {
      this.setForkJoinValuesInEditMode(res);
      this.isLoading = false;
      this.setFormValues();
      this.cdr.detectChanges();
      console.log(this.contractorInfo);
    });
  }

  private setForkJoinValuesInEditMode(values: any[]) {
    this.contractorInfo = values[0].data;
    this.titleInfo = this.contractorInfo.contractorName;
  }

  private getContractor(id: number): Observable<any> {
    return this.contractorService.getContractor(id);
  }

  private createFormObj(): FormGroup {
    return this.formBuilder.group({
      contractorCode: { value: "", disabled: true },
      contractorName: ["", [Validators.required]],
      contractorType: [null, [Validators.required]],
      contractorStatus: [null, [Validators.required]],
      contractorPhone: [
        "",
        [Validators.pattern("^((\\+[0-9][0-9]-?)|0)?[0-9]{10}$")],
      ],
      contractorEmail: ["", [Validators.email]],
      contractorAddress: ["", [Validators.required]],
      organization: [{ value: '', disabled: this.pageType == 'edit' ? true : false }, [Validators.required]],
      settlementType: [null, [Validators.required]]
    });
  }

  private setFormValues(): void {
    this.formContractor.patchValue({
      contractorCode: this.contractorInfo.contractorCode,
      contractorName: this.contractorInfo.contractorName,
      contractorType: this.contractorInfo.contractorTypeId,
      contractorStatus: this.contractorInfo.status,
      contractorPhone: this.contractorInfo.phone,
      contractorEmail: this.contractorInfo.email,
      contractorAddress: this.contractorInfo.address,
      organization: this.contractorInfo.organizationId,
      settlementType: this.contractorInfo.settlementTypeId,
    });
  }

  save(): void {
    this.getFormInfo();
    if (this.pageType === "new") {
      this.create();
    } else if (this.pageType === "edit") {
      this.edit();
    }
  }

  private create() {
    console.log(this.contractorInfo);
    this.dismissAlert("successMessage");
    this.dismissAlert("errorMessage");
    this.contractorService.create(this.contractorInfo).subscribe((res) => {
      this.isLoading = false;
      this.result.succeed = res.succeed;
      this.result.message = res.message;
      if (this.result.succeed) {
        this.showAlert("successMessage");
      } else this.showAlert("errorMessage");
      this.cdr.detectChanges();
    });
  }

  private edit() {
    console.log(this.contractorInfo);
    this.contractorService.edit(this.contractorInfo).subscribe((res) => {
      this.isLoading = false;
      this.result.succeed = res.succeed;
      this.result.message = res.message;
      if (this.result.succeed) {
        this.showAlert("successMessage");
        // this.location.back();
      } else this.showAlert("errorMessage");
      this.cdr.detectChanges();
    });
  }

  private getFormInfo(): void {
    this.contractorInfo.contractorCode =
      this.formContractor.controls["contractorCode"].value;
    this.contractorInfo.contractorName =
      this.formContractor.controls["contractorName"].value.trim();
    this.contractorInfo.contractorTypeId =
      this.formContractor.controls["contractorType"].value;
    this.contractorInfo.status =
      this.formContractor.controls["contractorStatus"].value;
    this.contractorInfo.phone =
      this.formContractor.controls["contractorPhone"].value?.trim();
    this.contractorInfo.email =
      this.formContractor.controls["contractorEmail"].value?.trim();
    this.contractorInfo.address =
      this.formContractor.controls["contractorAddress"].value.trim();
    this.contractorInfo.organizationId =
      this.formContractor.controls["organization"].value;
    this.contractorInfo.settlementTypeId =
      this.formContractor.controls['settlementType'].value;
  }

  public myError(controlName: string, errorName: string) {
    return this.formContractor.controls[controlName].hasError(errorName);
  }
  private getContractorTypes(): void {
    this.contractorService.getContractorTypes().subscribe((res) => {
      this.contractorTypes = res.data
      this.isLoading = false;
      this.setFormValues();
      this.cdr.detectChanges();
    });
  }

  private getSettlementTypes(): void {
    this.contractorService.getSettlementType().subscribe((res) => {
      this.settlementTypes = res.data
      this.isLoading = false;
      this.setFormValues();
      this.cdr.detectChanges();
    });
  }
}
