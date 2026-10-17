import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { TranslocoService } from "@ngneat/transloco";
import { ActivatedRoute, Router } from "@angular/router";
import { Location } from "@angular/common";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { Vendor, VendorBankAccount, VendorType } from "../vendor.types";
import { VendorService } from "../vendor.service";
import { BankAccount, Currency } from "../../shared/bank-account/bank-account.types";
import { BankAccountService } from "../../shared/bank-account/bank-account.service";
import { VatLookupService } from "app/modules/financial/shared/lookup/vat-lookup.service";
import { VatGroupOption } from "app/modules/financial/shared/master-data.types";
import { PaymentTypeLookupService, PaymentTypeOption } from "app/modules/financial/shared/lookup/payment-type-lookup.service";

/** erp-be's VendorRequest.PHONE_PATTERN: optional +, then digits, spaces and ( ) / - */
const PHONE_PATTERN = "^\\+?[0-9 ()/-]*$";

@Component({
  selector: "app-vendor-details",
  templateUrl: "./details.component.html",
})
export class VendorsDetailsComponent implements OnInit {
  pageType: string;
  titleInfo: string;
  isLoading = false;
  vendorInfo = new Vendor();
  formVendor: FormGroup;
  vendorTypes: VendorType[] = [];
  currencies: Currency[] = [];
  vatGroups: VatGroupOption[] = [];
  paymentTypes: PaymentTypeOption[] = [];

  // Bank accounts for this vendor, in the shared <app-bank-account> component's shape
  bankAccounts: BankAccount[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private formBuilder: FormBuilder,
    private vendorService: VendorService,
    private bankAccountService: BankAccountService,
    private vatLookupService: VatLookupService,
    private paymentTypeLookupService: PaymentTypeLookupService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private translocoService: TranslocoService
  ) { }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get("id"));
    this.formVendor = this.createFormObj();
    this.getVendorTypes();
    this.getCurrencies();
    this.getVatGroups();
    this.getPaymentTypes();
    if (id > 0) {
      this.pageType = "edit";
      this.getById(id);
    } else {
      this.titleInfo = "Register New Vendor";
      this.pageType = "new";
      this.bankAccounts = [];
    }
  }

  private getById(id: number): void {
    this.isLoading = true;
    this.vendorService.getVendor(id).subscribe({
      next: (vendor) => {
        this.vendorInfo = vendor;
        this.titleInfo = vendor.vendorName;
        this.bankAccounts = (vendor.bankAccounts || []).map((a) => this.toBankAccount(a));
        this.isLoading = false;
        this.setFormValues();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.notifyResult(false, VendorService.errorDetail(err), "", "configuration.vendor.loadError");
        this.cdr.detectChanges();
      },
    });
  }

  private createFormObj(): FormGroup {
    return this.formBuilder.group({
      vendorCode: ["", [Validators.maxLength(50)]],
      vendorName: ["", [Validators.required, Validators.maxLength(255)]],
      vendorType: [null, [Validators.required]],
      vendorStatus: [1000001, [Validators.required]],
      vendorPhone: ["", [Validators.pattern(PHONE_PATTERN), Validators.maxLength(30)]],
      vendorEmail: ["", [Validators.email]],
      vendorAddress: ["", [Validators.maxLength(500)]],
      currencyId: [null],
      vatGroupId: [null],
      paymentTypeId: [null],
      dueDate: [null, [Validators.min(0)]]
    });
  }

  private setFormValues(): void {
    this.formVendor.patchValue({
      vendorCode: this.vendorInfo.vendorCode,
      vendorName: this.vendorInfo.vendorName,
      vendorType: this.vendorInfo.vendorTypeId,
      vendorStatus: this.vendorInfo.status,
      vendorPhone: this.vendorInfo.phone,
      vendorEmail: this.vendorInfo.email,
      vendorAddress: this.vendorInfo.address,
      currencyId: this.vendorInfo.currencyId,
      vatGroupId: this.vendorInfo.vatGroupId,
      paymentTypeId: this.vendorInfo.paymentTypeId,
      dueDate: this.vendorInfo.dueDate,
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
    this.vendorService.create(this.vendorInfo).subscribe({
      next: (created) => {
        this.isLoading = false;
        this.notifyResult(true, null, "configuration.vendor.registerSuccess", "");
        // Now an existing vendor: a second click must edit it, not create a duplicate.
        this.vendorInfo = created;
        this.pageType = "edit";
        this.titleInfo = created.vendorName;
        this.bankAccounts = (created.bankAccounts || []).map((a) => this.toBankAccount(a));
        const urlTree = this.router.createUrlTree(["../", created.vendorId], { relativeTo: this.route });
        this.location.replaceState(this.router.serializeUrl(urlTree));
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.notifyResult(false, VendorService.errorDetail(err), "", "configuration.vendor.registerError");
        this.cdr.detectChanges();
      },
    });
  }

  private edit() {
    this.isLoading = true;
    this.vendorService.edit(this.vendorInfo).subscribe({
      next: (updated) => {
        this.isLoading = false;
        this.vendorInfo = updated;
        this.bankAccounts = (updated.bankAccounts || []).map((a) => this.toBankAccount(a));
        this.notifyResult(true, null, "configuration.vendor.updateSuccess", "");
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.notifyResult(false, VendorService.errorDetail(err), "", "configuration.vendor.updateError");
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Show a translated success/error snackbar for the register/update result.
   * An error shows the backend's own message (RFC 7807 detail) when there is one.
   */
  private notifyResult(succeed: boolean, backendMessage: string, successKey: string, errorKey: string): void {
    const message = backendMessage || this.translocoService.translate(succeed ? successKey : errorKey);
    this.snackBar.open(message, this.translocoService.translate("common.close"), {
      duration: succeed ? 3000 : 5000,
      panelClass: succeed ? "snackbar-success" : "snackbar-error",
    });
  }

  private getFormInfo(): void {
    const value = this.formVendor.value;
    this.vendorInfo.vendorCode = (value.vendorCode || "").trim();
    this.vendorInfo.vendorName = (value.vendorName || "").trim();
    this.vendorInfo.vendorTypeId = value.vendorType;
    this.vendorInfo.status = value.vendorStatus;
    this.vendorInfo.phone = (value.vendorPhone || "").trim();
    this.vendorInfo.email = (value.vendorEmail || "").trim();
    this.vendorInfo.address = (value.vendorAddress || "").trim();
    this.vendorInfo.currencyId = value.currencyId;
    const currency = this.currencies.find(c => c.currencyId === value.currencyId);
    this.vendorInfo.currencyName = currency?.currencyName || "";
    this.vendorInfo.currencyAbbreviation = currency?.currencyAbbreviation || "";
    this.vendorInfo.vatGroupId = value.vatGroupId;
    this.vendorInfo.vatGroupName = this.vatGroups.find(g => g.id === value.vatGroupId)?.name || "";
    this.vendorInfo.paymentTypeId = value.paymentTypeId;
    this.vendorInfo.paymentTypeName = this.paymentTypes.find(p => p.paymentTypeId === value.paymentTypeId)?.paymentTypeName || "";
    this.vendorInfo.dueDate = value.dueDate;
    this.vendorInfo.bankAccounts = this.bankAccounts.map((a) => this.toVendorBankAccount(a));
  }

  /** The API calls a bank account's status `status`; the shared bank account component calls it `statusId`. */
  private toBankAccount(account: VendorBankAccount): BankAccount {
    const { status, ...rest } = account;
    return { ...rest, statusId: status };
  }

  private toVendorBankAccount(account: BankAccount): VendorBankAccount {
    const { statusId, ...rest } = account;
    return { ...rest, status: statusId };
  }

  /**
   * Handle bank accounts change from child component
   */
  onBankAccountsChange(accounts: BankAccount[]): void {
    this.bankAccounts = accounts;
  }

  public myError(controlName: string, errorName: string) {
    return this.formVendor.controls[controlName].hasError(errorName);
  }

  private getVendorTypes(): void {
    this.vendorService.getTypes().subscribe((types) => {
      this.vendorTypes = types || [];
      this.cdr.detectChanges();
    });
  }

  private getCurrencies(): void {
    this.bankAccountService.getCurrencies().subscribe((res) => {
      this.currencies = res.data || [];
      this.cdr.detectChanges();
    });
  }

  private getVatGroups(): void {
    this.vatLookupService.getVatPostingGroups().subscribe((groups) => {
      this.vatGroups = groups;
      this.cdr.detectChanges();
    });
  }

  private getPaymentTypes(): void {
    this.paymentTypeLookupService.getPaymentTypes().subscribe((types) => {
      this.paymentTypes = types;
      this.cdr.detectChanges();
    });
  }
}
