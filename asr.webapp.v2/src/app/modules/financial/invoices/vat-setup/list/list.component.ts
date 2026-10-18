import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { fuseAnimations } from '@fuse/animations';
import { Paging } from 'app/core/type/paging/paging.type';
import { VatSetupService } from '../vat-setup.service';
import { VatRate, VatRateFilter } from '../vat-setup.types';

/** Enough for every VAT rate on one page - the setup is a few dozen rows at most. */
const PAGE_SIZE = 1000;

/**
 * Every VAT rate with the GL accounts its VAT posts to, latest added or changed first. Starts on
 * the statuses flagged as default (like the other lists); a row opens its details.
 */
@Component({
    selector: 'vat-setup-list',
    templateUrl: './list.component.html',
    styles: [
        /* language=SCSS */
        `
            .vat-setup-grid {
                grid-template-columns: auto auto 80px 88px;

                @screen md {
                    grid-template-columns: 140px 140px 80px 110px auto auto 100px 88px;
                }
            }
        `
    ],
    animations: fuseAnimations,
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class VatSetupListComponent implements OnInit, OnDestroy {

    vatRates: VatRate[] = [];
    statuses: any[] = [];
    statusControl = new FormControl([]);
    isLoading = false;
    errorMessage: string | null = null;

    private _unsubscribeAll = new Subject<void>();

    constructor(private _service: VatSetupService,
                private _router: Router,
                private _route: ActivatedRoute,
                private _changeDetectorRef: ChangeDetectorRef) {
    }

    ngOnInit(): void {
        this.isLoading = true;
        this._service.getStatuses().pipe(
            switchMap((statuses) => {
                this.statuses = statuses || [];
                this.statusControl.setValue(this.statuses.filter((s) => s.isDefault === 1).map((s) => s.statusId), { emitEvent: false });
                return this._service.getVatRates(this._filter());
            }),
            takeUntil(this._unsubscribeAll)
        ).subscribe({
            next: (response) => this._show(response.vatRates),
            error: (err: HttpErrorResponse) => this._showError(err)
        });

        this.statusControl.valueChanges.pipe(
            switchMap(() => {
                this.isLoading = true;
                this._changeDetectorRef.markForCheck();
                return this._service.getVatRates(this._filter());
            }),
            takeUntil(this._unsubscribeAll)
        ).subscribe({
            next: (response) => this._show(response.vatRates),
            error: (err: HttpErrorResponse) => this._showError(err)
        });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    open(vatRate: VatRate): void {
        this._router.navigate(['details', vatRate.vatRateId], { relativeTo: this.moduleRoute });
    }

    /** The VAT Setup module's own route (parent of list/details) - links are built from here, like on the details page. */
    get moduleRoute(): ActivatedRoute {
        return this._route.parent;
    }

    delete(vatRate: VatRate): void {
        this._service.confirmAndDelete(vatRate).pipe(takeUntil(this._unsubscribeAll)).subscribe({
            next: (deleted) => {
                if (deleted) {
                    this._show(this.vatRates.filter((r) => r.vatRateId !== vatRate.vatRateId));
                }
            },
            error: (err: HttpErrorResponse) => this._showError(err)
        });
    }

    /** "1576 - Input VAT 19%", or a dash when the rate has no account. */
    account(code: string | null, name: string | null): string {
        return code ? code + ' - ' + name : '-';
    }

    trackByFn(index: number, item: VatRate): number {
        return item.vatRateId || index;
    }

    private _filter(): VatRateFilter {
        const page = new Paging();
        page.flag = false;
        page.length = 0;
        page.pageNumber = 1;
        page.pageSize = PAGE_SIZE;
        page.sort = 'changeDate';
        page.order = 'desc';
        return { statusIdList: this.statusControl.value || [], page };
    }

    private _show(vatRates: VatRate[]): void {
        // Latest first: most recently added or changed on top (newest id breaks a tie).
        this.vatRates = [...(vatRates || [])].sort((a, b) =>
            this._time(b.changeDate) - this._time(a.changeDate) || b.vatRateId - a.vatRateId);
        this.errorMessage = null;
        this.isLoading = false;
        this._changeDetectorRef.markForCheck();
    }

    private _time(value: string | null): number {
        return value ? new Date(value).getTime() : 0;
    }

    private _showError(err: HttpErrorResponse): void {
        this.errorMessage = (err && err.error && err.error.detail) || (err && err.message) || 'Could not load the VAT rates';
        this.isLoading = false;
        this._changeDetectorRef.markForCheck();
    }
}
