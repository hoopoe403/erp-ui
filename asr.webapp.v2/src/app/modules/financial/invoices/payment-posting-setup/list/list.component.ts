import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { fuseAnimations } from '@fuse/animations';
import { Paging } from 'app/core/type/paging/paging.type';
import { PaymentTypeOption } from 'app/modules/financial/shared/lookup/payment-type-lookup.service';
import { PaymentPostingSetupService } from '../payment-posting-setup.service';
import {
    InvoiceSide,
    invoiceSideOf,
    PaymentPostingSetup,
    PaymentPostingSetupFilter,
    SIDE_TEXT,
    SideText
} from '../payment-posting-setup.types';

/** Enough for every row on one page - one row per payment type. */
const PAGE_SIZE = 1000;

/**
 * Every payment type's account on one side, latest added or changed first, plus a warning for the active payment
 * types that have no account yet. Starts on the statuses flagged as default; a row opens its details.
 */
@Component({
    selector: 'payment-posting-setup-list',
    templateUrl: './list.component.html',
    styles: [
        /* language=SCSS */
        `
            .payment-posting-setup-grid {
                grid-template-columns: auto auto 88px;

                @screen md {
                    grid-template-columns: 200px auto 100px 110px 88px;
                }
            }
        `
    ],
    animations: fuseAnimations,
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentPostingSetupListComponent implements OnInit, OnDestroy {

    side: InvoiceSide;
    text: SideText;
    setups: PaymentPostingSetup[] = [];
    missingPaymentTypes: PaymentTypeOption[] = [];
    statuses: any[] = [];
    statusControl = new FormControl([]);
    isLoading = false;
    errorMessage: string | null = null;

    private _unsubscribeAll = new Subject<void>();

    constructor(private _service: PaymentPostingSetupService,
                private _router: Router,
                private _route: ActivatedRoute,
                private _changeDetectorRef: ChangeDetectorRef) {
    }

    /** The module's own route (parent of list/details) - links are built from here, not with '../'. */
    get moduleRoute(): ActivatedRoute {
        return this._route.parent;
    }

    ngOnInit(): void {
        this.side = invoiceSideOf(this._route);
        this.text = SIDE_TEXT[this.side];
        this.isLoading = true;
        this._service.getStatuses().pipe(
            switchMap((statuses) => {
                this.statuses = statuses || [];
                this.statusControl.setValue(this.statuses.filter((s) => s.isDefault === 1).map((s) => s.statusId), { emitEvent: false });
                return this._service.getSetups(this._filter());
            }),
            takeUntil(this._unsubscribeAll)
        ).subscribe({
            next: (response) => this._show(response.paymentPostingSetups),
            error: (err: HttpErrorResponse) => this._showError(err)
        });

        this.statusControl.valueChanges.pipe(
            switchMap(() => {
                this.isLoading = true;
                this._changeDetectorRef.markForCheck();
                return this._service.getSetups(this._filter());
            }),
            takeUntil(this._unsubscribeAll)
        ).subscribe({
            next: (response) => this._show(response.paymentPostingSetups),
            error: (err: HttpErrorResponse) => this._showError(err)
        });

        this._loadMissing();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    open(setup: PaymentPostingSetup): void {
        this._router.navigate(['details', setup.paymentPostingSetupId], { relativeTo: this.moduleRoute });
    }

    delete(setup: PaymentPostingSetup): void {
        this._service.confirmAndDelete(setup).pipe(takeUntil(this._unsubscribeAll)).subscribe({
            next: (deleted) => {
                if (deleted) {
                    this._show(this.setups.filter((s) => s.paymentPostingSetupId !== setup.paymentPostingSetupId));
                    this._loadMissing();
                }
            },
            error: (err: HttpErrorResponse) => this._showError(err)
        });
    }

    missingNames(): string {
        return this.missingPaymentTypes.map((p) => p.paymentTypeName).join(', ');
    }

    trackByFn(index: number, item: PaymentPostingSetup): number {
        return item.paymentPostingSetupId || index;
    }

    private _loadMissing(): void {
        this._service.getMissingPaymentTypes(this.side).pipe(takeUntil(this._unsubscribeAll)).subscribe({
            next: (types) => {
                this.missingPaymentTypes = types || [];
                this._changeDetectorRef.markForCheck();
            },
            error: () => {
                this.missingPaymentTypes = [];
                this._changeDetectorRef.markForCheck();
            }
        });
    }

    private _filter(): PaymentPostingSetupFilter {
        const page = new Paging();
        page.flag = false;
        page.length = 0;
        page.pageNumber = 1;
        page.pageSize = PAGE_SIZE;
        page.sort = 'changeDate';
        page.order = 'desc';
        return { invoiceSide: this.side, statusIdList: this.statusControl.value || [], page };
    }

    private _show(setups: PaymentPostingSetup[]): void {
        // Latest first: most recently added or changed on top (newest id breaks a tie).
        this.setups = [...(setups || [])].sort((a, b) =>
            this._time(b.changeDate) - this._time(a.changeDate) || b.paymentPostingSetupId - a.paymentPostingSetupId);
        this.errorMessage = null;
        this.isLoading = false;
        this._changeDetectorRef.markForCheck();
    }

    private _time(value: string | null): number {
        return value ? new Date(value).getTime() : 0;
    }

    private _showError(err: HttpErrorResponse): void {
        this.errorMessage = (err && err.error && err.error.detail) || (err && err.message) || 'Could not load the posting setup';
        this.isLoading = false;
        this._changeDetectorRef.markForCheck();
    }
}
