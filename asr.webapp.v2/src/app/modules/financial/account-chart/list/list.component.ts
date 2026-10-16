import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { Subject, merge, Observable } from 'rxjs';
import { debounceTime, switchMap, map } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';
import { fuseAnimations } from "../../../../../@fuse/animations";
import { AccountChartService } from "../account-chart.service";
import { AccountChart, AccountChartFilter, AccountChartListResponse } from "../account-chart.types";
import { Paging } from 'app/core/type/paging/paging.type';
import { FormControl, FormGroup } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';

@Component({
    selector: 'account-chart-list',
    templateUrl: './list.component.html',
    styles: [
        /* language=SCSS */
        `
            .account-charts-grid {
                grid-template-columns:112px auto 40px;

                @screen sm {
                    grid-template-columns:112px auto 100px 70px;
                }

                @screen md {
                    grid-template-columns: 112px auto 150px 370px 150px 70px;
                }

                @screen lg {
                    grid-template-columns: 150px auto 150px 300px 70px 70px;
                }
                @screen print{
                    grid-template-columns: 112px 370px 370px 70px;
                }
            }
        `
    ],
    animations: fuseAnimations,
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountChartListComponent implements OnInit, OnDestroy {
    protected _onDestroy = new Subject<void>();
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;
    pagination: Paging;
    selection = new SelectionModel<any>(true, []);
    accountChartFilter: AccountChartFilter = { statusIdList: [] };
    statuses = [];
    defaultStatuses = [];
    frmAdvancedSearch = new FormGroup({
        code: new FormControl(),
        name: new FormControl(),
        status: new FormControl(),
    });


    searchInputControl: FormControl = new FormControl();

    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;

    // Private
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    isLoading: boolean;

    constructor(private service: AccountChartService,
        private cdr: ChangeDetectorRef,
        private _changeDetectorRef: ChangeDetectorRef) {
        //this._unsubscribeAll = new Subject();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------
    isOverlayOpen: boolean = true;
    selectedInfoRow: AccountChart = {} as AccountChart;

    accountCharts$: Observable<AccountChart[]> = new Observable<AccountChart[]>();
    /**
     * On init
     */
    ngOnInit(): void {
        this.isLoading = true;
        this.service.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: Paging) => {

                // Update the pagination
                this.pagination = pagination;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        this.searchInputControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.isLoading = true;
                    return this.service.getAccountCharts(this.accountChartFilter);
                }),
                map(() => {
                    this.isLoading = false;
                })
            )
            .subscribe();
        this.loadData();
    }

    private setPaginatorAndSort(): void {
        if (this._sort && this._paginator) {
            // Set the initial sort
            this._sort.sort({
                id: '',
                start: 'asc',
                disableClear: true
            });

            // Mark for check
            this._changeDetectorRef.markForCheck();

            // If the user changes the sort order...
            this._sort.sortChange
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe(() => {
                    // Reset back to the first page
                    this._paginator.pageIndex = 0;


                });

            // Get products if sort or page changes
            merge(this._sort.sortChange, this._paginator.page).pipe(
                switchMap(() => {
                    this.isLoading = true;
                    this.pagination.order = this._sort.direction;
                    this.pagination.sort = this._sort.active;
                    this.accountChartFilter.page = this.pagination;
                    return this.service.getAccountCharts(this.accountChartFilter);
                }),
                map(() => {
                    this.isLoading = false;
                })
            ).subscribe();
        }
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
        this.service.disposeAccountCharts$();
        this.service.disponsePaginator$();

    }

    /** Loads the statuses first: the first list call filters on the statuses flagged as default. */
    private loadData(): void {
        this.service.getAccountChartStatuses().pipe(
            switchMap((statuses: any[]) => {
                this.setStatuses(statuses);
                return this.getAccountChartsOnInit();
            })
        ).subscribe(() => {
            this.accountCharts$ = this.service.accountCharts$;
            this.isLoading = false;
            this._changeDetectorRef.markForCheck();
            this.cdr.detectChanges();
            this.setPaginatorAndSort();
        });
    }

    private setStatuses(statuses: any[]): void {
        this.statuses = statuses;
        this.defaultStatuses = [];
        this.statuses.forEach(element => {
            if (element.isDefault === 1)
                this.defaultStatuses.push(element.statusId);
        });
        this.frmAdvancedSearch.controls["status"].setValue(this.defaultStatuses);
        this.accountChartFilter.statusIdList = this.defaultStatuses;
    }

    setStatusValue(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            if (event.source.value != 0 && event.source.selected) {
                this.accountChartFilter.statusIdList.push(event.source.value);

            }
            else if (event.source.value != 0 && !event.source.selected) {
                const index: number = this.accountChartFilter.statusIdList.indexOf(event.source.value);
                if (index !== -1)
                    this.accountChartFilter.statusIdList.splice(index, 1);
                this.frmAdvancedSearch.controls["status"].setValue(this.accountChartFilter.statusIdList);
            }
        }


    }
    private getAccountCharts(accountChartFilter: AccountChartFilter) {
        this.isLoading = true;
        this.service.getAccountCharts(accountChartFilter)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(() => {
                this.accountCharts$ = this.service.accountCharts$;
                this._changeDetectorRef.markForCheck();
                this.cdr.detectChanges();
                this.isLoading = false;
            });
    }

    private getAccountChartsOnInit(): Observable<AccountChartListResponse> {
        this.pagination = new Paging();
        this.pagination.flag = true;
        this.pagination.length = 0;
        // No sort column + ascending = the backend's default FULL_CODE order: parents before their children.
        this.pagination.order = 'asc';
        this.pagination.pageNumber = 1;
        this.pagination.pageSize = 100;
        this.pagination.sort = '';
        this.accountChartFilter.page = this.pagination;
        return this.service.getAccountCharts(this.accountChartFilter);
    }
    public accountChartsSearch() {

        this.accountChartFilter.accountChartCode = this.frmAdvancedSearch.controls["code"].value;
        this.accountChartFilter.accountChartName = this.frmAdvancedSearch.controls["name"].value;
        this.accountChartFilter.statusIdList = this.frmAdvancedSearch.controls["status"].value;
        this.pagination.flag = true;
        this.pagination.pageNumber = 1;
        this.pagination.length = 0;
        this.accountChartFilter.page = this.pagination;
        this.getAccountCharts(this.accountChartFilter);
    }


    public resetAdvancedSearch() {
        this.frmAdvancedSearch.controls["code"].setValue(null);
        this.frmAdvancedSearch.controls["name"].setValue(null);
        this.frmAdvancedSearch.controls["status"].setValue(this.defaultStatuses);

    }

    handlePageEvent(event: PageEvent) {

        this.pagination.length = event.length;
        this.pagination.pageSize = event.pageSize;
        this.pagination.pageNumber = event.pageIndex + 1;
        this.pagination.flag = false;
    }
    trackByFn(index: number, item: any): any {
        return item.accountChartId || index;
    }

}
