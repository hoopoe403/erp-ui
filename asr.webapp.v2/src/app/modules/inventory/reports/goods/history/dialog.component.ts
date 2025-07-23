import { ChangeDetectorRef, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { GoodsInventoryHistoryDialogConfig } from './dialog.types';
import { GoodsInventoryService } from '../goods-inventory.service';
import { GoodsInventoryHistory } from '../goods-inventory.types';
import { FuseAlertService } from '@fuse/components/alert';
import { OpResult } from 'app/core/type/result/result.types';
import { forkJoin, fromEvent, merge, Observable, of, Subject, Subscription } from 'rxjs';
import { filter, map, switchMap, takeUntil, debounceTime, distinctUntilChanged, take } from 'rxjs/operators';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { HistoryDialogService } from './dialog.service';
import { Paging } from 'app/core/type/paging/paging.type';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

@Component({
    selector: 'goods-inventory-history',
    templateUrl: './dialog.component.html',
    encapsulation: ViewEncapsulation.None,
    styles: [
        /* language=SCSS */
        `
            .goods-inventory-his-grid {
                grid-template-columns:180px  120px auto 250px 120px;

                @screen sm {
                    grid-template-columns:auto 100px  100px 70px;
                }

                @screen md {
                    grid-template-columns: auto 100px  100px 70px;
                }

                @screen lg {
                    grid-template-columns: 180px  120px auto 250px 120px;
                }
                @screen print{
                    grid-template-columns: 100px 370px 370px 70px;
                }
            }
        `
    ]
})
export class GoodsInventoryHistoryDialogComponent implements OnInit, OnDestroy {
    /**
     * Constructor
     */
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;
    private goodsInventoryHistoryInfo: GoodsInventoryHistory;
    pagination: Paging;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    @ViewChild('filter', { static: true }) filter: ElementRef;
    goodsInventoryHistory$: Observable<GoodsInventoryHistory[]>;
    warehouseInventoryId: number = 0;
    isDataLoading: boolean;
    _result: OpResult = new OpResult();
    confirmResult: boolean = false;
    searchInputControl: FormControl = new FormControl();
    constructor(private service: GoodsInventoryService,
        private _fuseAlertService: FuseAlertService,
        private cdr: ChangeDetectorRef,
        private _formBuilder: FormBuilder,
        private dialogService: HistoryDialogService,
        @Inject(MAT_DIALOG_DATA) public data: GoodsInventoryHistoryDialogConfig,
        public matDialogRef: MatDialogRef<GoodsInventoryHistoryDialogComponent>
    ) {
        this.warehouseInventoryId = data.warehouseInventoryId;
        this.goodsInventoryHistoryInfo = new GoodsInventoryHistory();
        this.goodsInventoryHistoryInfo.warehouseIds = [];
        this.goodsInventoryHistoryInfo.coverIds = [];
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        this.service.historyPagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: Paging) => {

                // Update the pagination
                this.pagination = pagination;

                // Mark for check
                this.cdr.markForCheck();
            });
        fromEvent(this.filter.nativeElement, 'keyup')
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(150),
                distinctUntilChanged()
            )
            .subscribe(() => {

                if (!this.goodsInventoryHistory$)
                    return;
                let query: string = this.filter.nativeElement.value.toLowerCase();

                this.service.goodsInventoryHistory$.pipe(map(items => items.filter(x =>
                    x.localChangeTime?.toLowerCase().includes(query) ||
                    x.goodsCode.toLowerCase().includes(query) ||
                    x.goodsName.toLowerCase().includes(query) ||
                    x.localChangeDate.toString().includes(query) ||
                    x.coverName.toString().includes(query) ||
                    x.unitName.toLowerCase().includes(query) ||
                    x.warehouseName.toString().includes(query)))).subscribe(elements => {
                        this.goodsInventoryHistory$ = of(elements as GoodsInventoryHistory[]);
                        this.cdr.markForCheck();
                        this.cdr.detectChanges();
                    });


            });


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
            this.cdr.markForCheck();

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
                    this.isDataLoading = true;
                    this.pagination.length = this._paginator.length;
                    this.pagination.pageSize = this._paginator.pageSize;
                    this.pagination.pageNumber = this._paginator.pageIndex + 1;
                    this.pagination.flag = false;
                    this.pagination.order = this._sort.direction == null ? 'desc' : this._sort.direction;
                    this.pagination.sort = this._sort.active == null ? '' : this._sort.active;
                    this.goodsInventoryHistoryInfo.page = this.pagination;
                    return this.service.getGoodsInventory(this.goodsInventoryHistoryInfo);
                }),
                map(() => {
                    this.isDataLoading = false;
                })
            ).subscribe();
        }
    }
    private setForkJoinValues(values: Array<any>): void {

        this.goodsInventoryHistory$ = this.service.goodsInventoryHistory$;
        this.setPaginatorAndSort();
    }
    private loadData() {
        this.isDataLoading = true;
        this.cdr.detectChanges();
        forkJoin(
            this.getHistory(this.warehouseInventoryId),
        ).subscribe(res => {
            this.setForkJoinValues(res);
            this.isDataLoading = false;
            this.cdr.detectChanges();
        });
    }

    private getHistory(warehouseInventoryId: number): Observable<any> {
        this.goodsInventoryHistoryInfo.warehouseInventoryId = warehouseInventoryId;
        this.pagination = new Paging();
        this.pagination.flag = true;
        this.pagination.length = 0;
        this.pagination.order = 'desc';
        this.pagination.pageNumber = 1;
        this.pagination.pageSize = 100;
        this.pagination.sort = '';
        this.goodsInventoryHistoryInfo.page = this.pagination;
        return this.service.getInventortHistory(this.goodsInventoryHistoryInfo);
    }


    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
        this.service.disposegoodsInventoryHistory$();
        this.service.disponseHistoryPaginator$();

    }
    closeDialog() {
        this.matDialogRef.close(this.confirmResult);
    }
    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

}
