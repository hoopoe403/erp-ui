import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { TranslocoService } from "@ngneat/transloco";
import { ActivatedRoute } from "@angular/router";
import { Location } from "@angular/common";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { Contractor } from "../contractor.type";
import { forkJoin, Observable } from "rxjs";
import { ContractorService } from "../contractor.service";
import { BankAccount } from "../../shared/bank-account/bank-account.types";

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
  contractorTypes = [];
  settlementTypes = [];

  // Bank accounts for this contractor
  bankAccounts: BankAccount[] = [];

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private formBuilder: FormBuilder,
    private contractorService: ContractorService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private translocoService: TranslocoService
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
      this.bankAccounts = []; // Initialize empty for new contractor
    }
  }

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
    // Load bank accounts from contractor data
    this.bankAccounts = this.contractorInfo.bankAccounts || [];
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
    this.isLoading = true;
    this.contractorService.create(this.contractorInfo).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.notifyResult(res.succeed, res.message, "configuration.contractor.registerSuccess", "configuration.contractor.registerError");
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.notifyResult(false, null, "configuration.contractor.registerSuccess", "configuration.contractor.registerError");
        this.cdr.detectChanges();
      },
    });
  }

  private edit() {
    this.isLoading = true;
    this.contractorService.edit(this.contractorInfo).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.notifyResult(res.succeed, res.message, "configuration.contractor.updateSuccess", "configuration.contractor.updateError");
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.notifyResult(false, null, "configuration.contractor.updateSuccess", "configuration.contractor.updateError");
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Show a translated success/error snackbar for the register/update result.
   * Falls back to a generic translated message when the backend doesn't provide one.
   */
  private notifyResult(succeed: boolean, backendMessage: string, successKey: string, errorKey: string): void {
    const message = backendMessage || this.translocoService.translate(succeed ? successKey : errorKey);
    this.snackBar.open(message, this.translocoService.translate("common.close"), {
      duration: succeed ? 3000 : 5000,
      panelClass: succeed ? "snackbar-success" : "snackbar-error",
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
    // Include bank accounts in the contractor info
    this.contractorInfo.bankAccounts = this.bankAccounts;
  }

  /**
   * Handle bank accounts change from child component
   */
  onBankAccountsChange(accounts: BankAccount[]): void {
    this.bankAccounts = accounts;
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
