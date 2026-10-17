import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { fuseAnimations } from "../../../../../../@fuse/animations";
import { FormArray, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { animate, state, style, transition, trigger } from "@angular/animations";
import { SalesInvoiceService } from "../sales-invoice.service";
import { FuseAlertService } from '@fuse/components/alert';
import { Observable, Subject, of } from 'rxjs';
import { catchError, map, take, takeUntil, tap } from 'rxjs/operators';
import { SalesInvoice, SalesInvoiceDetail } from '../sales-invoice.types';
import { OpResult } from 'app/core/type/result/result.types';
import { ActivatedRoute, Router } from '@angular/router';
import { Customer } from 'app/modules/configuration/customer/customer/customer.types';
import { BankAccountService } from 'app/modules/configuration/shared/bank-account/bank-account.service';
import { Currency } from 'app/modules/configuration/shared/bank-account/bank-account.types';
import { formatDate, Location } from '@angular/common';
import { FuseDataEntryDialogService } from '@fuse/services/data-entry-dialog/data-entry-dialog.service';
import { FuseDataEntryDialogFormControls } from '@fuse/services/data-entry-dialog/data-entry-dialog.types';
import { CustomerLookupService } from '../../../shared/lookup/customer-lookup.service';
import { GlAccountLookupService } from '../../../shared/lookup/gl-account-lookup.service';
import { ItemLookupService, ItemOption } from '../../../shared/lookup/item-lookup.service';
import { CostCenterLookupService } from '../../../shared/lookup/cost-center-lookup.service';
import { VatLookupService } from '../../../shared/lookup/vat-lookup.service';
import { ReviewedByLookupService, ReviewerOption } from '../../../shared/lookup/reviewed-by-lookup.service';
import { toUnitLookupOption, UnitLookupService, UnitOption } from '../../../shared/lookup/unit-lookup.service';
import { PaymentTypeLookupService, PaymentTypeOption } from '../../../shared/lookup/payment-type-lookup.service';
import { AccountOption, CostCenterOption, VatGroupOption } from '../../../shared/master-data.types';
import {
    DEFAULT_CURRENCY_ABBREVIATION, DEFAULT_CURRENCY_NAME,
    SALES_INVOICE_STATUS_DRAFT, SALES_INVOICE_STATUS_PENDING_REVIEW, SALES_INVOICE_STATUS_POSTED
} from '../../../shared/financial-constants';
import { LookupOption } from '../../../shared/lookup-option.type';
import { LineTypeOption } from '../../../shared/line-items-table/line-items-table.component';

/** Shown in the success alert - the same text erp-be's envelope used to send. */
const SAVE_SUCCEEDED_MESSAGE = 'Execute Operation Successfully';

/**
 * Sales Invoice details/register form - the Accounts Receivable mirror of
 * PurchaseInvoiceDetailsComponent. Same form shape, same reusable
 * app-line-items-table/app-lookup-select components, same autosave/draft and
 * error-handling patterns; the vendor picker is replaced with a Customer
 * picker (CustomerLookupService), which - unlike Vendor - needs no
 * owners-list-plus-Contractor merge since Customer is already a full, real
 * entity (see CustomerLookupService).
 */
@Component({
    selector: 'sales-invoice-details',
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
export class SalesInvoiceDetailsComponent implements OnInit, OnDestroy {
    pageType: string;
    id: number = 0;
    invoiceInfo: SalesInvoice = new SalesInvoice();
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
    customers: Customer[] = [];
    glAccounts: AccountOption[] = [];
    items: ItemOption[] = [];
    glAccountOptions: LookupOption[] = [];
    itemOptions: LookupOption[] = [];
    /** G/L Account or Item - not Fixed Asset like Purchase Invoice, see
     *  sales-invoice.types.ts's SalesInvoiceDetail.lineType Javadoc. */
    readonly lineTypes: LineTypeOption[] = [
        { value: 'GL', label: 'G/L Account' },
        { value: 'IT', label: 'Item' },
    ];
    costCenters: CostCenterOption[] = [];
    vatPostingGroups: VatGroupOption[] = [];
    vatProductPostingGroups: VatGroupOption[] = [];
    reviewers: ReviewerOption[] = [];
    units: UnitOption[] = [];
    unitOptions: LookupOption[] = [];
    paymentTypes: PaymentTypeOption[] = [];
    currencies: Currency[] = [];

    readonly STATUS_DRAFT = SALES_INVOICE_STATUS_DRAFT;
    readonly STATUS_PENDING_REVIEW = SALES_INVOICE_STATUS_PENDING_REVIEW;
    readonly STATUS_POSTED = SALES_INVOICE_STATUS_POSTED;

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

    private _selectedCustomerVatGroupId: number | null = null;

    constructor(
        private service: SalesInvoiceService,
        private _formBuilder: FormBuilder,
        private cdr: ChangeDetectorRef,
        private route: ActivatedRoute,
        private _router: Router,
        private _location: Location,
        private _fuseAlertService: FuseAlertService,
        private _fuseDataEntryDialogService: FuseDataEntryDialogService,
        private _customerLookupService: CustomerLookupService,
        private _glAccountLookupService: GlAccountLookupService,
        private _itemLookupService: ItemLookupService,
        private _costCenterLookupService: CostCenterLookupService,
        private _vatLookupService: VatLookupService,
        private _reviewedByLookupService: ReviewedByLookupService,
        private _unitLookupService: UnitLookupService,
        private _paymentTypeLookupService: PaymentTypeLookupService,
        private _bankAccountService: BankAccountService
    ) {
        this._unsubscribeAll = new Subject();
        this.invoiceInfo.salesInvoiceDetailList = [];
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
            this.titleInfo = 'Register New Sales Invoice';
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
        this._customerLookupService.getCustomers().subscribe((v) => {
            this.customers = v;
            this.cdr.detectChanges();
        });
        this._glAccountLookupService.getGlAccounts().subscribe((v) => {
            this.glAccounts = v;
            this.glAccountOptions = v.map((a) => ({ id: a.accountId, code: a.accountCode, name: a.accountName }));
            this.cdr.detectChanges();
        });
        this._itemLookupService.getItems().subscribe((v) => {
            this.items = v;
            this.itemOptions = v.map((a) => ({ id: a.itemId, code: a.itemCode, name: a.itemName }));
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
                    const line = this.invoiceInfo.salesInvoiceDetailList[index];
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
            this.unitOptions = v.map(toUnitLookupOption);
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
        this.service.getSalesInvoice(id).subscribe({
            next: (invoice) => {
                this.invoiceInfo = invoice;
                if (!this.invoiceInfo.salesInvoiceDetailList) {
                    this.invoiceInfo.salesInvoiceDetailList = [];
                }
                if (!this.invoiceInfo.currencyAbbreviation) {
                    this.invoiceInfo.currencyAbbreviation = DEFAULT_CURRENCY_ABBREVIATION;
                    this.invoiceInfo.currencyName = DEFAULT_CURRENCY_NAME;
                }
                this.titleInfo = this.invoiceInfo.customerName || 'Sales Invoice';
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
            customerId: [null, Validators.required],
            customerCode: [{ value: '', disabled: true }],
            currencyId: [null],
            jdatepicker: '',
            customerReferenceNumber: '',
            dueDatepicker: '',
            reviewedByUserId: [null],
            paymentTypeId: [null],
            lines: this._formBuilder.array([]),
        });
    }

    private setFormValues() {
        this.frmInvoice.controls['customerId'].setValue(this.invoiceInfo.customerId);
        this.frmInvoice.controls['customerCode'].setValue(this.invoiceInfo.customerCode);
        this.frmInvoice.controls['customerReferenceNumber'].setValue(this.invoiceInfo.customerReferenceNumber);
        this.frmInvoice.controls['reviewedByUserId'].setValue(this.invoiceInfo.reviewedByUserId);
        this.frmInvoice.controls['paymentTypeId'].setValue(this.invoiceInfo.paymentTypeId);
        this.frmInvoice.controls['currencyId'].setValue(this.invoiceInfo.currencyId);
        this.frmInvoice.controls['jdatepicker'].setValue(this._parseDate(this.invoiceInfo.postingDate));
        this.frmInvoice.controls['dueDatepicker'].setValue(this._parseDate(this.invoiceInfo.dueDate));

        this.lines.clear();
        this.invoiceInfo.salesInvoiceDetailList.forEach((line) => {
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
    // @ Customer
    // -----------------------------------------------------------------------------------------------------

    onCustomerSelected(customer: Customer | null): void {
        this.invoiceInfo.customerId = customer ? customer.customerId : null;
        this.invoiceInfo.customerName = customer ? customer.customerName : '';
        this.invoiceInfo.customerCode = customer ? customer.customerCode : '';
        this.frmInvoice.controls['customerCode'].setValue(this.invoiceInfo.customerCode);

        // Reset to defaults - still just a default, not a lock: the user can pick
        // any currency from the dropdown regardless of the customer's own record.
        const defaultCurrency = this.currencies.find((c) => c.currencyAbbreviation === DEFAULT_CURRENCY_ABBREVIATION);
        this.invoiceInfo.currencyId = defaultCurrency ? defaultCurrency.currencyId : null;
        this.invoiceInfo.currencyName = DEFAULT_CURRENCY_NAME;
        this.invoiceInfo.currencyAbbreviation = DEFAULT_CURRENCY_ABBREVIATION;
        this._selectedCustomerVatGroupId = null;
        this.frmInvoice.controls['currencyId'].setValue(this.invoiceInfo.currencyId);

        if (!customer) {
            return;
        }

        this.checkAutoCreateDraft();
    }

    openCustomerRegisterTab(): void {
        const url = this._router.serializeUrl(this._router.createUrlTree(['/configuration/customer/customer/register']));
        window.open(url, '_blank');
    }

    /** Defaults from the selected customer (see onCustomerSelected()) but stays
     *  editable — this only fires when the user picks a different one by hand. */
    onCurrencySelected(currency: Currency | null): void {
        this.invoiceInfo.currencyId = currency ? currency.currencyId : null;
        this.invoiceInfo.currencyName = currency ? currency.currencyName : DEFAULT_CURRENCY_NAME;
        this.invoiceInfo.currencyAbbreviation = currency ? currency.currencyAbbreviation : DEFAULT_CURRENCY_ABBREVIATION;
        this.checkAutoCreateDraft();
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

    onPaymentTypeSelected(paymentType: PaymentTypeOption | null): void {
        this.invoiceInfo.paymentTypeId = paymentType ? paymentType.paymentTypeId : null;
        this.invoiceInfo.paymentTypeName = paymentType ? paymentType.paymentTypeName : null;
        this.checkAutoCreateDraft();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Line items
    // -----------------------------------------------------------------------------------------------------

    addNewItem(): void {
        const detail = new SalesInvoiceDetail();
        detail.salesInvoiceDetailId = -(this.invoiceInfo.salesInvoiceDetailList.length + 1);
        detail.rowNumber = this.invoiceInfo.salesInvoiceDetailList.length + 1;
        detail.lineType = 'GL';
        detail.quantity = 1;
        detail.unitId = null;
        detail.unitPrice = 0;
        detail.netAmount = 0;
        detail.grossAmount = 0;
        detail.itemDesc = '';
        detail.vatPostingGroupId = this._selectedCustomerVatGroupId ?? null;
        detail.vatProductPostingGroupId = this._vatLookupService.getDefaultVatProductPostingGroupId();
        this.invoiceInfo.salesInvoiceDetailList.push(detail);
        this.lines.push(this.createLineGroup(detail));
    }

    removeItem(index: number): void {
        // The invoice always needs at least one line to submit — keep the last
        // remaining row in place rather than letting the table go empty.
        if (this.invoiceInfo.salesInvoiceDetailList.length <= 1) {
            return;
        }
        this.invoiceInfo.salesInvoiceDetailList.splice(index, 1);
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
                this.unitOptions = [...this.unitOptions, toUnitLookupOption(unit)];
                (this.lines.at(lineIndex) as FormGroup).controls['unitId'].setValue(unit.unitId);
                this.cdr.detectChanges();
            });
        });
    }

    private createLineGroup(line: SalesInvoiceDetail): FormGroup {
        const group = this._formBuilder.group({
            lineType: [line.lineType || 'GL'],
            accountId: [line.lineType === 'IT' ? line.itemId : line.accountId],
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

    private onLineChanged(line: SalesInvoiceDetail, value: any): void {
        line.lineType = value.lineType;
        if (value.lineType === 'IT') {
            const item = this.items.find((a) => a.itemId === value.accountId);
            line.itemId = value.accountId;
            line.itemCode = item ? item.itemCode : '';
            line.itemName = item ? item.itemName : '';
            line.accountId = null;
            line.accountCode = '';
            line.accountName = '';
        } else {
            const acc = this.glAccounts.find((a) => a.accountId === value.accountId);
            line.accountId = value.accountId;
            line.accountCode = acc ? acc.accountCode : '';
            line.accountName = acc ? acc.accountName : '';
            line.itemId = null;
            line.itemCode = '';
            line.itemName = '';
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

        const group = this.lines.at(this.invoiceInfo.salesInvoiceDetailList.indexOf(line)) as FormGroup;
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
        this.invoiceInfo.salesInvoiceDetailList.forEach((l) => {
            sumNet += l.netAmount || 0;
            sumGross += l.grossAmount || 0;
        });
        this.invoiceInfo.totalNetAmount = sumNet;
        this.invoiceInfo.totalVatAmount = sumGross - sumNet;
        this.invoiceInfo.totalGrossAmount = sumGross;
        // Keep the legacy aggregate fields (still on the backend model) in sync.
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
    private _isLineBlank(line: SalesInvoiceDetail): boolean {
        return !line.accountId && !line.itemId && !line.costCenterId
            && !(line.itemDesc && line.itemDesc.trim())
            && !((line.netAmount || 0) > 0);
    }

    private getFormInfo(): boolean {
        const nonBlankLines = this.invoiceInfo.salesInvoiceDetailList.filter((l) => !this._isLineBlank(l));
        if (nonBlankLines.length <= 0) {
            this._result.succeed = false;
            this._result.message = "At least one item in the invoice should be entered";
            this.showAlert('errorMessage');
            return false;
        }

        let linesValid = true;
        this.lines.controls.forEach((group: FormGroup, index) => {
            if (this._isLineBlank(this.invoiceInfo.salesInvoiceDetailList[index])) {
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

        if (!this.invoiceInfo.customerId) {
            this._result.succeed = false;
            this._result.message = 'Please select a customer';
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

        this.invoiceInfo.customerReferenceNumber = this.frmInvoice.controls['customerReferenceNumber'].value;

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
            if (this._isLineBlank(this.invoiceInfo.salesInvoiceDetailList[index])) {
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
     * store on the erp-be side (see SalesInvoiceRepositoryMock) — only
     * the trailing always-blank placeholder row is dropped before saving.
     */
    private toBackendPayload(): SalesInvoice {
        const header: any = { ...this.invoiceInfo };
        header.salesInvoiceDetailList = (this.invoiceInfo.salesInvoiceDetailList || [])
            .filter((line) => !this._isLineBlank(line));
        return header;
    }

    /**
     * Whichever it should be is decided by whether this invoice already has a
     * server-assigned id (see _applyCreated()) - not by pageType, which is
     * only set once from the route at load time and would otherwise cause a
     * second click on a still-'new' page to create a duplicate invoice.
     */
    save() {
        if (!this.getFormInfo()) {
            return;
        }
        if (this.invoiceInfo.salesInvoiceId)
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
        const nonBlankLines = this.invoiceInfo.salesInvoiceDetailList.filter((l) => !this._isLineBlank(l));
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
     * doesn't exist, 409 for a duplicate customer reference number, 5xx/no connection
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
     * in `detail` (e.g. "Please select a customer", "Sales invoice not found").
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
     * required, and no customer reference number required either - unlike
     * Purchase Invoice's vendor invoice number, a customer PO reference is
     * often not known yet when the invoice is first started), since this only
     * exists to get the invoice a real id/number assigned as early as
     * possible. Customer, Posting Date, Due Date, Currency all have to be
     * filled in - currency defaults from context but still counts here since
     * the user may have cleared it back out.
     */
    private _hasMinimumDraftFields(): boolean {
        return !!this.invoiceInfo.customerId
            && !!this.frmInvoice.controls['jdatepicker'].value
            && !!this.frmInvoice.controls['dueDatepicker'].value
            && !!this.invoiceInfo.currencyId;
    }

    /** Pulls postingDate/customerReferenceNumber/dueDate off the form controls onto
     *  invoiceInfo, the same way getFormInfo() does for the full form - needed
     *  before either of the light-validation save paths below, which run
     *  before the user necessarily gets to line items. currencyId is already
     *  kept live on invoiceInfo by onCurrencySelected()/onCustomerSelected(),
     *  so nothing to pull for that. */
    private _applyMinimumDraftFields(): void {
        const postingDate: Date | null = this.frmInvoice.controls['jdatepicker'].value;
        this.invoiceInfo.postingDate = postingDate ? formatDate(postingDate, 'yyyy/MM/dd', 'en-US') : '';
        this.invoiceInfo.customerReferenceNumber = this.frmInvoice.controls['customerReferenceNumber'].value;
        const dueDate: Date | null = this.frmInvoice.controls['dueDatepicker'].value;
        this.invoiceInfo.dueDate = dueDate ? formatDate(dueDate, 'yyyy/MM/dd', 'en-US') : '';
    }

    /**
     * Fires on blur/selection of Customer, Posting Date, Due Date and Currency -
     * the first time all four are filled in, silently creates the draft in the
     * background so this invoice gets a real server-assigned id/number before
     * the user does anything else. A no-op once it already has one (or every
     * time after), so it only ever runs once per invoice.
     */
    checkAutoCreateDraft(): void {
        if (this.invoiceInfo.salesInvoiceId || this.isLoading || !this._hasMinimumDraftFields()) {
            return;
        }
        this._applyMinimumDraftFields();
        this._createInvoice().subscribe({
            next: () => {
                this.frmInvoice.markAsPristine();
                this.cdr.detectChanges();
            },
            error: (err) => {
                // A 409 - another invoice from this customer already has this customer
                // reference number - is worth showing right away, not only once the user
                // eventually clicks Save. Any other failure stays silent: this is a
                // best-effort background draft, the explicit Save/Edit paths report those.
                if (err && err.status === 409) {
                    this._onRequestError(err);
                }
            }
        });
    }

    /**
     * Called by CanDeactivateSalesInvoiceDetails (see sales-invoice.guards.ts)
     * right before navigating away from this page in-app - best-effort background
     * save of whatever's there, mirroring save()'s create-or-edit branching, but
     * without the full validation or blocking error alert (the user is already on
     * their way elsewhere) and never blocking the navigation itself either way.
     */
    canDeactivate(): Observable<boolean> {
        if (!this.frmInvoice || !this.frmInvoice.dirty) {
            return of(true);
        }
        if (this.invoiceInfo.salesInvoiceId) {
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
    private _createInvoice(): Observable<SalesInvoice> {
        return this.service.create(this.toBackendPayload()).pipe(
            tap((created: SalesInvoice) => this._applyCreated(created))
        );
    }

    /**
     * The create response is the stored invoice, so the fields the server assigns
     * (id, invoiceNumber, status...) come straight from it - no second request -
     * and only those are copied, so nothing the user might still be editing is touched.
     */
    private _applyCreated(created: SalesInvoice): void {
        this.invoiceInfo.salesInvoiceId = created.salesInvoiceId;
        this.pageType = 'edit';
        this.id = created.salesInvoiceId;

        const urlTree = this._router.createUrlTree(['details', created.salesInvoiceId], { relativeTo: this.route.parent });
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
        this._result.message = "Cancelling a sales invoice isn't available yet";
        this.showAlert('errorMessage');
    }

    trackByFn(index: number, item: any): any {
        return item.id || index;
    }
}
