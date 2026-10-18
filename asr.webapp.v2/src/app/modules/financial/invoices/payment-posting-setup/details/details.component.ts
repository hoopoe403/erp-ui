import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of, Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { FuseAlertService } from '@fuse/components/alert';
import { AccountOption } from 'app/modules/financial/shared/master-data.types';
import { GlAccountLookupService } from 'app/modules/financial/shared/lookup/gl-account-lookup.service';
import { PaymentTypeLookupService, PaymentTypeOption } from 'app/modules/financial/shared/lookup/payment-type-lookup.service';
import { PaymentPostingSetupService } from '../payment-posting-setup.service';
import {
    InvoiceSide,
    invoiceSideOf,
    PaymentPostingSetup,
    PaymentPostingSetupRequest,
    SIDE_TEXT,
    SideText
} from '../payment-posting-setup.types';

/**
 * Create or edit one payment type's account on one side. Only postable accounts (no sub-accounts) are offered - the
 * same list as on the invoice lines. One account per payment type and side; several payment types may share one.
 * Whether the payment type exists, the account is postable and the payment type is already set up is checked
 * again by erp-be; its message is shown as is.
 */
@Component({
    selector: 'payment-posting-setup-details',
    templateUrl: './details.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentPostingSetupDetailsComponent implements OnInit, OnDestroy {

    side: InvoiceSide;
    text: SideText;
    form: FormGroup;
    setup: PaymentPostingSetup | null = null;
    paymentTypes: PaymentTypeOption[] = [];
    accounts: AccountOption[] = [];
    statuses: any[] = [];
    isLoading = false;
    resultMessage = '';

    private _unsubscribeAll = new Subject<void>();

    constructor(private _formBuilder: FormBuilder,
                private _route: ActivatedRoute,
                private _router: Router,
                private _service: PaymentPostingSetupService,
                private _paymentTypeLookup: PaymentTypeLookupService,
                private _glAccountLookup: GlAccountLookupService,
                private _fuseAlertService: FuseAlertService,
                private _changeDetectorRef: ChangeDetectorRef) {
    }

    /** The module's own route (parent of list/details): this page is 'details' and 'details/:id', so no '../'. */
    get moduleRoute(): ActivatedRoute {
        return this._route.parent;
    }

    get isEdit(): boolean {
        return !!this.setup;
    }

    ngOnInit(): void {
        this.side = invoiceSideOf(this._route);
        this.text = SIDE_TEXT[this.side];
        this.form = this._formBuilder.group({
            paymentTypeId: [null, Validators.required],
            accountChartId: [null, Validators.required],
            status: [null]
        });

        this.isLoading = true;
        this._route.paramMap.pipe(
            switchMap((params) => {
                const id = this._validId(params.get('id'));
                return forkJoin({
                    paymentTypes: this._paymentTypeLookup.getPaymentTypes(),
                    accounts: this._glAccountLookup.getGlAccounts(),
                    statuses: this._service.getStatuses(),
                    setup: id ? this._service.getSetup(id) : of(null)
                });
            }),
            takeUntil(this._unsubscribeAll)
        ).subscribe({
            next: (data) => {
                this.paymentTypes = data.paymentTypes;
                this.accounts = data.accounts;
                this.statuses = data.statuses || [];
                this._load(data.setup);
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
        const request: PaymentPostingSetupRequest = {
            paymentPostingSetupId: this.setup ? this.setup.paymentPostingSetupId : undefined,
            paymentTypeId: value.paymentTypeId,
            invoiceSide: this.side,
            accountChartId: value.accountChartId,
            status: value.status || undefined
        };

        this.isLoading = true;
        const save$ = this.isEdit ? this._service.edit(request) : this._service.create(request);
        save$.pipe(takeUntil(this._unsubscribeAll)).subscribe({
            next: (saved) => {
                this.isLoading = false;
                const newId = !this.isEdit && saved ? this._validId(String(saved.paymentPostingSetupId)) : null;
                if (newId) {
                    // A new row gets its own URL, so a reload edits it instead of creating another.
                    this._router.navigate(['details', newId], { relativeTo: this.moduleRoute, replaceUrl: true });
                }
                this._load(saved);
                this._showSuccess('Posting setup saved');
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
        this._service.confirmAndDelete(this.setup).pipe(takeUntil(this._unsubscribeAll)).subscribe({
            next: (deleted) => {
                if (deleted) {
                    this._router.navigate(['list'], { relativeTo: this.moduleRoute });
                }
            },
            error: (err: HttpErrorResponse) => this._showError(err)
        });
    }

    /** The route/response id as a positive whole number, or null - anything else means a new row. */
    private _validId(raw: string | null): number | null {
        const id = Number(raw);
        return raw && Number.isInteger(id) && id > 0 ? id : null;
    }

    private _load(setup: PaymentPostingSetup | null): void {
        this.setup = setup;
        if (!setup) {
            this.form.reset({});
            return;
        }
        this.form.reset({
            paymentTypeId: setup.paymentTypeId,
            accountChartId: setup.accountChartId,
            status: setup.status
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
