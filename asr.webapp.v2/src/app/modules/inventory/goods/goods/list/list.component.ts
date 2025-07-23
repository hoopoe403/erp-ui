import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { fromEvent, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';
import { fuseAnimations } from "../../../../../../@fuse/animations";
import { Router } from "@angular/router";
import { GoodsService } from "../goods.service";
import { Goods } from "../goods.types";
import { Paging } from 'app/core/type/paging/paging.type';
import { FormControl, FormGroup } from '@angular/forms';
import { Units } from 'app/modules/configuration/measurement/unit/unit.types';
import { HierarchicalKeyValue } from 'app/core/type/key-value/key-value.type';
import { MatMenuTrigger } from '@angular/material/menu';

@Component({
    selector: 'goods-list',
    templateUrl: './list.component.html',
    styles: [
        /* language=SCSS */
        `
            .goods-grid {
                grid-template-columns:112px 370px auto 96px 70px 70px;

                @screen sm {
                    grid-template-columns:112px auto 96px 70px;
                }

                @screen md {
                    grid-template-columns: 112px 370px auto 96px 70px;
                }

                @screen lg {
                    grid-template-columns: 112px 370px auto 96px 70px 70px;
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
export class GoodsListComponent implements OnInit, OnDestroy {
    selection = new SelectionModel<any>(true, []);
    goodsInfo: Goods;
    _paging: Paging;
    length: number;
    pageSize: number;
    pageIndex: number;
    massUnitData: Array<Units>;
    menuArray = [];
    selectedCat: number = 0;
    frmAdvancedSearch = new FormGroup({
        name: new FormControl(),
        code: new FormControl(),
        orderDeadline: new FormControl(),
        technicalNumber: new FormControl(),
        status: new FormControl(),
        weightUnit: new FormControl(),
        weight: new FormControl()
    });
    @ViewChild(MatPaginator, { static: true })
    paginator: MatPaginator;

    @ViewChild('filter', { static: true })
    filter: ElementRef;

    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;

    @ViewChild(MatSort, { static: true })
    sort: MatSort;

    // Private
    private _unsubscribeAll: Subject<any>;
    isLoading: boolean;

    constructor(private goodsService: GoodsService, private router: Router,
        private _changeDetectorRef: ChangeDetectorRef) {
        // Set the private defaults
        this._unsubscribeAll = new Subject();
        this._paging = new Paging();
        this.goodsInfo = new Goods;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------
    isOverlayOpen: boolean = true;
    selectedInfoRow: Goods = new Goods;

    goods$: Array<Goods> = [];
    goods: Array<Goods> = [];
    /**
     * On init
     */
    ngOnInit(): void {
        this.pageSize = 100;
        this.pageIndex = 0;
        this.getGoods(this.goodsInfo, this.pageSize, this.pageIndex, true);


        this.getUnits();
        this.getGoodsCat();

        fromEvent(this.filter.nativeElement, 'keyup')
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(150),
                distinctUntilChanged()
            )
            .subscribe(() => {
                if (!this.goods) {
                    return;
                }
                this.goods$ = this.goods.filter(item =>
                    item.goodsName.toLowerCase().includes(this.filter.nativeElement.value.toLowerCase()));
            });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }


    private getUnits() {
        this.goodsService.getUnits().subscribe(res => {
            this.massUnitData = res.data.filter(x => x.measurementMetricId === 1000692);
        });
    }

    private getGoods(goodsInfo: Goods, pageSize: number, pageNumber: number, flag: boolean) {

        this.isLoading = true;
        this._paging.pageSize = pageSize;
        this._paging.pageNumber = pageNumber + 1;
        this._paging.length = this.length;
        this._paging.flag = flag;
        goodsInfo.page = this._paging;
        this.goodsService.getGoods(goodsInfo)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((goods: any) => {
                this.goods = goods.data.goods;
                this.goods$ = goods.data.goods;
                this.length = goods.data.page.length;
                this._changeDetectorRef.markForCheck();
                this.isLoading = false;
            });
    }
    public goodsSearch() {


        this.goodsInfo.goodsCode = this.frmAdvancedSearch.controls["code"].value;
        this.goodsInfo.goodsName = this.frmAdvancedSearch.controls["name"].value;
        this.goodsInfo.technicalNumber = this.frmAdvancedSearch.controls["technicalNumber"].value;
        this.goodsInfo.objectWeight = this.frmAdvancedSearch.controls["weight"].value;
        this.goodsInfo.weightUnitId = this.frmAdvancedSearch.controls["weightUnit"].value;
        this.goodsInfo.orderDeadline = this.frmAdvancedSearch.controls["orderDeadline"].value;
        this.goodsInfo.categoryId = this.selectedCat;
        this.goodsInfo.status = this.frmAdvancedSearch.controls["status"].value;

        this.pageSize = 100;
        this.pageIndex = 0;
        this.getGoods(this.goodsInfo, this.pageSize, this.pageIndex, true);
    }

    private resetGoodsCatBotton() {
        let obj = new HierarchicalKeyValue();
        obj.id = this.menuArray[0].id;
        obj.item = this.menuArray[0].item;
        obj.parentId = this.menuArray[0].parentId;
        obj.children = [];
        for (var i = 0; i < this.menuArray[0].children.length; i++) {
            obj.children.push(this.menuArray[0].children[i]);
        }
        this.menuArray = [];
        this.menuArray.push(obj);
        this.selectedCat = 0;
    }

    private addSelectanItemToCatMenu() {
        let obj = new HierarchicalKeyValue();
        obj.id = 0;
        obj.item = "Select a category";
        obj.parentId = -1;
        obj.children = [];
        for (var i = 0; i < this.menuArray.length; i++) {
            obj.children.push(this.menuArray[i]);
        }
        this.menuArray = [];
        this.menuArray.push(obj);
    }

    private getGoodsCat() {
        return this.goodsService.getGoodsCatgories()
            .subscribe(res => {
                this.menuArray = res.data;
                this.addSelectanItemToCatMenu();
            })
    }
    public setSelectedCat(selectedId: number) {

        this.selectedCat = selectedId;
        if (selectedId > 0)
            this.trigger.closeMenu();
    }
    public resetAdvancedSearch() {
        this.frmAdvancedSearch.controls["code"].setValue(null);
        this.frmAdvancedSearch.controls["name"].setValue(null);
        this.frmAdvancedSearch.controls["orderDeadline"].setValue(null);
        this.frmAdvancedSearch.controls["status"].setValue(null);
        this.frmAdvancedSearch.controls["weight"].setValue(null);
        this.frmAdvancedSearch.controls["weightUnit"].setValue(null);
        this.resetGoodsCatBotton();

    }

    handlePageEvent(event: PageEvent) {

        this.length = event.length;
        this.pageSize = event.pageSize;
        this.pageIndex = event.pageIndex;

        this.getGoods(this.goodsInfo, this.pageSize, this.pageIndex, false);
    }
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }

}


