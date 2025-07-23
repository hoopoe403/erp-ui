import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { Subject, merge, Observable, forkJoin } from 'rxjs';
import { debounceTime, switchMap, map } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';
import { fuseAnimations } from "../../../../../@fuse/animations";
import { FinancialCategoryService } from "../category.service";
import { FinancialCategory } from "../category.types";
import { Paging } from 'app/core/type/paging/paging.type';
import { FormControl, FormGroup } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';

@Component({
    selector: 'categories-list',
    templateUrl: './list.component.html',
    styles: [
        /* language=SCSS */
        `
            .categories-grid {
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
export class CategoryListComponent implements OnInit, OnDestroy {
    protected _onDestroy = new Subject<void>();
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;
    pagination: Paging;
    selection = new SelectionModel<any>(true, []);
    categoryInfo: FinancialCategory;
    statuses = [];
    defaultStatuses = [];
    frmAdvancedSearch = new FormGroup({
        code: new FormControl(),
        name: new FormControl(),
        parentCode: new FormControl(),
        parentName: new FormControl(),
        status: new FormControl(),
    });


    searchInputControl: FormControl = new FormControl();

    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;

    // Private
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    isLoading: boolean;

    constructor(private service: FinancialCategoryService,
        private cdr: ChangeDetectorRef,
        private _changeDetectorRef: ChangeDetectorRef) {
        //this._unsubscribeAll = new Subject();

        this.categoryInfo = new FinancialCategory;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------
    isOverlayOpen: boolean = true;
    selectedInfoRow: FinancialCategory = new FinancialCategory();

    categories$: Observable<FinancialCategory[]> = new Observable<FinancialCategory[]>();
    categories: Array<FinancialCategory> = [];
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

        //this.categories$ = this.service.categories$;

        this.searchInputControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(300),
                switchMap((query) => {
                    this.isLoading = true;
                    return this.service.getCategories(this.categoryInfo);
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
                    this.categoryInfo.page = this.pagination;
                    return this.service.getCategories(this.categoryInfo);
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
        this.service.disposeCategories$();
        this.service.disponsePaginator$();

    }
    private setForkJoinValues(values: Array<any>): void {
        this.statuses = values[0].data;
        this.defaultStatuses = [];
        this.statuses.forEach(element => {
            if (element.isDefault === 1)
                this.defaultStatuses.push(element.statusId);
        });
        this.frmAdvancedSearch.controls["status"].setValue(this.defaultStatuses);
        this.categoryInfo.statusIdList = this.defaultStatuses;
        this.categories = values[1].data.categories;
        this.categories$ = this.service.categories$;
        this._changeDetectorRef.markForCheck();
        this.cdr.detectChanges();
        this.setPaginatorAndSort();
    }
    private loadData(): void {
        forkJoin(
            this.getStatuses(),
            this.getCategoriesOnInit(),
        ).subscribe(res => {
            this.setForkJoinValues(res);
            this.isLoading = false;
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
                this.categoryInfo.statusIdList.push(event.source.value);

            }
            else if (event.source.value != 0 && !event.source.selected) {
                const index: number = this.categoryInfo.statusIdList.indexOf(event.source.value);
                if (index !== -1)
                    this.categoryInfo.statusIdList.splice(index, 1);
                this.frmAdvancedSearch.controls["status"].setValue(this.categoryInfo.statusIdList);
            }
        }


    }
    private getCategories(categoryInfo: FinancialCategory) {
        this.isLoading = true;
        this.service.getCategories(categoryInfo)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((categories: any) => {
                this.categories = categories.data.categories;
                this.categories$ = this.service.categories$;
                this._changeDetectorRef.markForCheck();
                this.cdr.detectChanges();
                this.isLoading = false;
            });
    }

    private getCategoriesOnInit(): Observable<any> {
        this.pagination = new Paging();
        this.pagination.flag = true;
        this.pagination.length = 0;
        this.pagination.order = 'desc';
        this.pagination.pageNumber = 1;
        this.pagination.pageSize = 100;
        this.pagination.sort = '';
        this.categoryInfo.page = this.pagination;
        return this.service.getCategoriesInOnInit(this.categoryInfo);
    }
    public categoriesSearch() {

        // this.expenseInfo.financialCategoryId = this.selectedCat;
        this.categoryInfo.financialCategoryCode = this.frmAdvancedSearch.controls["code"].value;
        this.categoryInfo.financialCategoryName = this.frmAdvancedSearch.controls["name"].value;
        this.categoryInfo.parentCode = this.frmAdvancedSearch.controls["parentCode"].value;
        this.categoryInfo.parentName = this.frmAdvancedSearch.controls["parentName"].value;
        this.categoryInfo.statusIdList = this.frmAdvancedSearch.controls["status"].value;
        this.pagination.flag = true;
        this.pagination.pageNumber = 1;
        this.pagination.length = 0;
        this.categoryInfo.page = this.pagination;
        this.getCategories(this.categoryInfo);
    }


    public resetAdvancedSearch() {
        this.frmAdvancedSearch.controls["code"].setValue(null);
        this.frmAdvancedSearch.controls["name"].setValue(null);
        this.frmAdvancedSearch.controls["parentCode"].setValue(null);
        this.frmAdvancedSearch.controls["parentName"].setValue(null);
        this.frmAdvancedSearch.controls["status"].setValue(this.defaultStatuses);

    }

    handlePageEvent(event: PageEvent) {

        this.pagination.length = event.length;
        this.pagination.pageSize = event.pageSize;
        this.pagination.pageNumber = event.pageIndex + 1;
        this.pagination.flag = false;
    }
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }

}


