import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { fuseAnimations } from "../../../../../../@fuse/animations";
import { FormArray, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { animate, state, style, transition, trigger } from "@angular/animations";
import { PurchaseInvoiceService } from "../purchase-invoice.service";
import { FuseAlertService } from '@fuse/components/alert';
import { Observable, Subject, of } from 'rxjs';
import { catchError, map, take, takeUntil, tap } from 'rxjs/operators';
import { PurchaseInvoice, PurchaseInvoiceDetail } from '../purchase-invoice.types';
import { OpResult } from 'app/core/type/result/result.types';
import { ActivatedRoute, Router } from '@angular/router';
import { Owner } from 'app/modules/configuration/owner/owner.types';
import { ContractorService } from 'app/modules/configuration/contractor/contractor.service';
import { BankAccountService } from 'app/modules/configuration/shared/bank-account/bank-account.service';
import { Currency } from 'app/modules/configuration/shared/bank-account/bank-account.types';
import { formatDate, Location } from '@angular/common';
import { FuseDataEntryDialogService } from '@fuse/services/data-entry-dialog/data-entry-dialog.service';
import { FuseDataEntryDialogFormControls } from '@fuse/services/data-entry-dialog/data-entry-dialog.types';
import { VendorLookupService } from '../../../shared/lookup/vendor-lookup.service';
import { GlAccountLookupService } from '../../../shared/lookup/gl-account-lookup.service';
import { FixedAssetLookupService } from '../../../shared/lookup/fixed-asset-lookup.service';
import { CostCenterLookupService } from '../../../shared/lookup/cost-center-lookup.service';
import { VatLookupService } from '../../../shared/lookup/vat-lookup.service';
import { ReviewedByLookupService, ReviewerOption } from '../../../shared/lookup/reviewed-by-lookup.service';
import { UnitLookupService, UnitOption } from '../../../shared/lookup/unit-lookup.service';
import { PaymentTypeLookupService, PaymentTypeOption } from '../../../shared/lookup/payment-type-lookup.service';
import { MockCostCenter, MockFixedAsset, MockGlAccount, MockVatGroup } from '../../../shared/mock-data';
import {
    DEFAULT_CURRENCY_ABBREVIATION, DEFAULT_CURRENCY_NAME,
    PURCHASE_INVOICE_STATUS_DRAFT, PURCHASE_INVOICE_STATUS_PENDING_REVIEW, PURCHASE_INVOICE_STATUS_POSTED
} from '../../../shared/financial-constants';
import { LookupOption } from '../../../shared/lookup-option.type';

/** Shown in the success alert - the same text erp-be's envelope used to send. */
const SAVE_SUCCEEDED_MESSAGE = 'Execute Operation Successfully';

@Component({
    selector: 'purchase-invoice-details',
    templateUrl: './details.component.html',
    styleUrls: ['./details.component.scss'],
    animations: [fuseAnimations, trigger('detailExpand', [
        state('collapsed', style({ height: '0px', minHeight: '0' })),
        state('expanded', style({ height: '*' })),
        transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
    ],
    encapsulation: ViewEncapsulation.None
})
export class PurchaseInvoiceDetailsComponent implements OnInit, OnDestroy {
    pageType: string;
    id: number = 0;
    invoiceInfo: PurchaseInvoice = new PurchaseInvoice();
    _result: OpResult = new OpResult();
    titleInfo: string;
    private _unsubscribeAll: Subject<any>;
    isLoading: boolean = false;
    actionDisable: boolean = false;
    /** Set once Send for Review's row-level validation has been attempted -
     *  turns on red highlighting in the line-items table (see sendForReview()
     *  / LineItemsTableComponent.showRequiredHighlight). */
    reviewValidationAttempted: boolean = false;
    frmInvoice: FormGroup;
    vendors: Owner[] = [];
    glAccounts: MockGlAccount[] = [];
    fixedAssets: MockFixedAsset[] = [];
    glAccountOptions: LookupOption[] = [];
    fixedAssetOptions: LookupOption[] = [];
    costCenters: MockCostCenter[] = [];
    vatPostingGroups: MockVatGroup[] = [];
    vatProductPostingGroups: MockVatGroup[] = [];
    reviewers: ReviewerOption[] = [];
    units: UnitOption[] = [];
    unitOptions: LookupOption[] = [];
    paymentTypes: PaymentTypeOption[] = [];
    currencies: Currency[] = [];

    readonly STATUS_DRAFT = PURCHASE_INVOICE_STATUS_DRAFT;
    readonly STATUS_PENDING_REVIEW = PURCHASE_INVOICE_STATUS_PENDING_REVIEW;
    readonly STATUS_POSTED = PURCHASE_INVOICE_STATUS_POSTED;

    /** Draft (0) / Pending Review (1) / Posted (2) - drives which action buttons
     *  are enabled. A brand-new, not-yet-saved invoice reads as stage 0 too -
     *  that's what it becomes on first save. */
    get statusStageIndex(): number {
        if (this.invoiceInfo.status === this.STATUS_POSTED) {
            return 2;
        }
        if (this.invoiceInfo.status === this.STATUS_PENDING_REVIEW) {
            return 1;
        }
        return 0;
    }

    private _selectedVendorVatGroupId: number | null = null;

    constructor(
        private service: PurchaseInvoiceService,
        private _formBuilder: FormBuilder,
        private cdr: ChangeDetectorRef,
        private route: ActivatedRoute,
        private _router: Router,
        private _location: Location,
        private _fuseAlertService: FuseAlertService,
        private _fuseDataEntryDialogService: FuseDataEntryDialogService,
        private _vendorLookupService: VendorLookupService,
        private _contractorService: ContractorService,
        private _glAccountLookupService: GlAccountLookupService,
        private _fixedAssetLookupService: FixedAssetLookupService,
        private _costCenterLookupService: CostCenterLookupService,
        private _vatLookupService: VatLookupService,
        private _reviewedByLookupService: ReviewedByLookupService,
        private _unitLookupService: UnitLookupService,
        private _paymentTypeLookupService: PaymentTypeLookupService,
        private _bankAccountService: BankAccountService
    ) {
        this._unsubscribeAll = new Subject();
        this.invoiceInfo.purchaseInvoiceDetailList = [];
    }

    get lines(): FormArray {
        return this.frmInvoice.get('lines') as FormArray;
    }

    /**
     * On init
     */
    ngOnInit(): void {
        this.frmInvoice = this.createFormObject();
        this.isLoading = true;
        this.id = Number(this.route.snapshot.paramMap.get('id'));
        this.loadLookups();
        if (this.id > 0) {
            this.pageType = 'edit';
            this.getById(this.id);
        }
        else {
            this.invoiceInfo.total = 0;
            this.invoiceInfo.subTotal = 0;
            this.invoiceInfo.discount = 0;
            this.invoiceInfo.totalNetAmount = 0;
            this.invoiceInfo.totalVatAmount = 0;
            this.invoiceInfo.totalGrossAmount = 0;
            this.invoiceInfo.currencyAbbreviation = DEFAULT_CURRENCY_ABBREVIATION;
            this.invoiceInfo.currencyName = DEFAULT_CURRENCY_NAME;
            this.titleInfo = 'Register New Purchase Invoice';
            this.pageType = 'new';
            this.isLoading = false;
            this.frmInvoice.controls['currencyId'].setValue(this.invoiceInfo.currencyId);
            this.frmInvoice.controls['jdatepicker'].setValue(new Date());
            // Added immediately, not gated on any lookup finishing — the line-items
            // table only knows how to auto-add a *replacement* row once the last one
            // gets data (see LineItemsTableComponent._checkAutoAddRow), so if the form
            // ever starts with zero rows there's no way to add one at all. The VAT
            // product default (below) is backfilled once it's actually loaded instead.
            this.addNewItem();
        }
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    private loadLookups(): void {
        this._vendorLookupService.getVendors().subscribe((v) => {
            this.vendors = v;
            this.cdr.detectChanges();
        });
        this._glAccountLookupService.getGlAccounts().subscribe((v) => {
            this.glAccounts = v;
            this.glAccountOptions = v.map((a) => ({ id: a.financialCategoryId, code: a.financialCategoryCode, name: a.financialCategoryName }));
            this.cdr.detectChanges();
        });
        this._fixedAssetLookupService.getFixedAssets().subscribe((v) => {
            this.fixedAssets = v;
            this.fixedAssetOptions = v.map((a) => ({ id: a.fixedAssetId, code: a.assetCode, name: a.assetName }));
            this.cdr.detectChanges();
        });
        this._costCenterLookupService.getCostCenters().subscribe((v) => {
            this.costCenters = v;
            this.cdr.detectChanges();
        });
        this._vatLookupService.getVatPostingGroups().subscribe((v) => {
            this.vatPostingGroups = v;
            this.cdr.detectChanges();
        });
        this._vatLookupService.getVatProductPostingGroups().subscribe((v) => {
            this.vatProductPostingGroups = v;
            // Lines added before this lookup finished loading (e.g. the initial blank
            // row on a brand-new invoice) couldn't get a default VAT product group yet
            // — backfill it now, but only onto lines still untouched by the user.
            const defaultId = this._vatLookupService.getDefaultVatProductPostingGroupId();
            if (defaultId != null) {
                this.lines.controls.forEach((group: FormGroup, index) => {
                    const line = this.invoiceInfo.purchaseInvoiceDetailList[index];
                    if (line && !line.vatProductPostingGroupId && this._isLineBlank(line)) {
                        line.vatProductPostingGroupId = defaultId;
                        group.controls['vatProductPostingGroupId'].setValue(defaultId);
                    }
                });
            }
            this.cdr.detectChanges();
        });
        this._reviewedByLookupService.getReviewers().subscribe((v) => {
            this.reviewers = v;
            this.cdr.detectChanges();
        });
        this._unitLookupService.getUnits().subscribe((v) => {
            this.units = v;
            this.unitOptions = v.map((u) => ({ id: u.unitId, code: u.unitCode, name: u.unitName }));
            this.cdr.detectChanges();
        });
        this._paymentTypeLookupService.getPaymentTypes().subscribe((v) => {
            this.paymentTypes = v;
            this.cdr.detectChanges();
        });
        this._bankAccountService.getCurrencies().subscribe((res: any) => {
            this.currencies = (res && res.data ? res.data : []) as Currency[];
            this.cdr.detectChanges();
        });
    }

    private getById(id: number) {
        this.isLoading = true;
        this.service.getPurchaseInvoice(id).subscribe({
            next: (invoice) => {
                this.invoiceInfo = invoice;
                if (!this.invoiceInfo.purchaseInvoiceDetailList) {
                    this.invoiceInfo.purchaseInvoiceDetailList = [];
                }
                if (!this.invoiceInfo.currencyAbbreviation) {
                    this.invoiceInfo.currencyAbbreviation = DEFAULT_CURRENCY_ABBREVIATION;
                    this.invoiceInfo.currencyName = DEFAULT_CURRENCY_NAME;
                }
                this.titleInfo = this.invoiceInfo.creditorName || 'Purchase Invoice';
                this.setFormValues();
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            // e.g. a 404 for an invoice that doesn't exist (any more)
            error: (err) => this._onRequestError(err)
        });
    }

    private createFormObject(): FormGroup {
        return this._formBuilder.group({
            vendorId: [null, Validators.required],
            creditorCode: [{ value: '', disabled: true }],
            currencyId: [null],
            jdatepicker: '',
            vendorInvoiceNumber: '',
            dueDatepicker: '',
            reviewedByUserId: [null],
            paymentTypeId: [null],
            lines: this._formBuilder.array([]),
        });
    }

    private setFormValues() {
        this.frmInvoice.controls['vendorId'].setValue(this.invoiceInfo.creditorId);
        this.frmInvoice.controls['creditorCode'].setValue(this.invoiceInfo.creditorCode);
        this.frmInvoice.controls['vendorInvoiceNumber'].setValue(this.invoiceInfo.vendorInvoiceNumber);
        this.frmInvoice.controls['reviewedByUserId'].setValue(this.invoiceInfo.reviewedByUserId);
        this.frmInvoice.controls['paymentTypeId'].setValue(this.invoiceInfo.paymentTypeId);
        this.frmInvoice.controls['currencyId'].setValue(this.invoiceInfo.currencyId);
        this.frmInvoice.controls['jdatepicker'].setValue(this._parseDate(this.invoiceInfo.postingDate));
        this.frmInvoice.controls['dueDatepicker'].setValue(this._parseDate(this.invoiceInfo.dueDate));

        this.lines.clear();
        this.invoiceInfo.purchaseInvoiceDetailList.forEach((line) => {
            if (!line.lineType) {
                line.lineType = 'GL';
            }
            if (line.netAmount === undefined || line.netAmount === null) {
                line.netAmount = (line.unitPrice ?? 0) * (line.quantity ?? 0);
            }
            if (line.grossAmount === undefined || line.grossAmount === null) {
                line.grossAmount = line.netAmount;
            }
            this.lines.push(this.createLineGroup(line));
        });
        // Always keep one blank row ready at the end, Excel/Business-Central style.
        this.addNewItem();
        this.recomputeHeaderTotals();
    }

    /**
     * Best-effort parse for dates coming back from the backend. Existing records
     * created before the switch from the Persian/Jalali calendar to the template's
     * default (Gregorian) one may still hold a Jalali-formatted string (e.g.
     * "1402/05/12"), which isn't a valid JS Date input — falls back to null
     * (empty field) rather than showing an "Invalid Date" for those.
     */
    private _parseDate(value: string): Date | null {
        if (!value) {
            return null;
        }
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Vendor
    // -----------------------------------------------------------------------------------------------------

    onVendorSelected(owner: Owner | null): void {
        this.invoiceInfo.creditorId = owner ? owner.ownerId : null;
        this.invoiceInfo.creditorName = owner ? owner.ownerName : '';
        this.invoiceInfo.creditorCode = owner ? owner.ownerCode : '';
        this.frmInvoice.controls['creditorCode'].setValue(this.invoiceInfo.creditorCode);

        // Reset to defaults; overwritten by the enrichment call below if it succeeds.
        // Still just a default, not a lock — the user can pick any currency from
        // the dropdown regardless of what the vendor defaults to.
        const defaultCurrency = this.currencies.find((c) => c.currencyAbbreviation === DEFAULT_CURRENCY_ABBREVIATION);
        this.invoiceInfo.currencyId = defaultCurrency ? defaultCurrency.currencyId : null;
        this.invoiceInfo.currencyName = DEFAULT_CURRENCY_NAME;
        this.invoiceInfo.currencyAbbreviation = DEFAULT_CURRENCY_ABBREVIATION;
        this._selectedVendorVatGroupId = null;
        this.invoiceInfo.paymentTypeId = null;
        this.invoiceInfo.paymentTypeName = null;
        this.frmInvoice.controls['paymentTypeId'].setValue(null);
        this.frmInvoice.controls['currencyId'].setValue(this.invoiceInfo.currencyId);

        if (!owner) {
            return;
        }

        this.checkAutoCreateDraft();

        // ASSUMPTION (unverified — could not confirm via a real login): Owner.ownerId
        // for a Contractor-type owner equals Contractor.contractorId. The lightweight
        // owners list (obj/owners/1000613) has no currency/VAT group, so a second call
        // fetches the full record. Fails gracefully if the id doesn't resolve.
        this._contractorService.getContractor(owner.ownerId).subscribe({
            next: (res: any) => {
                const contractor = res?.data;
                if (!contractor) {
                    return;
                }
                if (contractor.currencyId) {
                    this.invoiceInfo.currencyId = contractor.currencyId;
                    this.invoiceInfo.currencyName = contractor.currencyName || DEFAULT_CURRENCY_NAME;
                    this.invoiceInfo.currencyAbbreviation = contractor.currencyAbbreviation || DEFAULT_CURRENCY_ABBREVIATION;
                    this.frmInvoice.controls['currencyId'].setValue(contractor.currencyId);
                }
                if (contractor.vatGroupId) {
                    this._selectedVendorVatGroupId = contractor.vatGroupId;
                    this._applyVendorVatGroupToUnsetLines(contractor.vatGroupId);
                }
                if (contractor.paymentTypeId) {
                    this.invoiceInfo.paymentTypeId = contractor.paymentTypeId;
                    this.invoiceInfo.paymentTypeName = contractor.paymentTypeName || null;
                    this.frmInvoice.controls['paymentTypeId'].setValue(contractor.paymentTypeId);
                }
                if (contractor.paymentTermDays) {
                    this._applyDueDateFromPaymentTerm(contractor.paymentTermDays);
                }
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.warn('Vendor currency/VAT-group enrichment failed (owner id -> contractor id assumption?)', err);
            }
        });
    }

    openContractorRegisterTab(): void {
        const url = this._router.serializeUrl(this._router.createUrlTree(['/configuration/contractor/register']));
        window.open(url, '_blank');
    }

    /**
     * "+ Add new vendor" opens the real Contractor form in a separate tab, so this
     * tab's vendor list can go stale. Silently refresh it whenever the user comes
     * back to this tab/window, rather than making them find a manual refresh button.
     */
    @HostListener('window:focus')
    private refreshVendors(): void {
        this._vendorLookupService.getVendors().subscribe((v) => {
            this.vendors = v;
            this.cdr.detectChanges();
        });
    }

    /** Defaults from the selected vendor (see onVendorSelected()) but stays
     *  editable — this only fires when the user picks a different one by hand. */
    onCurrencySelected(currency: Currency | null): void {
        this.invoiceInfo.currencyId = currency ? currency.currencyId : null;
        this.invoiceInfo.currencyName = currency ? currency.currencyName : DEFAULT_CURRENCY_NAME;
        this.invoiceInfo.currencyAbbreviation = currency ? currency.currencyAbbreviation : DEFAULT_CURRENCY_ABBREVIATION;
        this.checkAutoCreateDraft();
    }

    private _applyVendorVatGroupToUnsetLines(vatGroupId: number): void {
        this.lines.controls.forEach((group: FormGroup) => {
            if (!group.controls['vatPostingGroupId'].value) {
                group.controls['vatPostingGroupId'].setValue(vatGroupId);
            }
        });
    }

    /** Due Date defaults to Posting Date + the vendor's Contractor.paymentTermDays
     *  (e.g. "Net 30") when a vendor is selected - a one-time default, same as
     *  currency/VAT group above, not a formula kept in sync afterwards. Stays
     *  fully editable. No-ops if Posting Date isn't set yet (shouldn't normally
     *  happen - see the "today by default" fill in ngOnInit). */
    private _applyDueDateFromPaymentTerm(days: number): void {
        const postingDate: Date | null = this.frmInvoice.controls['jdatepicker'].value;
        if (!postingDate) {
            return;
        }
        const dueDate = new Date(postingDate);
        dueDate.setDate(dueDate.getDate() + days);
        this.frmInvoice.controls['dueDatepicker'].setValue(dueDate);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Reviewed by
    // -----------------------------------------------------------------------------------------------------

    onReviewerSelected(reviewer: ReviewerOption | null): void {
        this.invoiceInfo.reviewedByUserId = reviewer ? reviewer.userId : null;
        this.invoiceInfo.reviewedByUserName = reviewer ? reviewer.name : null;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Payment type
    // -----------------------------------------------------------------------------------------------------

    /** Defaults from the selected vendor (see onVendorSelected()) but stays
     *  editable — this only fires when the user picks a different one by hand. */
    onPaymentTypeSelected(paymentType: PaymentTypeOption | null): void {
        this.invoiceInfo.paymentTypeId = paymentType ? paymentType.paymentTypeId : null;
        this.invoiceInfo.paymentTypeName = paymentType ? paymentType.paymentTypeName : null;
        this.checkAutoCreateDraft();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Line items
    // -----------------------------------------------------------------------------------------------------

    addNewItem(): void {
        const detail = new PurchaseInvoiceDetail();
        detail.purchaseInvoiceDetailId = -(this.invoiceInfo.purchaseInvoiceDetailList.length + 1);
        detail.rowNumber = this.invoiceInfo.purchaseInvoiceDetailList.length + 1;
        detail.lineType = 'GL';
        detail.quantity = 1;
        detail.unitId = null;
        detail.unitPrice = 0;
        detail.netAmount = 0;
        detail.grossAmount = 0;
        detail.itemDesc = '';
        detail.vatPostingGroupId = this._selectedVendorVatGroupId ?? null;
        detail.vatProductPostingGroupId = this._vatLookupService.getDefaultVatProductPostingGroupId();
        this.invoiceInfo.purchaseInvoiceDetailList.push(detail);
        this.lines.push(this.createLineGroup(detail));
    }

    removeItem(index: number): void {
        // The invoice always needs at least one line to submit — keep the last
        // remaining row in place rather than letting the table go empty.
        if (this.invoiceInfo.purchaseInvoiceDetailList.length <= 1) {
            return;
        }
        this.invoiceInfo.purchaseInvoiceDetailList.splice(index, 1);
        this.lines.removeAt(index);
        this.recomputeHeaderTotals();
    }

    openAddCostCenterDialog(searchText: string, lineIndex: number): void {
        const configForm = this.buildQuickAddDialog('Add New Cost Center', searchText);
        const dialogRef = this._fuseDataEntryDialogService.open(configForm.value);
        dialogRef.afterClosed().subscribe((result) => {
            if (result === 'cancelled' || !result) {
                return;
            }
            const code = result.filter((x) => x.index === 0)[0].value;
            const name = result.filter((x) => x.index === 1)[0].value;
            if (!name) {
                return;
            }
            this._costCenterLookupService.addQuickCostCenter(code, name).subscribe((costCenter) => {
                if (!costCenter) {
                    return;
                }
                this.costCenters = [...this.costCenters, costCenter];
                (this.lines.at(lineIndex) as FormGroup).controls['costCenterId'].setValue(costCenter.costCenterId);
                this.cdr.detectChanges();
            });
        });
    }

    openAddUnitDialog(searchText: string, lineIndex: number): void {
        const configForm = this.buildQuickAddDialog('Add New Unit', searchText);
        const dialogRef = this._fuseDataEntryDialogService.open(configForm.value);
        dialogRef.afterClosed().subscribe((result) => {
            if (result === 'cancelled' || !result) {
                return;
            }
            const code = result.filter((x) => x.index === 0)[0].value;
            const name = result.filter((x) => x.index === 1)[0].value;
            if (!name) {
                return;
            }
            this._unitLookupService.addQuickUnit(code, name).subscribe((unit) => {
                if (!unit) {
                    return;
                }
                this.units = [...this.units, unit];
                this.unitOptions = [...this.unitOptions, { id: unit.unitId, code: unit.unitCode, name: unit.unitName }];
                (this.lines.at(lineIndex) as FormGroup).controls['unitId'].setValue(unit.unitId);
                this.cdr.detectChanges();
            });
        });
    }

    private createLineGroup(line: PurchaseInvoiceDetail): FormGroup {
        const group = this._formBuilder.group({
            lineType: [line.lineType || 'GL'],
            accountId: [line.lineType === 'FA' ? line.fixedAssetId : line.accountId],
            costCenterId: [line.costCenterId],
            itemDesc: [line.itemDesc || ''],
            vatPostingGroupId: [line.vatPostingGroupId],
            vatProductPostingGroupId: [line.vatProductPostingGroupId],
            unitId: [line.unitId],
            quantity: [line.quantity ?? 1, [Validators.required, Validators.min(0.0001)]],
            unitPrice: [line.unitPrice ?? 0, [Validators.required, Validators.min(0)]],
            netAmount: [{ value: line.netAmount ?? 0, disabled: true }],
            grossAmount: [{ value: line.grossAmount ?? 0, disabled: true }],
        });
        group.valueChanges.pipe(takeUntil(this._unsubscribeAll)).subscribe((value) => this.onLineChanged(line, value));
        return group;
    }

    private onLineChanged(line: PurchaseInvoiceDetail, value: any): void {
        line.lineType = value.lineType;
        if (value.lineType === 'FA') {
            const fa = this.fixedAssets.find((a) => a.fixedAssetId === value.accountId);
            line.fixedAssetId = value.accountId;
            line.fixedAssetCode = fa ? fa.assetCode : '';
            line.fixedAssetName = fa ? fa.assetName : '';
            line.accountId = null;
            line.accountCode = '';
            line.accountName = '';
        } else {
            const acc = this.glAccounts.find((a) => a.financialCategoryId === value.accountId);
            line.accountId = value.accountId;
            line.accountCode = acc ? acc.financialCategoryCode : '';
            line.accountName = acc ? acc.financialCategoryName : '';
            line.fixedAssetId = null;
            line.fixedAssetCode = '';
            line.fixedAssetName = '';
        }
        const cc = this.costCenters.find((c) => c.costCenterId === value.costCenterId);
        line.costCenterId = value.costCenterId;
        line.costCenterCode = cc ? cc.costCenterCode : '';
        line.costCenterName = cc ? cc.costCenterName : '';
        line.itemDesc = value.itemDesc || '';
        line.vatPostingGroupId = value.vatPostingGroupId;
        line.vatProductPostingGroupId = value.vatProductPostingGroupId;

        const unit = this.units.find((u) => u.unitId === value.unitId);
        line.unitId = value.unitId ?? null;
        line.unitCode = unit ? unit.unitCode : '';
        line.unitName = unit ? unit.unitName : '';

        // unitPrice/quantity are the real, typed inputs now — netAmount/grossAmount
        // are always derived from them, never typed directly.
        const quantity = parseFloat(value.quantity) || 0;
        const unitPrice = parseFloat(value.unitPrice) || 0;
        const netAmount = unitPrice * quantity;
        const rate = this._vatLookupService.getRate(value.vatPostingGroupId, value.vatProductPostingGroupId);
        const grossAmount = netAmount + (netAmount * rate / 100);

        line.quantity = quantity;
        line.unitPrice = unitPrice;
        line.netAmount = netAmount;
        line.grossAmount = grossAmount;

        const group = this.lines.at(this.invoiceInfo.purchaseInvoiceDetailList.indexOf(line)) as FormGroup;
        if (group && group.controls['netAmount'].value !== netAmount) {
            group.controls['netAmount'].setValue(netAmount, { emitEvent: false });
        }
        if (group && group.controls['grossAmount'].value !== grossAmount) {
            group.controls['grossAmount'].setValue(grossAmount, { emitEvent: false });
        }
        this.recomputeHeaderTotals();
    }

    private recomputeHeaderTotals(): void {
        let sumNet = 0;
        let sumGross = 0;
        this.invoiceInfo.purchaseInvoiceDetailList.forEach((l) => {
            sumNet += l.netAmount || 0;
            sumGross += l.grossAmount || 0;
        });
        this.invoiceInfo.totalNetAmount = sumNet;
        this.invoiceInfo.totalVatAmount = sumGross - sumNet;
        this.invoiceInfo.totalGrossAmount = sumGross;
        // Keep the legacy aggregate fields (still on the backend model) in sync.
        // Discount removed from the purchase invoice for now (open question on
        // whether it should reduce the VAT base — see the purchase-invoice plan).
        this.invoiceInfo.subTotal = sumNet;
        this.invoiceInfo.discount = 0;
        this.invoiceInfo.total = this.invoiceInfo.subTotal;
        this.cdr.detectChanges();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Quick-add dialog (reuses the FuseDataEntryDialogService pattern from
    // financial/category/details/details.component.ts) — still used by Cost Center.
    // -----------------------------------------------------------------------------------------------------

    private buildQuickAddDialog(title: string, prefillName: string): FormGroup {
        const formControls: Array<FuseDataEntryDialogFormControls> = [
            { formControlName: 'code', index: 0, label: 'Code', placeHolder: 'Code', type: 'text', disabled: false, value: '' },
            { formControlName: 'name', index: 1, label: 'Name', placeHolder: 'Name', type: 'text', disabled: false, value: prefillName || '' },
        ];
        return this._formBuilder.group({
            title,
            message: 'Enter the code and name, then confirm to add it to the list.',
            formControls: this._formBuilder.group(formControls),
            icon: this._formBuilder.group({
                show: true,
                name: 'heroicons_outline:information-circle',
                color: 'info'
            }),
            actions: this._formBuilder.group({
                confirm: this._formBuilder.group({
                    show: true,
                    label: 'Add',
                    color: 'primary'
                }),
                cancel: this._formBuilder.group({
                    show: true,
                    label: 'Cancel'
                })
            }),
            dismissible: true
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Header fields
    // -----------------------------------------------------------------------------------------------------

    private showAlert(name: string): void {
        this._fuseAlertService.show(name);
    }

    private dismissAlert(name: string): void {
        this._fuseAlertService.dismiss(name);
    }


    /**
     * The line-items table always keeps one trailing blank row ready for the next
     * entry (see LineItemsTableComponent) — it's a placeholder, not a real line,
     * so it's excluded from "at least one item" / per-row validation and from the
     * saved payload (see toBackendPayload()).
     */
    private _isLineBlank(line: PurchaseInvoiceDetail): boolean {
        return !line.accountId && !line.fixedAssetId && !line.costCenterId
            && !(line.itemDesc && line.itemDesc.trim())
            && !((line.netAmount || 0) > 0);
    }

    private getFormInfo(): boolean {
        const nonBlankLines = this.invoiceInfo.purchaseInvoiceDetailList.filter((l) => !this._isLineBlank(l));
        if (nonBlankLines.length <= 0) {
            this._result.succeed = false;
            this._result.message = "At least one item in the invoice should be entered";
            this.showAlert('errorMessage');
            return false;
        }

        let linesValid = true;
        this.lines.controls.forEach((group: FormGroup, index) => {
            if (this._isLineBlank(this.invoiceInfo.purchaseInvoiceDetailList[index])) {
                return;
            }
            const quantity = parseFloat(group.controls['quantity'].value);
            const unitPrice = parseFloat(group.controls['unitPrice'].value);
            if (!group.controls['accountId'].value || Number.isNaN(quantity) || quantity <= 0
                || Number.isNaN(unitPrice) || unitPrice < 0) {
                linesValid = false;
            }
        });
        if (!linesValid) {
            this._result.succeed = false;
            this._result.message = "Each line needs an account or fixed asset, a quantity greater than zero, and a valid unit price";
            this.showAlert('errorMessage');
            return false;
        }

        if (!this.invoiceInfo.creditorId) {
            this._result.succeed = false;
            this._result.message = 'Please select a vendor';
            this.showAlert('errorMessage');
            return false;
        }

        const postingDate: Date | null = this.frmInvoice.controls['jdatepicker'].value;
        this.invoiceInfo.postingDate = postingDate ? formatDate(postingDate, 'yyyy/MM/dd', 'en-US') : '';

        if (!this.invoiceInfo.postingDate) {
            this._result.succeed = false;
            this._result.message = "Please enter the posting date";
            this.showAlert('errorMessage');
            return false;
        }

        const dueDate: Date | null = this.frmInvoice.controls['dueDatepicker'].value;
        this.invoiceInfo.dueDate = dueDate ? formatDate(dueDate, 'yyyy/MM/dd', 'en-US') : '';

        if (!this.invoiceInfo.dueDate) {
            this._result.succeed = false;
            this._result.message = "Please enter the due date";
            this.showAlert('errorMessage');
            return false;
        }

        this.invoiceInfo.vendorInvoiceNumber = this.frmInvoice.controls['vendorInvoiceNumber'].value;

        if (!this.invoiceInfo.vendorInvoiceNumber) {
            this._result.succeed = false;
            this._result.message = "Please enter the vendor invoice number";
            this.showAlert('errorMessage');
            return false;
        }

        return true;
    }

    /**
     * Stricter than getFormInfo()'s per-row check above - only used for Send
     * for Review, not for a plain Save/Draft. Every non-blank line needs
     * everything except Cost Center: account/asset, description, VAT group,
     * VAT product group, unit, a positive quantity, and a non-negative unit
     * price. Drives the line-items table's red cell highlighting too (see
     * reviewValidationAttempted / LineItemsTableComponent.isFieldMissing()).
     */
    private _hasValidLinesForReview(): boolean {
        let valid = true;
        this.lines.controls.forEach((group: FormGroup, index) => {
            if (this._isLineBlank(this.invoiceInfo.purchaseInvoiceDetailList[index])) {
                return;
            }
            const quantity = parseFloat(group.controls['quantity'].value);
            const unitPrice = parseFloat(group.controls['unitPrice'].value);
            if (!group.controls['accountId'].value
                || !group.controls['itemDesc'].value || !String(group.controls['itemDesc'].value).trim()
                || !group.controls['vatPostingGroupId'].value
                || !group.controls['vatProductPostingGroupId'].value
                || !group.controls['unitId'].value
                || Number.isNaN(quantity) || quantity <= 0
                || Number.isNaN(unitPrice) || unitPrice < 0) {
                valid = false;
            }
        });
        return valid;
    }

    /**
     * The whole invoice (header + lines) round-trips through the local-mock-data
     * store on the erp-be side (see PurchaseInvoiceRepositoryMock) — only
     * the trailing always-blank placeholder row is dropped before saving.
     */
    private toBackendPayload(): PurchaseInvoice {
        const header: any = { ...this.invoiceInfo };
        header.purchaseInvoiceDetailList = (this.invoiceInfo.purchaseInvoiceDetailList || [])
            .filter((line) => !this._isLineBlank(line));
        return header;
    }

    /**
     * Whichever it should be is decided by whether this invoice already has a
     * server-assigned id (see _applyCreatedId()) - not by pageType, which is
     * only set once from the route at load time and would otherwise cause a
     * second click on a still-'new' page to create a duplicate invoice.
     */
    save() {
        if (!this.getFormInfo()) {
            return;
        }
        if (this.invoiceInfo.purchaseInvoiceId)
            this.edit();
        else
            this.create();
    }

    /**
     * Requires a reviewer to be picked (in the "Reviewed By" field above),
     * at least one line item, and - stricter than a plain Save/Draft - every
     * non-blank line filled in except Cost Center (see
     * _hasValidLinesForReview()), then saves with status advanced to Pending
     * Review. There's no backend workflow yet to route the invoice to that
     * person or notify them, so this only records who's meant to review it
     * and marks the invoice as awaiting review.
     */
    sendForReview() {
        if (!this.invoiceInfo.reviewedByUserId) {
            this._result.succeed = false;
            this._result.message = 'Please select a reviewer first';
            this.showAlert('errorMessage');
            return;
        }
        const nonBlankLines = this.invoiceInfo.purchaseInvoiceDetailList.filter((l) => !this._isLineBlank(l));
        if (nonBlankLines.length <= 0) {
            this._result.succeed = false;
            this._result.message = 'At least one item in the invoice should be entered';
            this.showAlert('errorMessage');
            return;
        }
        this.reviewValidationAttempted = true;
        if (!this._hasValidLinesForReview()) {
            this._result.succeed = false;
            this._result.message = 'Each line (except Cost Center) needs an account or fixed asset, a description, VAT group, VAT product group, unit, a quantity greater than zero, and a valid unit price before sending for review';
            this.showAlert('errorMessage');
            this.cdr.detectChanges();
            return;
        }
        this.invoiceInfo.status = this.STATUS_PENDING_REVIEW;
        this.save();
    }

    create() {
        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');
        this.isLoading = true;
        this.actionDisable = true;
        this._createInvoice().subscribe({
            next: () => {
                this.isLoading = false;
                this._result.succeed = true;
                this._result.message = SAVE_SUCCEEDED_MESSAGE;
                this.frmInvoice.markAsPristine();
                this.showAlert('successMessage');
                this.cdr.detectChanges();
            },
            error: (err) => this._onRequestError(err)
        });
    }

    edit() {
        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');
        this.isLoading = true;
        this.actionDisable = true;
        this.service.edit(this.toBackendPayload()).subscribe({
            next: () => {
                this.isLoading = false;
                this.actionDisable = false;
                this._result.succeed = true;
                this._result.message = SAVE_SUCCEEDED_MESSAGE;
                this.frmInvoice.markAsPristine();
                this.showAlert('successMessage');
                this.cdr.detectChanges();
            },
            error: (err) => this._onRequestError(err)
        });
    }

    /**
     * Any failed request lands here instead of a `next` callback: erp-be answers
     * with real HTTP statuses - 400 for an invalid request, 404 for an invoice that
     * doesn't exist, 409 for a duplicate vendor invoice number, 5xx/no connection
     * otherwise. Without this the form stayed stuck on "loading" with its buttons
     * disabled. Shown through the same alert as the client-side validation messages.
     */
    private _onRequestError(error: any): void {
        this.isLoading = false;
        this.actionDisable = false;
        this._result.succeed = false;
        this._result.message = this._errorMessage(error);
        this.showAlert('errorMessage');
        this.cdr.detectChanges();
    }

    /**
     * erp-be reports every failure as an RFC 7807 problem - the readable text is
     * in `detail` (e.g. "Please select a vendor", "Purchase invoice not found").
     * Anything without one gets a generic message rather than a raw HTTP error.
     */
    private _errorMessage(error: any): string {
        const detail = error && error.error && error.error.detail;
        if (typeof detail === 'string' && detail) {
            return detail;
        }
        if (error && error.status === 0) {
            return 'Could not reach the server. Please check your connection and try again.';
        }
        return 'Something went wrong. Please try again.';
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Draft auto-create + save-on-leave
    // -----------------------------------------------------------------------------------------------------

    /**
     * Whether the minimum fields for a Draft to exist server-side are filled in
     * - much looser than getFormInfo()'s full validation (no line items
     * required), since this only exists to get the invoice a real id/number
     * assigned as early as possible. Vendor, Posting Date, Vendor Invoice No.,
     * Due Date, Currency and Payment Type all have to be filled in - currency
     * and payment type default from the vendor (see onVendorSelected()) but
     * still count here since the user may have cleared either back out.
     */
    private _hasMinimumDraftFields(): boolean {
        return !!this.invoiceInfo.creditorId
            && !!this.frmInvoice.controls['jdatepicker'].value
            && !!this.frmInvoice.controls['vendorInvoiceNumber'].value
            && !!this.frmInvoice.controls['dueDatepicker'].value
            && !!this.invoiceInfo.currencyId
            && !!this.invoiceInfo.paymentTypeId;
    }

    /** Pulls postingDate/vendorInvoiceNumber/dueDate off the form controls onto
     *  invoiceInfo, the same way getFormInfo() does for the full form - needed
     *  before either of the light-validation save paths below, which run
     *  before the user necessarily gets to line items. currencyId/paymentTypeId
     *  are already kept live on invoiceInfo by onCurrencySelected()/
     *  onPaymentTypeSelected()/onVendorSelected(), so nothing to pull for those. */
    private _applyMinimumDraftFields(): void {
        const postingDate: Date | null = this.frmInvoice.controls['jdatepicker'].value;
        this.invoiceInfo.postingDate = postingDate ? formatDate(postingDate, 'yyyy/MM/dd', 'en-US') : '';
        this.invoiceInfo.vendorInvoiceNumber = this.frmInvoice.controls['vendorInvoiceNumber'].value;
        const dueDate: Date | null = this.frmInvoice.controls['dueDatepicker'].value;
        this.invoiceInfo.dueDate = dueDate ? formatDate(dueDate, 'yyyy/MM/dd', 'en-US') : '';
    }

    /**
     * Fires on blur/selection of Vendor, Posting Date, Vendor Invoice No., Due
     * Date, Currency and Payment Type - the first time all six are filled in,
     * silently creates the draft in the background so this invoice gets a real
     * server-assigned id/number before the user does anything else. A no-op
     * once it already has one (or every time after), so it only ever runs once
     * per invoice.
     */
    checkAutoCreateDraft(): void {
        if (this.invoiceInfo.purchaseInvoiceId || this.isLoading || !this._hasMinimumDraftFields()) {
            return;
        }
        this._applyMinimumDraftFields();
        this._createInvoice().subscribe({
            next: () => {
                this.frmInvoice.markAsPristine();
                this.cdr.detectChanges();
            },
            error: (err) => {
                // A 409 - another invoice from this vendor already has this vendor
                // invoice number - is worth showing right away, not only once the user
                // eventually clicks Save. Any other failure stays silent: this is a
                // best-effort background draft, the explicit Save/Edit paths report those.
                if (err && err.status === 409) {
                    this._onRequestError(err);
                }
            }
        });
    }

    /**
     * Called by CanDeactivatePurchaseInvoiceDetails (see purchase-invoice.guards.ts)
     * right before navigating away from this page in-app - best-effort background
     * save of whatever's there, mirroring save()'s create-or-edit branching, but
     * without the full validation or blocking error alert (the user is already on
     * their way elsewhere) and never blocking the navigation itself either way.
     * Deliberately doesn't attempt anything on an actual tab close/refresh/crash -
     * see the conversation this was designed in for why that's an accepted gap.
     */
    canDeactivate(): Observable<boolean> {
        if (!this.frmInvoice || !this.frmInvoice.dirty) {
            return of(true);
        }
        if (this.invoiceInfo.purchaseInvoiceId) {
            return (this.service.edit(this.toBackendPayload()) as Observable<any>).pipe(
                take(1),
                tap(() => this.frmInvoice.markAsPristine()),
                map(() => true),
                catchError(() => of(true))
            );
        }
        if (this._hasMinimumDraftFields()) {
            this._applyMinimumDraftFields();
            return this._createInvoice().pipe(
                take(1),
                tap(() => this.frmInvoice.markAsPristine()),
                map(() => true),
                catchError(() => of(true))
            );
        }
        return of(true);
    }

    /**
     * Core create request shared by the manual Save button (after full
     * validation via getFormInfo()), the blur-triggered draft auto-create, and
     * the leave-guard. On success, records the server-assigned id and swaps the
     * URL from the "new" route to the "edit" route in place (no navigation/
     * reload), so a page refresh - or a second save before the user notices -
     * can never create a second invoice.
     */
    private _createInvoice(): Observable<PurchaseInvoice> {
        return this.service.create(this.toBackendPayload()).pipe(
            tap((created: PurchaseInvoice) => this._applyCreated(created))
        );
    }

    /**
     * The create response is the stored invoice, so the fields the server assigns
     * (id, invoiceNumber, status...) come straight from it - no second request -
     * and only those are copied, so nothing the user might still be editing is touched.
     */
    private _applyCreated(created: PurchaseInvoice): void {
        this.invoiceInfo.purchaseInvoiceId = created.purchaseInvoiceId;
        this.pageType = 'edit';
        this.id = created.purchaseInvoiceId;

        const urlTree = this._router.createUrlTree(['details', created.purchaseInvoiceId], { relativeTo: this.route.parent });
        this._location.replaceState(this._router.serializeUrl(urlTree));

        this.invoiceInfo.invoiceNumber = created.invoiceNumber;
        this.invoiceInfo.status = created.status;
        this.invoiceInfo.statusDescription = created.statusDescription;
        this.invoiceInfo.statusColor = created.statusColor;
        this.cdr.detectChanges();
    }

    confirm() {
        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');
        this.service.confirm(this.toBackendPayload()).subscribe({
            next: () => {
                this.isLoading = false;
                this._result.succeed = true;
                this._result.message = SAVE_SUCCEEDED_MESSAGE;
                this.showAlert('successMessage');
                this.cdr.detectChanges();
            },
            error: (err) => this._onRequestError(err)
        });
    }

    /** Not wired up yet - the backend has no cancelled status or endpoint for
     *  it yet. Placeholder so the button can be in the UI now and get real
     *  behavior later without another round of layout changes. */
    cancel(): void {
        this._result.succeed = false;
        this._result.message = "Cancelling a purchase invoice isn't available yet";
        this.showAlert('errorMessage');
    }

    trackByFn(index: number, item: any): any {
        return item.id || index;
    }
}
