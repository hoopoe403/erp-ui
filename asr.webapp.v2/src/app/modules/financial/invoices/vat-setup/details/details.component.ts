import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of, Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { FuseAlertService } from '@fuse/components/alert';
import { AccountOption, VatGroupOption } from 'app/modules/financial/shared/master-data.types';
import { GlAccountLookupService } from 'app/modules/financial/shared/lookup/gl-account-lookup.service';
import { VatLookupService } from 'app/modules/financial/shared/lookup/vat-lookup.service';
import { VatSetupService } from '../vat-setup.service';
import { VatRate, VatRateRequest } from '../vat-setup.types';

/**
 * Create or edit one VAT rate: VAT group x VAT product group, the rate and the date it applies from, and the GL
 * accounts its VAT is posted to. Both accounts are optional - a 0% rate (export, EU, exempt) has none - and only
 * postable accounts (no sub-accounts) are offered, the same list as on the invoice lines. Whether an account
 * exists and can be posted to is checked again by erp-be; its message is shown as is.
 */
@Component({
    selector: 'vat-setup-details',
    templateUrl: './details.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class VatSetupDetailsComponent implements OnInit, OnDestroy {

    form: FormGroup;
    vatRate: VatRate | null = null;
    vatGroups: VatGroupOption[] = [];
    vatProductGroups: VatGroupOption[] = [];
    accounts: AccountOption[] = [];
    statuses: any[] = [];
    isLoading = false;
    resultMessage = '';

    private _unsubscribeAll = new Subject<void>();

    constructor(private _formBuilder: FormBuilder,
                private _route: ActivatedRoute,
                private _router: Router,
                private _service: VatSetupService,
                private _vatLookup: VatLookupService,
                private _glAccountLookup: GlAccountLookupService,
                private _fuseAlertService: FuseAlertService,
                private _changeDetectorRef: ChangeDetectorRef) {
    }

    /**
     * The VAT Setup module's own route (parent of list/details). Links are built from here, not with '../': this
     * page is both 'details' (one URL segment) and 'details/:id' (two), so '../' would land in different places.
     */
    get moduleRoute(): ActivatedRoute {
        return this._route.parent;
    }

    get isEdit(): boolean {
        return !!this.vatRate;
    }

    /** A rate with VAT but no purchase account can be saved, but invoices using it cannot be posted yet. */
    get missingPurchaseAccount(): boolean {
        const rate = Number(this.form.value.ratePercent);
        return rate > 0 && !this.form.value.purchaseVatAccountId;
    }

    ngOnInit(): void {
        this.form = this._formBuilder.group({
            vatGroupId: [null, Validators.required],
            vatProductGroupId: [null, Validators.required],
            ratePercent: [null, [Validators.required, Validators.min(0), Validators.max(100)]],
            effectiveDateTime: [null, Validators.required],
            purchaseVatAccountId: [null],
            salesVatAccountId: [null],
            status: [null]
        });

        this.isLoading = true;
        this._route.paramMap.pipe(
            switchMap((params) => {
                const id = this._validId(params.get('id'));
                return forkJoin({
                    vatGroups: this._vatLookup.getVatPostingGroups(),
                    vatProductGroups: this._vatLookup.getVatProductPostingGroups(),
                    accounts: this._glAccountLookup.getGlAccounts(),
                    statuses: this._service.getStatuses(),
                    vatRate: id ? this._service.getVatRate(id) : of(null)
                });
            }),
            takeUntil(this._unsubscribeAll)
        ).subscribe({
            next: (data) => {
                this.vatGroups = data.vatGroups;
                this.vatProductGroups = data.vatProductGroups;
                this.accounts = data.accounts;
                this.statuses = data.statuses || [];
                this._load(data.vatRate);
                this.isLoading = false;
                this._changeDetectorRef.markForCheck();
            },
            error: (err: HttpErrorResponse) => {
                this.isLoading = false;
                this._showError(err);
            }
        });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    save(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        this._fuseAlertService.dismiss('successMessage');
        this._fuseAlertService.dismiss('errorMessage');
        const value = this.form.value;
        const request: VatRateRequest = {
            vatRateId: this.vatRate ? this.vatRate.vatRateId : undefined,
            vatGroupId: value.vatGroupId,
            vatProductGroupId: value.vatProductGroupId,
            ratePercent: Number(value.ratePercent),
            effectiveDateTime: value.effectiveDateTime,
            purchaseVatAccountId: value.purchaseVatAccountId || null,
            salesVatAccountId: value.salesVatAccountId || null,
            status: value.status || undefined
        };

        this.isLoading = true;
        const save$ = this.isEdit ? this._service.edit(request) : this._service.create(request);
        save$.pipe(takeUntil(this._unsubscribeAll)).subscribe({
            next: (saved) => {
                this.isLoading = false;
                const newId = !this.isEdit && saved ? this._validId(String(saved.vatRateId)) : null;
                if (newId) {
                    // A new rate gets its own URL, so a reload edits it instead of creating another.
                    this._router.navigate(['details', newId], { relativeTo: this.moduleRoute, replaceUrl: true });
                }
                this._load(saved);
                this._showSuccess('VAT rate saved');
            },
            error: (err: HttpErrorResponse) => {
                this.isLoading = false;
                this._showError(err);
            }
        });
    }

    delete(): void {
        this._fuseAlertService.dismiss('successMessage');
        this._fuseAlertService.dismiss('errorMessage');
        this._service.confirmAndDelete(this.vatRate).pipe(takeUntil(this._unsubscribeAll)).subscribe({
            next: (deleted) => {
                if (deleted) {
                    this._router.navigate(['list'], { relativeTo: this.moduleRoute });
                }
            },
            error: (err: HttpErrorResponse) => this._showError(err)
        });
    }

    /** The route/response id as a positive whole number, or null - anything else ("undefined", "new") means a new rate. */
    private _validId(raw: string | null): number | null {
        const id = Number(raw);
        return raw && Number.isInteger(id) && id > 0 ? id : null;
    }

    private _load(vatRate: VatRate | null): void {
        this.vatRate = vatRate;
        if (!vatRate) {
            // Today at 00:00, like a date picked in the calendar - a rate applies from the start of its day.
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            this.form.reset({ effectiveDateTime: today });
            return;
        }
        this.form.reset({
            vatGroupId: vatRate.vatGroupId,
            vatProductGroupId: vatRate.vatProductGroupId,
            ratePercent: vatRate.ratePercent,
            effectiveDateTime: vatRate.effectiveDateTime ? new Date(vatRate.effectiveDateTime) : null,
            purchaseVatAccountId: vatRate.purchaseVatAccountId,
            salesVatAccountId: vatRate.salesVatAccountId,
            status: vatRate.status
        });
    }

    private _showSuccess(message: string): void {
        this.resultMessage = message;
        this._fuseAlertService.show('successMessage');
        this._changeDetectorRef.markForCheck();
    }

    /** erp-be answers failures with an RFC 7807 problem; `detail` is the readable text. */
    private _showError(err: HttpErrorResponse): void {
        this.resultMessage = (err && err.error && err.error.detail) || (err && err.message) || 'Request failed';
        this._fuseAlertService.show('errorMessage');
        this._changeDetectorRef.markForCheck();
    }
}
