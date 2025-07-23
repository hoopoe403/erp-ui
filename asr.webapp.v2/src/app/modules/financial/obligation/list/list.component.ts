import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { Subject, Observable, forkJoin, fromEvent, merge } from 'rxjs';
import { fuseAnimations } from "../../../../../@fuse/animations";
import { ObligationService } from "../obligation.service";
import { Obligation } from "../obligation.types";
import { Paging } from 'app/core/type/paging/paging.type';
import { FormControl, FormGroup } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
import { debounceTime, distinctUntilChanged, map, takeUntil, switchMap } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
@Component({
    selector: 'obligation-list',
    templateUrl: './list.component.html',
    styles: [
        /* language=SCSS */
        `
            .obligations-grid {
                grid-template-columns:100px auto 150px 370px 150px 150px 70px;

                @screen sm {
                    grid-template-columns:100px auto 100px 70px;
                }

                @screen md {
                    grid-template-columns: 100px auto 150px 370px 150px 150px 70px;
                }

                @screen lg {
                    grid-template-columns: 280px auto  280px 280px 150px 70px;
                }
                @screen print{
                    grid-template-columns: 100px 370px 370px 70px;
                }
            }
        `
    ],
    animations: fuseAnimations,
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ObligationListComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild('paginator') _paginator: MatPaginator;
    @ViewChild('sort') private _sort: MatSort;
    protected _onDestroy = new Subject<void>();
    pagination: Paging;
    selection = new SelectionModel<any>(true, []);
    obligationInfo: Obligation;
    statuses = [];
    menuArray = [];
    selectedCat: number = 0;
    defaultStatuses = [];
    frmAdvancedSearch = new FormGroup({
        status: new FormControl(),
        pledger: new FormControl(),
        pledgee: new FormControl(),
    });



    searchInputControl: FormControl = new FormControl();

    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
    @ViewChild('filter', { static: true }) filter: ElementRef;
    // Private
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    isLoading: boolean;


    constructor(private service: ObligationService,
        private cdr: ChangeDetectorRef,
        private _changeDetectorRef: ChangeDetectorRef) {
        this.pagination = new Paging();
        this.obligationInfo = new Obligation();
        this.obligationInfo.statusIdList = [];
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------
    isOverlayOpen: boolean = true;
    selectedInfoRow: Obligation = new Obligation();

    obligations$: Observable<Obligation[]>;

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
        fromEvent(this.filter.nativeElement, 'keyup')
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(150),
                distinctUntilChanged()
            )
            .subscribe(() => {
                if (!this.obligations$)
                    return;

                let value: string = this.filter.nativeElement.value.toLowerCase();

                this.obligations$ = this.service.obligations$.pipe(
                    map(obligations => obligations.filter(x =>
                        x.obligationTypeName.toLowerCase().includes(value) ||
                        x.pledgerTypeName.toLowerCase().toLowerCase().includes(value) ||
                        x.pledgerName.toLowerCase().toLowerCase().includes(value) ||
                        x.pledgeeTypeName.toLowerCase().toLowerCase().includes(value) ||
                        x.pledgeeName.toLowerCase().toLowerCase().includes(value) ||
                        x.status.toString().includes(value)))
                );
                this.obligations$.subscribe();
            });
        this.loadData();
    }
    ngAfterViewInit(): void {
        this.setPaginatorAndSort();
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
        this.service.disposeObligations$();

    }
    private setForkJoinValues(values: Array<any>): void {
        this.obligations$ = this.service.obligations$;
        this.statuses = values[1].data;
        this.defaultStatuses = [];
        this.statuses.forEach((element) => {
            if (element.isDefault === 1) this.defaultStatuses.push(element.statusId);
        });
        this.frmAdvancedSearch.controls["status"].setValue(this.defaultStatuses);
        this._changeDetectorRef.markForCheck();
        this.cdr.detectChanges();
    }
    private loadData(): void {
        forkJoin(
            this.getObligationsOnInit(),
            this.getStatuses(),
        ).subscribe(res => {
            this.setForkJoinValues(res);
            this.isLoading = false;
            this.cdr.detectChanges();
        });
    }


    private setPaginatorAndSort(): void {
        if (this._sort && this._paginator) {
            this._sort.sort({
                id: '',
                start: 'desc',
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
                    this.pagination.pageNumber = this._paginator.pageIndex;
                    this.obligationInfo.page = this.pagination;
                    return this.service.getObligations(this.obligationInfo);

                }),
                map(() => {
                    this.isLoading = false;
                    this._changeDetectorRef.markForCheck();
                    this.cdr.detectChanges();
                })
            ).subscribe((res: any) => {
                this.obligationInfo.page = this.pagination;
                this._changeDetectorRef.markForCheck();
                this.cdr.detectChanges();
            });
        }
    }
    private getObligationsOnInit(): Observable<any> {
        this.pagination = new Paging();
        this.pagination.flag = true;
        this.pagination.length = 0;
        this.pagination.order = 'desc';
        this.pagination.pageNumber = 0;
        this.pagination.pageSize = 100;
        this.pagination.sort = '';
        this.obligationInfo.page = this.pagination;
        return this.service.getObligationInOnInit(this.obligationInfo);
    }

    private getObligations(obligationInfo: Obligation) {
        this.isLoading = true;
        this.service
            .getObligations(obligationInfo)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((obligations: any) => {
                this.obligations$ = this.service.obligations$;
                this.isLoading = false;
                this._changeDetectorRef.markForCheck();
                this.cdr.detectChanges();
            });
    }
    private getStatuses(): Observable<any> {
        return this.service.getStatuses();
    }
    setStatusValue(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            if (event.source.value != 0 && event.source.selected) {
                this.obligationInfo.statusIdList.push(event.source.value);

            }
            else if (event.source.value != 0 && !event.source.selected) {
                const index: number = this.obligationInfo.statusIdList.indexOf(event.source.value);
                if (index !== -1)
                    this.obligationInfo.statusIdList.splice(index, 1);
                this.frmAdvancedSearch.controls["status"].setValue(this.obligationInfo.statusIdList);
            }
        }


    }
    search() {
        this.obligationInfo.pledgerName =
            this.frmAdvancedSearch.controls["pledger"].value;
        this.obligationInfo.pledgeeName =
            this.frmAdvancedSearch.controls["pledgee"].value;
        this.pagination.flag = true;
        this.pagination.pageNumber = 0;
        this.pagination.length = 0;
        this.getObligations(this.obligationInfo);
    }
    resetAdvancedSearch() {
        this.frmAdvancedSearch.controls["pledger"].setValue(null);
        this.frmAdvancedSearch.controls["pledgee"].setValue(null);
        this.frmAdvancedSearch.controls["status"].setValue(this.defaultStatuses);
    }

    trackByFn(index: number, item: any): any {
        return item.id || index;
    }

}