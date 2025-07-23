import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Subject, merge, Observable, forkJoin } from 'rxjs';
import { debounceTime, switchMap, map, distinctUntilChanged } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';
import { fuseAnimations } from "../../../../../../@fuse/animations";
import { ProductService } from "../product.service";
import { Product } from "../product.types";
import { Paging } from 'app/core/type/paging/paging.type';
import { FormControl, FormGroup } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
import { KeyValue } from 'app/core/type/key-value/key-value.type';
@Component({
    selector: 'products-list',
    templateUrl: './list.component.html',
    styles: [
        /* language=SCSS */
        `
            .products-grid {
                grid-template-columns:150px auto 100px 200px 70px;

                @screen sm {
                    grid-template-columns:112px auto 100px 70px;
                }

                @screen md {
                    grid-template-columns: 112px auto 150px 370px 150px 70px;
                }

                @screen lg {
                    grid-template-columns: 150px auto 100px 200px 70px;
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
export class ProductListComponent implements OnInit, OnDestroy {

    brands: Array<KeyValue> = [];
    protected _onDestroy = new Subject<void>();
    @ViewChild('paginator') _paginator: MatPaginator;
    @ViewChild('sort') private _sort: MatSort;
    pagination: Paging;
    productInfo: Product;
    statuses = [];
    defaultStatuses = [];
    frmAdvancedSearch = new FormGroup({
        brand: new FormControl(),
        productCode: new FormControl(),
        productName: new FormControl(),
    });


    searchInputControl: FormControl = new FormControl();

    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;

    // Private
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    isLoading: boolean;

    constructor(private service: ProductService,
        private cdr: ChangeDetectorRef,
        private _changeDetectorRef: ChangeDetectorRef) {
        //this._unsubscribeAll = new Subject();
        this.productInfo = new Product();
        this.productInfo.brandIds = [];
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------
    isOverlayOpen: boolean = true;
    selectedInfoRow: Product = new Product();

    products: Array<Product> = [];
    /**
     * On init
     */
    get products$(): Observable<Product[]> {
        return this.service.products$;
    }

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
                debounceTime(150),
                distinctUntilChanged()
            )
            .subscribe(() => {
                if (!this.products$)
                    return;
                let value: string = this.searchInputControl.value.toLowerCase();
                this.products$.subscribe(items => {
                    this.products = items.filter(x => x.productCode.includes(value)
                        /*  || x.remittanceCode.includes(value)
                         || x.customerNameFamily.toLowerCase().includes(value)
                         || x.regLocalDate.includes(value)
                         || x.orderTypeName.toLowerCase().includes(value)
                         || x.warehouseName.toLowerCase().includes(value)
                         || x.rowQuantity.toString().includes(value)
                         || x.productQuantity.toString().includes(value)*/
                        || x.brandName.toLowerCase().includes(value));
                    this.cdr.detectChanges();
                })

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
                    this.productInfo.page = this.pagination;
                    return this.service.getProducts(this.productInfo);

                }),
                map(() => {
                    this.isLoading = false;
                    this._changeDetectorRef.markForCheck();
                    this.cdr.detectChanges();
                })
            ).subscribe(res => {
                this._changeDetectorRef.markForCheck();
                this.cdr.detectChanges();
            });
        }
    }



    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
        this.service.disposeProducts$();
        this.service.disposePaginator$();

    }
    private setForkJoinValues(values: Array<any>): void {

        this._changeDetectorRef.markForCheck();
        this.products = values[0].data.products;
        this.cdr.detectChanges();
    }
    private loadData(): void {
        this.getBrands();
        forkJoin(
            this.getProductsOnInit(),
        ).subscribe(res => {
            this.setForkJoinValues(res);
            this.setPaginatorAndSort();
            this.isLoading = false;
            this.cdr.detectChanges();
        });
    }


    private getBrands(): void {
        this.service.getBrands().subscribe(res => {
            this.brands = res.data;
        });
    }

    setStatusValue(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            if (event.source.value != 0 && event.source.selected) {
                this.productInfo.statusIdList.push(event.source.value);

            }
            else if (event.source.value != 0 && !event.source.selected) {
                const index: number = this.productInfo.statusIdList.indexOf(event.source.value);
                if (index !== -1)
                    this.productInfo.statusIdList.splice(index, 1);
                this.frmAdvancedSearch.controls["status"].setValue(this.productInfo.statusIdList);
            }
        }


    }
    private getProducts(productInfo: Product) {
        this.isLoading = true;
        this.service.getProducts(productInfo)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((products: any) => {
                this.products = products.data.products;
                this.productInfo.page = this.pagination;
                this._changeDetectorRef.markForCheck();
                this.cdr.detectChanges();
                this.isLoading = false;
            });
    }

    private getProductsOnInit(): Observable<any> {
        this.pagination = new Paging();
        this.pagination.flag = true;
        this.pagination.length = 0;
        this.pagination.order = 'desc';
        this.pagination.pageNumber = 1;
        this.pagination.pageSize = 100;
        this.pagination.sort = '';
        this.productInfo.page = this.pagination;
        return this.service.geProductsOnInit(this.productInfo);
    }
    public productsSearch() {

        this.getFormInfo();
        this.pagination = new Paging();
        this.pagination.flag = true;
        this.pagination.length = 0;
        this.pagination.order = 'desc';
        this.pagination.pageNumber = 1;
        this.pagination.pageSize = 100;
        this.pagination.sort = '';
        this.productInfo.page = this.pagination;
        this.getFormInfo();
        this.getProducts(this.productInfo);


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


    changeAllBrands() {
        this.setAllBrands();
    }
    setAllBrands() {

        if (this.brands.length == this.productInfo.brandIds.length) {
            this.productInfo.brandIds = [];
        } else {
            this.productInfo.brandIds = this.brands.map(x => x.key);
        }

    }
    setBrand(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {
        if (event.isUserInput)
            if (event.source.selected)
                this.productInfo.brandIds.push(event.source.value);
            else {
                const indx = this.productInfo.brandIds.findIndex(x => x == event.source.value);
                this.productInfo.brandIds.splice(indx, 1);
            }

    }


    getFormInfo() {
        if (this.frmAdvancedSearch.valid) {
            this.productInfo.productCode = this.frmAdvancedSearch.controls['productCode'].value;
            this.productInfo.productName = this.frmAdvancedSearch.controls['productName'].value;
        }
    }

}


