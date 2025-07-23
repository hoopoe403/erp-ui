import { ChangeDetectorRef, Component, ElementRef, Injectable, OnDestroy, AfterViewInit, OnInit, ViewChild, ViewEncapsulation, HostListener } from '@angular/core';
import { OpResult } from '../../../../../core/type/result/result.types';
import { fuseAnimations } from "../../../../../../@fuse/animations";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { animate, state, style, transition, trigger } from "@angular/animations";
import { GoodsService } from "../goods.service";
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { debounceTime, distinctUntilChanged, map, takeUntil, switchMap } from 'rxjs/operators';
import { BehaviorSubject, fromEvent, Observable, Subject, merge, forkJoin } from 'rxjs';
import { FuseAlertService } from '@fuse/components/alert';
import { Goods } from '../goods.types';
import { HierarchicalKeyValue, Measure, KeyValue, GoodsMeasure } from 'app/core/type/key-value/key-value.type';
import { Units } from 'app/modules/configuration/measurement/unit/unit.types';
import { Paging } from 'app/core/type/paging/paging.type';
import { MatPaginator } from '@angular/material/paginator';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { SelectionModel } from '@angular/cdk/collections';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatSort } from '@angular/material/sort';
import { Product } from 'app/modules/configuration/branding/product/product.types';
let products: Array<TodoItemFlatNode> = [];
@Component({
    selector: 'goods-details',
    templateUrl: './details.component.html',
    animations: [fuseAnimations, trigger('detailExpand', [
        state('collapsed', style({ height: '0px', minHeight: '0' })),
        state('expanded', style({ height: '*' })),
        transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
    ],
    styles: [
        /* language=SCSS */
        `   
            html, body {
                min-height: 100% !important;
                height: 100% !important;
                margin: 0;
            }
            .mat-tab-body-wrapper {
                flex-grow: 1;
            }
        
            .mat-tab-body {
                display: flex !important;
                flex-direction: column;
            }
            .mat-tab-label-container{
                padding:0px!important;
            }
            .mat-tab-body-content {
                display: flex;
                flex-direction: column;
                flex-grow: 1;
                padding-left:0px!important;
                padding-right:0px!important;
            }
            .goods-mixture-grid {
                grid-template-columns:25px 112px auto 400px;

                @screen sm {
                    grid-template-columns:25px 112px auto ;
                }

                @screen md {
                    grid-template-columns:25px 112px auto ;
                }

                @screen lg {
                    grid-template-columns:25px 112px auto 400px;
                }
            }
            .goods-product-list-grid{
                grid-template-columns:25px 125px auto 400px;

                @screen sm {
                    grid-template-columns:25px 112px auto ;
                }

                @screen md {
                    grid-template-columns:25px 112px auto ;
                }

                @screen lg {
                    grid-template-columns:25px 125px auto 400px;
                }
            }
            .selected-goods-grid {
                grid-template-columns:150px 500px 250px 20px;

                @screen sm {
                    grid-template-columns:150px auto 20px;
                }

                @screen md {
                    grid-template-columns: 150px auto 20px;
                }

                @screen lg {
                    grid-template-columns: 150px auto 250px 20px;
                }
            }
            .selected-products-grid {
                grid-template-columns:150px auto 200px 20px;

                @screen sm {
                    grid-template-columns:150px  auto ;
                }

                @screen md {
                    grid-template-columns: 150px auto 200px 20px;
                }

                @screen lg {
                    grid-template-columns: 150px auto 200px 20px;
                }
            }
        `
    ],
    encapsulation: ViewEncapsulation.None
})

export class GoodsDetailsComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild('goodsPaginator') goodsPaginator: MatPaginator;
    @ViewChild('goodsSort') private goodsSort: MatSort;
    @ViewChild('productPaginator') productPaginator: MatPaginator;
    @ViewChild('productSort') private productSort: MatSort;
    goodsNames: any = [];
    goods$: Array<Goods> = [];
    goods: Array<Goods> = [];
    products$: Array<Product> = [];
    products: Array<Product> = [];
    selectedGoods$: Array<any> = [];
    selectedProducts$: Array<any> = [];
    goodsAdSearchInfo: Goods;
    goodsInfo: Goods = new Goods();
    goodsMixtureInfo: Goods = new Goods();
    productInfo: Product = new Product();
    pageType: string;
    frmGoods: FormGroup;
    frmProperties = new FormGroup({});
    frmMeasurementMetrics = new FormGroup({});
    frmAdvancedSearch: FormGroup;
    frmProductsAdvancedSearch: FormGroup;
    frmSelectedGoods = new FormGroup({});
    frmSelectedProducts = new FormGroup({});
    _result: OpResult = new OpResult();
    _paging: Paging;
    goodsCatArray = [];
    pagination: Paging;
    productPagination: Paging;
    menuArray = [];
    selectedCat: number = 0;
    selectedCatAdSearch: number = 0;
    catPropList = [];
    nameP1: any = [];
    nameP2: any = [];
    nameP3: any = [];
    nameP4: any = [];
    selectedP1: string = '';
    selectedP2: string = '';
    selectedP3: string = '';
    selectedP4: string = '';
    catPropCatList = [];
    width: number = 0;
    areaVal: number = 0;
    massVal: number = 0;
    showUpScroll: boolean;
    showDownScroll: boolean;
    showScrollHeight = 300;
    hideScrollHeight = 10;
    length: number;
    services: Array<KeyValue> = [];
    brands: Array<KeyValue> = [];
    massUnitData: Array<Units>;
    lengthUnitData: Array<Units>;
    areaUnitData: Array<Units>;
    measurementMetrics: Array<KeyValue> = [];
    brandId: number = 0;
    productViewMode: string;


    public showSaveWarning: boolean = false;
    Id: number;
    private _unsubscribeAll: Subject<any>;
    isLoading: boolean = false;
    selectedGoods = new SelectionModel<any>(true, []);
    selectedProducts = new SelectionModel<any>(true, []);

    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
    @ViewChild(MatMenuTrigger) trigger2: MatMenuTrigger;
    @ViewChild('goodsFilter', { static: true }) goodsFilter: ElementRef;
    @ViewChild("scrollContainer") scrollContainer: ElementRef<HTMLDivElement>;

    /* ---------------------------------product-section------------------------------ */

    selectedInfoRow: TodoItemFlatNode = new TodoItemFlatNode();
    private _database: ChecklistDatabase;
    flatNodeMap = new Map<TodoItemFlatNode, TodoItemNode>();

    /** Map from nested node to flattened node. This helps us to keep the same object for selection */
    nestedNodeMap = new Map<TodoItemNode, TodoItemFlatNode>();


    /** The new item's name */
    newItemName = '';

    treeControl: FlatTreeControl<TodoItemFlatNode>;

    treeFlattener: MatTreeFlattener<TodoItemNode, TodoItemFlatNode>;

    dataSource: MatTreeFlatDataSource<TodoItemNode, TodoItemFlatNode>;

    /** The selection for checklist */
    checklistSelection = new SelectionModel<TodoItemFlatNode>(true /* multiple */);

    getLevel = (node: TodoItemFlatNode) => node.levelId;

    isExpandable = (node: TodoItemFlatNode) => node.expandable;

    getChildren = (node: TodoItemNode): TodoItemNode[] => node.children;

    hasChild = (_: number, _nodeData: TodoItemFlatNode) => _nodeData.expandable;

    hasNoContent = (_: number, _nodeData: TodoItemFlatNode) => _nodeData.item == '';

    editMode: number = 0;

    /**
     * Transformer to convert nested node to flat node. Record the nodes in maps for later use.
     */
    transformer = (node: TodoItemNode, level: number) => {
        const existingNode = this.nestedNodeMap.get(node);
        const flatNode = existingNode && existingNode.item == node.item
            ? existingNode
            : new TodoItemFlatNode();
        flatNode.item = node.item;
        flatNode.status = node.status;
        flatNode.code = node.code;
        flatNode.id = node.id;
        flatNode.levelId = level;
        flatNode.expandable = !!node.children?.length;
        this.flatNodeMap.set(flatNode, node);
        this.nestedNodeMap.set(node, flatNode);
        return flatNode;
    }
    /* ---------------------------------product-section------------------------------ */

    constructor(
        private goodsService: GoodsService,
        private _formBuilder: FormBuilder,
        private http: HttpClient,
        private route: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseAlertService: FuseAlertService
    ) {

        this._unsubscribeAll = new Subject();
        // Set the default
        this.goodsAdSearchInfo = new Goods();
        this._paging = new Paging();
        this._database = new ChecklistDatabase();

        this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel,
            this.isExpandable, this.getChildren);
        this.treeControl = new FlatTreeControl<TodoItemFlatNode>(this.getLevel, this.isExpandable);
        this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

        this._database.dataChange.subscribe(data => {
            this.dataSource.data = data;
        });
    }


    /**
     * On init
     */
    ngOnInit(): void {

        this.productViewMode = '1';
        this.goodsAdSearchInfo.status = 1;
        this.frmGoods = this.createFormObject();
        this.frmMeasurementMetrics = this.createMeasurementMetricsFormObject();
        this.frmAdvancedSearch = this.createGoodsAdvancedSearchObject();
        this.frmProductsAdvancedSearch = this.createProductsAdvancedSearchObject();
        this.initialGoodsMixturePaging();
        this.Id = Number(this.route.snapshot.paramMap.get('id'));
        if (this.Id > 0)
            this.getById(this.Id);
        else {
            this.loadData();
            this.pageType = 'new';
        }



        this.initialPaginations();
    }
    ngAfterViewInit() {


        fromEvent(this.goodsFilter.nativeElement, 'keyup')
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
                    item.goodsName.toLowerCase().includes(this.goodsFilter.nativeElement.value.toLowerCase())
                    || item.categoryGoodsCode.toLocaleLowerCase().includes(this.goodsFilter.nativeElement.value.toLowerCase())
                    || item.categoryName.toLocaleLowerCase().includes(this.goodsFilter.nativeElement.value.toLowerCase()));
            });


    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }
    private loadData() {

        forkJoin(
            //this.getProductsTree(),
            //this.getGoodsOnInit(),
            this.getServices(),
            this.getGoodsCat(),
        ).subscribe(res => {
            this.setForkJoinValues(res);
            this.isLoading = false;
            this._changeDetectorRef.detectChanges();
        });

    }
    private setForkJoinValues(values: Array<any>): void {
        products = values[0].data;
        this._database.initialize(products);

        this.goodsInfo = values[0].data;
        products = values[1].data;
        this._database.initialize(products);
        this.setGoodsProducts();
        this.checkMassAndArea(this.goodsInfo.goodsPropertyValue);

        this.services = values[2].data;

        this.menuArray = values[3].data;
        this.goodsCatArray = values[3].data;
        this.addSelectanItemToCatMenu();
        this.addSelectanItemToCatMenuAd();
        this.setValues();

    }
    private setForkJoinValuesEditMode(values: Array<any>): void {
        this.goodsInfo = values[0].data;

        this.products = this.products$ = values[1].data.products;
        this.productPagination = { ...values[1].data.page };
        this.productPagination.pageNumber = this.productPagination.pageNumber - 1;

        this.services = values[2].data;

        this.menuArray = values[3].data;
        this.goodsCatArray = values[3].data;
        this.addSelectanItemToCatMenu();
        this.addSelectanItemToCatMenuAd();

        this.measurementMetrics = values[4].data;

        this.goodsNames = values[5].data;
        this.nameP1 = this.goodsNames.filter(x => x.categoryId == 1000511);
        this.nameP2 = this.goodsNames.filter(x => x.categoryId == 1000512);
        this.nameP3 = this.goodsNames.filter(x => x.categoryId == 1000513);
        this.nameP4 = this.goodsNames.filter(x => x.categoryId == 1000514);

        this.massUnitData = values[6].data.filter(x => x.measurementMetricId == 1000692);
        this.lengthUnitData = values[6].data.filter(x => x.measurementMetricId == 1000694);
        this.areaUnitData = values[6].data.filter(x => x.measurementMetricId == 1000693);

        this.brands = values[7].data;

        this.setPaginatorAndSort();
        this.setProductPaginatorAndSort();
        this.setValues();
        this.getCategoryInfoAndProperties();
        this.goodsMixtureInfo.selectedItemsViewMode = 1;
        this.goodsMixtureInfo.selectedGoodsIdList = [...this.goodsInfo.childrenList.map(obj => obj.key)];
        this.getGoods(this.goodsMixtureInfo);
        this.setGoodsProducts();

    }

    private getById(id: number) {
        this.pageType = 'edit';
        this.isLoading = true;

        forkJoin(
            this.getGoodsById(id),
            this.getProductOnInit(),
            this.getServices(),
            this.getGoodsCat(),
            this.getMeasurementMetrics(),
            this.getNames(),
            this.getUnits(),
            this.getBrands()
        ).subscribe(res => {
            this.setForkJoinValuesEditMode(res);
            this.isLoading = false;
            this._changeDetectorRef.markForCheck();
            this._changeDetectorRef.detectChanges();
        });



    }
    private initialPaginations() {
        this.pagination = new Paging();
        this.pagination.flag = true;
        this.pagination.length = 0;
        this.pagination.order = 'desc';
        this.pagination.pageNumber = 1;
        this.pagination.pageSize = 100;
        this.pagination.sort = '';
    }
    private setPaginatorAndSort(): void {
        if (this.goodsSort && this.goodsPaginator) {
            // Set the initial sort
            this.goodsSort.sort({
                id: '',
                start: 'desc',
                disableClear: true
            });

            // Mark for check
            this._changeDetectorRef.markForCheck();

            // If the user changes the sort order...
            this.goodsSort.sortChange
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe(() => {
                    // Reset back to the first page
                    this.goodsPaginator.pageIndex = 0;


                });

            // Get products if sort or page changes
            merge(this.goodsSort.sortChange, this.goodsPaginator.page).pipe(
                switchMap(() => {
                    this.isLoading = true;
                    this._changeDetectorRef.detectChanges();
                    this.pagination.length = this.goodsPaginator.length;
                    this.pagination.pageSize = this.goodsPaginator.pageSize;
                    this.pagination.pageNumber = this.goodsPaginator.pageIndex + 1;
                    this.pagination.flag = false;
                    this.pagination.order = this.goodsSort.direction == null ? 'desc' : this.goodsSort.direction;
                    this.pagination.sort = this.goodsSort.active == null ? '' : this.goodsSort.active;
                    this.goodsMixtureInfo.page = this.pagination;
                    return this.goodsService.getGoodsForMixture(this.goodsMixtureInfo);
                }),
                map((res) => {
                    this.goods = this.goods$ = res.data.goods;
                    this.pagination = { ...res.data.page };
                    this.pagination.pageNumber = this.pagination.pageNumber - 1;
                    this.isLoading = false;
                    this._changeDetectorRef.detectChanges();
                })
            ).subscribe();
        }
    }
    private setProductPaginatorAndSort(): void {
        if (this.productSort && this.productPaginator) {
            // Set the initial sort
            this.productSort.sort({
                id: '',
                start: 'desc',
                disableClear: true
            });

            // Mark for check
            this._changeDetectorRef.markForCheck();

            // If the user changes the sort order...
            this.productSort.sortChange
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe(() => {
                    // Reset back to the first page
                    this.productPaginator.pageIndex = 0;


                });

            // Get products if sort or page changes
            merge(this.productSort.sortChange, this.productPaginator.page).pipe(
                switchMap(() => {
                    this.isLoading = true;
                    this.productPagination.length = this.productPaginator.length;
                    this.productPagination.pageSize = this.productPaginator.pageSize;
                    this.productPagination.pageNumber = this.productPaginator.pageIndex + 1;
                    this.productPagination.flag = false;
                    this.productPagination.order = this.productSort.direction == null ? 'desc' : this.productSort.direction;
                    this.productPagination.sort = this.productSort.active == null ? '' : this.productSort.active;
                    this.productInfo.page = this.productPagination;
                    this._changeDetectorRef.detectChanges();
                    return this.goodsService.getFinalProductList(this.productInfo);
                }),
                map((res) => {
                    this.products = this.products$ = res.data.products;
                    this.productPagination = { ...res.data.page };
                    this.productPagination.pageNumber = this.productPagination.pageNumber - 1;
                    this.isLoading = false;
                    this._changeDetectorRef.detectChanges();
                })
            ).subscribe();
        }
    }
    private createFormObject(): FormGroup {

        return this._formBuilder.group({
            name: [this.goodsInfo.goodsName],
            code: [this.goodsInfo.goodsCode],
            nameP1: '',
            nameP2: '',
            nameP3: '',
            nameP4: '',
            selServices: [this.goodsInfo.serviceList],
            selOrgProduct: [this.goodsInfo.productsList],
            material: [this.goodsInfo.materialList],
            weight: [this.goodsInfo.objectWeight],
            weightUnit: [this.goodsInfo.weightUnitId],
            status: [this.goodsInfo.status],
            cover: [this.goodsInfo.hasCover],
            orderDeadline: [this.goodsInfo.orderDeadline],
            technicalNumber: [this.goodsInfo.technicalNumber],
            criticalPoint: [this.goodsInfo.criticalPoint],
            reductionTiming: [this.goodsInfo.reductionTimingId],

        });
    }
    private createMeasurementMetricsFormObject(): FormGroup {

        return this._formBuilder.group({
            mixtureMeasurementMetric: new FormControl({ value: '0', disabled: true }),
            stockMeasurementMetric: new FormControl({ value: '0', disabled: true }),
            arrivalMeasurementMetric: new FormControl({ value: '0', disabled: true }),
            departureMeasurementMetric: new FormControl({ value: '0', disabled: true }),
            area: new FormControl({ value: '', disabled: true }),
            mass: new FormControl({ value: '', disabled: true })

        });
    }
    createGoodsAdvancedSearchObject(): FormGroup {
        return this._formBuilder.group({
            goodsName: '',
            goodsCode: '',
            goodsSelectedItemsDisplayMode: '',
        });
    }

    createProductsAdvancedSearchObject(): FormGroup {
        return this._formBuilder.group({
            viewMode: this.productViewMode,
            brands: '',
            type: '',
        });
    }

    private showAlert(name: string): void {
        this._fuseAlertService.show(name);
    }

    private dismissAlert(name: string): void {
        this._fuseAlertService.dismiss(name);
    }

    /*     private setControlsValues() {
            this.frmOrgInfo.controls["goodsName"].setValue(this.goods.goodsName);
            this.frmOrgInfo.controls["goodsCode"].setValue(this.goods.goodsCode);
            this.frmOrgInfo.controls["organizationDescription"].setValue(this.goods.organizationId);
            this.frmOrgInfo.controls["status"].setValue(this.organization.status);
            this.frmOrgInfo.controls["isBeneficiary"].setValue(this.organization.isBeneficiary);
            this.organization.organizationId = this.Id;
        }
    
        private getControlsValues() {
            this.organization.organizationName = this.frmOrgInfo.controls["organizationName"].value;
            this.organization.organizationCode = this.frmOrgInfo.controls["organizationCode"].value;
            this.organization.organizationDescription = this.frmOrgInfo.controls["organizationDescription"].value;
            this.organization.status = this.frmOrgInfo.controls["status"].value;
            this.organization.isBeneficiary = this.frmOrgInfo.controls["isBeneficiary"].value;
    
        } */

    public setSelectedCat(selectedId: number, closeMenu: boolean) {
        //this.menuArray[0].value = selectedItem;

        this.selectedCat = selectedId;
        if (selectedId > 0) {
            this.getCatProp(selectedId);
            if (closeMenu)
                this.trigger.closeMenu();
        }
    }

    private getCatProp(catId: number) {
        this.catPropList.forEach((prop) => this.frmProperties.removeControl(prop.propertyId));
        this.goodsService.getCategoryInfoAndProperties(catId.toString()).subscribe(res => {
            this.catPropList = res.data.categoryProperty;
            this.catPropListProcessiong(res.data.categoryProperty);
            this.setMeasurementMetrics(res.data.categoryInfo);
            this.catPropList.forEach((prop) => this.frmProperties.addControl(prop.propertyId, new FormControl('', Validators.required)));
            if (this.pageType == 'edit') {
                Object.keys(this.frmProperties.controls).forEach(key => {
                    const indx = this.goodsInfo.goodsPropertyValue.findIndex(x => x.propertyId == Number(key));
                    if (indx !== -1) {
                        this.frmProperties.controls[key].setValue(this.goodsInfo.goodsPropertyValue[indx].propertyText == null ?
                            this.goodsInfo.goodsPropertyValue[indx].propertyValueId :
                            this.goodsInfo.goodsPropertyValue[indx].propertyText);
                    }
                });
            }
        })
    }
    public setSelectedCatAdSearch(selectedId: number) {

        this.selectedCatAdSearch = selectedId;
        if (selectedId > 0)
            this.trigger2.closeMenu();
    }
    private catPropListProcessiong(propList: any) {
        this.catPropCatList = [];
        if (propList.length > 0)
            propList.forEach(element => {
                const index = this.catPropCatList.map(function (e) { return e.goodsCategoryId; }).indexOf(element.goodsCategoryId);
                if (index == -1)
                    this.catPropCatList.push(element);
            });
    }


    private setMeasurementMetrics(goodsCatInfo: any) {
        this.goodsInfo.measurementMetricId = goodsCatInfo.mixtureMeasurementMetricId;
        this.frmMeasurementMetrics.controls["mixtureMeasurementMetric"].setValue(goodsCatInfo.mixtureMeasurementMetricId.toString());
        this.frmMeasurementMetrics.controls["stockMeasurementMetric"].setValue(goodsCatInfo.stockMeasurementMetricId.toString());
        this.frmMeasurementMetrics.controls["arrivalMeasurementMetric"].setValue(goodsCatInfo.arrivalMeasurementMetricId.toString());
        this.frmMeasurementMetrics.controls["departureMeasurementMetric"].setValue(goodsCatInfo.departureMeasurementMetricId.toString());
    }

    private getMeasurementMetrics(): Observable<any> {

        return this.goodsService.getMeasurementMetrics();
    }

    private getUnits(): Observable<any> {
        return this.goodsService.getUnits();
    }


    private getNames(): Observable<any> {

        return this.goodsService.getGoodsNames();
    }
    private getServices(): Observable<any> {
        return this.goodsService.getServices();
    }

    private getBrands(): Observable<any> {
        return this.goodsService.getBrands();
    }

    private getGoodsById(goodsId: number): Observable<any> {
        return this.goodsService.getGoodsById(goodsId.toString());

    }
    private getGoodsCat(): Observable<any> {
        return this.goodsService.getGoodsCatgories();
    }
    private initialGoodsMixturePaging() {
        this.pagination = new Paging();
        this.pagination.flag = true;
        this.pagination.length = 0;
        this.pagination.order = 'desc';
        this.pagination.pageNumber = 0;
        this.pagination.pageSize = 50;
        this.pagination.sort = '';
        this.goodsMixtureInfo.page = { ...this.pagination };
        this.goodsMixtureInfo.page.pageNumber = this.goodsMixtureInfo.page.pageNumber + 1;
        this.goodsMixtureInfo.status = 1;
    }


    private getProductOnInit(): Observable<any> {
        this.productPagination = new Paging();
        this.productPagination.flag = true;
        this.productPagination.length = 0;
        this.productPagination.order = 'desc';
        this.productPagination.pageNumber = 0;
        this.productPagination.pageSize = 50;
        this.productPagination.sort = '';
        this.productInfo.page = { ...this.productPagination };
        this.productInfo.page.pageNumber = this.productInfo.page.pageNumber + 1;
        this.productInfo.status = 1;
        return this.goodsService.getFinalProductList(this.productInfo);
    }

    private getGoods(info: Goods) {
        this.isLoading = true;
        this.goodsService.getGoodsForMixture(info)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((goods: any) => {
                this.goods = this.goods$ = goods.data.goods;
                this.pagination = { ...goods.data.page };
                this.pagination.pageNumber = this.pagination.pageNumber - 1;
                this.isLoading = false;
                this._changeDetectorRef.markForCheck();
            });
    }
    getValues(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            this.goodsInfo.organizationId = event.source.value;
        }

    }


    private getProductsTree(brands: Array<KeyValue>): Observable<any> {
        const observables = brands.map(item => this.getProductsTreeByBrandId(item.key));
        return forkJoin(observables);

    }
    private getProductsTreeByBrandId(brandId: number): Observable<any> {

        return this.goodsService.getProductsTreeBybrandId(brandId);

    }
    private getCategoryInfoAndProperties(): Observable<any> {
        return this.goodsService.getCategoryInfoAndProperties(this.goodsInfo.categoryId.toString())
            .subscribe(res => {
                this.selectedCat = this.goodsInfo.categoryId;
                this.catPropList = res.data.categoryProperty;
                this.catPropListProcessiong(res.data.categoryProperty);
                this.setMeasurementMetrics(res.data.categoryInfo);
                this.catPropList.forEach((prop) => this.frmProperties.addControl(prop.propertyId, new FormControl('', Validators.required)));
                Object.keys(this.frmProperties.controls).forEach(key => {
                    const indx = this.goodsInfo.goodsPropertyValue.findIndex(x => x.propertyId == Number(key));
                    if (indx !== -1) {
                        this.frmProperties.controls[key].setValue(this.goodsInfo.goodsPropertyValue[indx].propertyText == null ?
                            this.goodsInfo.goodsPropertyValue[indx].propertyValueId :
                            this.goodsInfo.goodsPropertyValue[indx].propertyText);
                    }
                });
            });
    }

    private setProductsValue(productInfo: GoodsMeasure) {

        if (this.goodsInfo.measurementMetricId == 1000691)
            this.frmSelectedProducts.controls[productInfo.key].setValue(productInfo.measure);
        else if (this.goodsInfo.measurementMetricId == 1000692) {
            this.frmSelectedProducts.controls['mass'.concat(productInfo.key.toString())].setValue(productInfo.measure);
            this.frmSelectedProducts.controls['massUnit'.concat(productInfo.key.toString())].setValue(productInfo.unitId);;
        }
        else if (this.goodsInfo.measurementMetricId == 1000693) {

            if (productInfo.itemId == 1000713 || productInfo.itemId == 1000711)
                this.frmSelectedProducts.controls['width'.concat(productInfo.key.toString())].setValue(productInfo.measure);
            else if (productInfo.itemId == 1000714 || productInfo.itemId == 1000711)
                this.frmSelectedProducts.controls['length'.concat(productInfo.key.toString())].setValue(productInfo.measure);

            this.frmSelectedProducts.controls['areaUnit'.concat(productInfo.key.toString())].setValue(productInfo.unitId);
        }
        else if (this.goodsInfo.measurementMetricId == 1000694) {

            if (productInfo.itemId == 1000714 || productInfo.itemId == 1000711)
                this.frmSelectedProducts.controls['length'.concat(productInfo.key.toString())].setValue(productInfo.measure);

            this.frmSelectedProducts.controls['lengthUnit'.concat(productInfo.key.toString())].setValue(productInfo.unitId);
        }
        this.frmSelectedProducts.controls['conformity'.concat(productInfo.key.toString())].setValue(productInfo.conformityId);
    }

    private setGoodsMixtureValue(goodsInfo: Measure) {
        const indx = this.selectedGoods.selected.findIndex(x => x.goodsId == goodsInfo.key);
        const goods = this.selectedGoods.selected[indx];
        if (goods.measurementMetricId == 1000691)
            this.frmSelectedGoods.controls[goodsInfo.key].setValue(goodsInfo.measure);
        else if (goods.measurementMetricId == 1000692) {
            this.frmSelectedGoods.controls['mass'.concat(goodsInfo.key.toString())].setValue(goodsInfo.measure);
            this.frmSelectedGoods.controls['massUnit'.concat(goodsInfo.key.toString())].setValue(goodsInfo.unitId);;
        }
        else if (goods.measurementMetricId == 1000693) {

            if (goodsInfo.itemId == 1000713 || goodsInfo.itemId == 1000711)
                this.frmSelectedGoods.controls['width'.concat(goodsInfo.key.toString())].setValue(goodsInfo.measure);
            else if (goodsInfo.itemId == 1000714 || goodsInfo.itemId == 1000711)
                this.frmSelectedGoods.controls['length'.concat(goodsInfo.key.toString())].setValue(goodsInfo.measure);

            this.frmSelectedGoods.controls['areaUnit'.concat(goodsInfo.key.toString())].setValue(goodsInfo.unitId);
        }
        else if (goods.measurementMetricId == 1000694) {

            if (goodsInfo.itemId == 1000714 || goodsInfo.itemId == 1000711)
                this.frmSelectedGoods.controls['length'.concat(goodsInfo.key.toString())].setValue(goodsInfo.measure);

            this.frmSelectedGoods.controls['lengthUnit'.concat(goodsInfo.key.toString())].setValue(goodsInfo.unitId);
        }
    }

    setGoodsMixture() {
        this.goodsInfo.childrenList.forEach(element => {
            if (this.selectedGoods.selected.findIndex(x => x.goodsId == element.key) == -1) {
                this.selectedGoods.selected.push({
                    goodsId: element.key, goodsName: element.name,
                    goodsCode: element.code, categoryName: element.categoryName,
                    measurementMetricId: element.measurementMetricId
                });

                this.toggleSelectedGoodsControl(element.key.toString());
            }
            this.selectedGoods$.push(this.selectedGoods.selected[this.selectedGoods.selected.length - 1]);
            this.setGoodsMixtureValue(element);
        });



    }
    private getParentNode(node: TodoItemFlatNode): TodoItemFlatNode | null {
        const currentLevel = this.getLevel(node);

        if (currentLevel < 1) {
            return null;
        }

        const startIndex = this.treeControl.dataNodes.indexOf(node) - 1;

        for (let i = startIndex; i >= 0; i--) {
            const currentNode = this.treeControl.dataNodes[i];

            if (this.getLevel(currentNode) < currentLevel) {
                return currentNode;
            }
        }
        return null;
    }

    private expandAllParents(node: TodoItemFlatNode) {
        const parent = this.getParentNode(node);
        if (parent) {
            this.treeControl.isExpanded(parent) ? null : this.treeControl.expand(parent);
            this.expandAllParents(parent);
        }
    }




    private setGoodsProducts() {
        if (this.treeControl.dataNodes.length > 0)
            this.goodsInfo.productsList.forEach(element => {

                const indx = this.treeControl.dataNodes.findIndex(x => x.id == element.key);
                if (indx > -1) {
                    this.todoItemSelectionToggle(this.treeControl.dataNodes[indx]);
                    //this.expandAllParents(this.treeControl.dataNodes[indx]);
                    this.setProductsValue(element);
                }
            });

    }
    setValues() {


        this.frmGoods.controls['code'].setValue(this.goodsInfo.goodsCode);
        this.frmGoods.controls['name'].setValue(this.goodsInfo.goodsName);
        this.frmGoods.controls['orderDeadline'].setValue(this.goodsInfo.orderDeadline);
        this.frmGoods.controls['criticalPoint'].setValue(this.goodsInfo.criticalPoint);
        this.frmGoods.controls['technicalNumber'].setValue(this.goodsInfo.technicalNumber);
        this.frmGoods.controls['status'].setValue(this.goodsInfo.status);
        this.frmGoods.controls['weight'].setValue(this.goodsInfo.objectWeight);
        this.frmGoods.controls['weightUnit'].setValue(this.goodsInfo.weightUnitId);
        this.frmGoods.controls['cover'].setValue(this.goodsInfo.hasGoodsCover);
        this.frmGoods.controls['reductionTiming'].setValue(this.goodsInfo.reductionTimingId);
        this.setGoodsMixture();
        this.setGoodsProducts();




    }

    private removeSelectedProductContols(productId: number) {
        if (this.goodsInfo.measurementMetricId == 1000691)
            this.frmSelectedProducts.removeControl(productId.toString());
        else if (this.goodsInfo.measurementMetricId == 1000692) {
            this.frmSelectedProducts.removeControl('mass'.concat(productId.toString()));
            this.frmSelectedProducts.removeControl('massUnit'.concat(productId.toString()));
        }
        else if (this.goodsInfo.measurementMetricId == 1000693) {
            this.frmSelectedProducts.removeControl('length'.concat(productId.toString()));
            this.frmSelectedProducts.removeControl('width'.concat(productId.toString()));
            this.frmSelectedProducts.removeControl('areaUnit'.concat(productId.toString()));
        }
        else if (this.goodsInfo.measurementMetricId == 1000694) {
            this.frmSelectedProducts.removeControl('length'.concat(productId.toString()));
            this.frmSelectedProducts.removeControl('lengthUnit'.concat(productId.toString()));
        }
        this.frmSelectedProducts.removeControl('conformity'.concat(productId.toString()));
    }
    private addSelectedProductContols(productId: number) {

        if (this.goodsInfo.measurementMetricId == 1000691)
            this.frmSelectedProducts.addControl(productId.toString(), new FormControl('', Validators.required));
        else if (this.goodsInfo.measurementMetricId == 1000692) {
            this.frmSelectedProducts.addControl('mass'.concat(productId.toString()), new FormControl('', Validators.required));
            this.frmSelectedProducts.addControl('massUnit'.concat(productId.toString()), new FormControl('', Validators.required));
        }
        else if (this.goodsInfo.measurementMetricId == 1000693) {
            this.frmSelectedProducts.addControl('length'.concat(productId.toString()), new FormControl('', Validators.required));
            this.frmSelectedProducts.controls['length'.concat(productId.toString())].setValue(this.getLengthFromCategoryTab());
            this.frmSelectedProducts.addControl('width'.concat(productId.toString()), new FormControl('', Validators.required));
            this.frmSelectedProducts.controls['width'.concat(productId.toString())].setValue(this.getWidthFromCategoryTab());
            this.frmSelectedProducts.addControl('areaUnit'.concat(productId.toString()), new FormControl('', Validators.required));
            this.frmSelectedProducts.controls['areaUnit'.concat(productId.toString())].setValue(this.getUnitFromCategoryTab());
        }
        else if (this.goodsInfo.measurementMetricId == 1000694) {
            this.frmSelectedGoods.addControl('length'.concat(productId.toString()), new FormControl('', Validators.required));
            this.frmSelectedGoods.addControl('lengthUnit'.concat(productId.toString()), new FormControl('', Validators.required))
        }
        this.frmSelectedProducts.addControl('conformity'.concat(productId.toString()), new FormControl('', Validators.required));
        this.frmSelectedProducts.controls['conformity'.concat(productId.toString())].setValue(1000650);

    }


    private removeSelectedGoodsContols(goodsId: number) {
        const indx = this.selectedGoods.selected.findIndex(x => x.key == goodsId);
        const goods = this.selectedGoods.selected[indx];
        if (goods.measurementMetricId == 1000691)
            this.frmSelectedGoods.removeControl(goodsId.toString());
        else if (goods.measurementMetricId == 1000692) {
            this.frmSelectedGoods.removeControl('mass'.concat(goodsId.toString()));
            this.frmSelectedGoods.removeControl('massUnit'.concat(goodsId.toString()));
        }
        else if (goods.measurementMetricId == 1000693) {
            this.frmSelectedGoods.removeControl('length'.concat(goodsId.toString()));
            this.frmSelectedGoods.removeControl('width'.concat(goodsId.toString()));
            this.frmSelectedGoods.removeControl('areaUnit'.concat(goodsId.toString()));
        }
        else if (goods.measurementMetricId == 1000694) {
            this.frmSelectedGoods.removeControl('length'.concat(goodsId.toString()));
            this.frmSelectedGoods.removeControl('lengthUnit'.concat(goodsId.toString()));
        }

    }
    private addSelectedGoodsContols(goodsId: number) {
        const indx = this.selectedGoods.selected.findIndex(x => x.goodsId == goodsId);
        const goods = this.selectedGoods.selected[indx];
        if (goods.measurementMetricId == 1000691)
            this.frmSelectedGoods.addControl(goodsId.toString(), new FormControl('', Validators.required));
        else if (goods.measurementMetricId == 1000692) {
            this.frmSelectedGoods.addControl('mass'.concat(goodsId.toString()), new FormControl('', Validators.required));
            this.frmSelectedGoods.addControl('massUnit'.concat(goodsId.toString()), new FormControl('', Validators.required));
        }
        else if (goods.measurementMetricId == 1000693) {
            this.frmSelectedGoods.addControl('length'.concat(goodsId.toString()), new FormControl('', Validators.required));
            this.frmSelectedGoods.controls['length'.concat(goodsId.toString())].setValue(this.getLengthFromCategoryTab());
            this.frmSelectedGoods.addControl('width'.concat(goodsId.toString()), new FormControl('', Validators.required));
            this.frmSelectedGoods.controls['width'.concat(goodsId.toString())].setValue(this.getWidthFromCategoryTab());
            this.frmSelectedGoods.addControl('areaUnit'.concat(goodsId.toString()), new FormControl('', Validators.required));
            this.frmSelectedGoods.controls['areaUnit'.concat(goodsId.toString())].setValue(this.getUnitFromCategoryTab());
        }
        else if (goods.measurementMetricId == 1000694) {
            this.frmSelectedGoods.addControl('length'.concat(goodsId.toString()), new FormControl('', Validators.required));
            this.frmSelectedGoods.addControl('lengthUnit'.concat(goodsId.toString()), new FormControl('', Validators.required))
        }

    }

    private getLengthFromCategoryTab(): string {
        const indx = this.catPropList.findIndex(x => x.propertyId == 10003388);
        if (indx == -1)
            return null;
        let value = this.frmProperties.controls["10003388"].value;
        return value;

    }
    private getWidthFromCategoryTab(): string {
        const indx = this.catPropList.findIndex(x => x.propertyId == 10003389);
        if (indx == -1)
            return null;
        let value = this.frmProperties.controls["10003389"].value;
        return value;

    }
    private getUnitFromCategoryTab(): string {
        const indx = this.catPropList.findIndex(x => x.propertyId == 10003389);
        if (indx == -1)
            return null;
        let value = this.catPropList[indx].unitId;
        return value;

    }

    private addToSelectedGoodsSelection(goodsId: number) {
        const indx = this.goods.findIndex(x => x.goodsId == goodsId);
        let goods = this.goods[indx];
        this.selectedGoods.selected.push({
            goodsId: goods.goodsId, goodsName: goods.goodsName,
            goodsCode: goods.categoryGoodsCode, categoryName: goods.categoryName,
            measurementMetricId: goods.measurementMetricId
        });
        this.selectedGoods$.push(this.selectedGoods.selected[this.selectedGoods.selected.length - 1]);
    }

    private toggleSelectedGoodsControl(controlId: string) {
        let control = this.frmSelectedGoods.controls[controlId];
        if (control)
            this.removeSelectedGoodsContols(Number(controlId));
        else {
            this.addSelectedGoodsContols(Number(controlId));
        }
    }

    private toggleSlectedProductControl(controlId: string) {
        let control = this.frmSelectedProducts.controls[controlId];
        if (control)
            this.removeSelectedProductContols(Number(controlId));
        else {
            this.addSelectedProductContols(Number(controlId));
        }
    }


    masterToggle() {

        if (this.isAllSelected()) {
            this.selectedGoods.selected.forEach(element => {
                this.toggleSelectedGoodsControl(element.goodsId);
            });
            this.selectedGoods.clear();

        }
        else {
            this.goods.forEach(element => {
                const indx = this.selectedGoods.selected.findIndex(x => x.goodsId == element.goodsId);
                if (indx == -1) {
                    this.addToSelectedGoodsSelection(element.goodsId);
                    this.toggleSelectedGoodsControl(element.goodsId.toString());
                }
            });
        }


    }
    isProductSelected(row: any): boolean {

        const indx = this.goodsInfo.productsList.map(function (e) { return e.key; }).indexOf(row.productId);
        if (indx == -1)
            return false;
        else
            return true;
    }
    isGoodsSelected(row: any): boolean {

        const indx = this.selectedGoods.selected.findIndex(x => x.goodsId == row.goodsId);
        if (indx == -1)
            return false;
        else
            return true;
    }
    changeGoodsCheckBox(goodsId: number) {

        const indx = this.selectedGoods.selected.findIndex(x => x.goodsId == goodsId);
        if (indx !== -1)
            this.selectedGoods.selected.splice(indx, 1);
        else
            this.addToSelectedGoodsSelection(goodsId);

        this.toggleSelectedGoodsControl(goodsId.toString());
    }

    checkboxLabel(row?): string {

        if (!row) {
            return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
        }
        return `${this.selectedGoods.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
    }
    checkGoodsIndeterminate(): boolean {
        if (this.goods.length == 0)
            return false;
        let result: boolean = false;
        this.goods.forEach(element => {
            const indx = this.selectedGoods.selected.map(function (e) { return e.goodsId; }).indexOf(element.goodsId);
            if (indx !== -1) {
                result = true;
            }
        });
        return result && !this.isAllSelected();
    }

    isAllSelected(): boolean {
        if (this.goods.length == 0)
            return false;
        let result: boolean = true;
        if (this.goods.length !== this.selectedGoods.selected.length)
            return false;

        this.goods.forEach(element => {
            const indx = this.selectedGoods.selected.map(function (e) { return e.goodsId; }).indexOf(element.goodsId);
            if (indx == -1) {
                result = false;
            }
        });
        return result;
    }
    applyFilterOnSelectedGoods(filterValue: string) {
        this.selectedGoods$ = this.selectedGoods.selected.filter(x => x.code.toLowerCase().includes(filterValue.trim().toLowerCase()) ||
            x.name.toLowerCase().includes(filterValue.trim().toLowerCase()) ||
            x.categoryName.toLowerCase().includes(filterValue.trim().toLowerCase()));
    }

    applyFilterOnSelectedProducts(filterValue: string) {
        this.selectedProducts$ = this.selectedProducts.selected.filter(x => x.code.toLowerCase().includes(filterValue.trim().toLowerCase()) ||
            x.name.toLowerCase().includes(filterValue.trim().toLowerCase()) ||
            x.categoryName.toLowerCase().includes(filterValue.trim().toLowerCase()));
    }
    public goodsSearch() {
        this.pagination.flag = true;
        this.pagination.pageNumber = 1;
        this.pagination.length = 0;
        this.goodsMixtureInfo.goodsCode = this.frmAdvancedSearch.controls["code"].value;
        this.goodsMixtureInfo.goodsName = this.frmAdvancedSearch.controls["name"].value;
        this.goodsMixtureInfo.page = this.pagination;
        this.getGoods(this.goodsMixtureInfo);

    }

    public resetAdSearch() {
        this.frmAdvancedSearch.controls['goodsName'].setValue('');
        this.frmAdvancedSearch.controls['goodsCode'].setValue('');
        this.resetGoodsCatBotton();

    }
    public productSearch() {

    }
    public resetProductAdSearch() {
        this.frmProductsAdvancedSearch.controls['brands'].setValue([]);
        this.frmProductsAdvancedSearch.controls['type'].setValue('');

    }

    private resetGoodsCatBotton() {
        let obj = new HierarchicalKeyValue();
        obj.id = this.goodsCatArray[0].id;
        obj.item = this.goodsCatArray[0].item;
        obj.parentId = this.goodsCatArray[0].parentId;
        obj.children = [];
        for (var i = 0; i < this.goodsCatArray[0].children.length; i++) {
            obj.children.push(this.goodsCatArray[0].children[i]);
        }
        this.goodsCatArray = [];
        this.goodsCatArray.push(obj);
        this.selectedCatAdSearch = 0;
    }

    changeNameDrp(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }, cat: string) {

        if (event.isUserInput) {
            let name: string = '';
            if (cat == 'P1') {
                const indx = this.goodsNames.findIndex(x => x.goodsNameId == event.source.value);
                this.selectedP1 = this.goodsNames[indx].goodsName == 'None' ? '' : this.goodsNames[indx].goodsName;
            }
            else if (cat == 'P2') {
                const indx = this.goodsNames.findIndex(x => x.goodsNameId == event.source.value);
                this.selectedP2 = this.goodsNames[indx].goodsName == 'None' ? '' : this.goodsNames[indx].goodsName;
            }
            else if (cat == 'P3') {
                const indx = this.goodsNames.findIndex(x => x.goodsNameId == event.source.value);
                this.selectedP3 = this.goodsNames[indx].goodsName == 'None' ? '' : this.goodsNames[indx].goodsName;
            }
            else if (cat == 'P4') {
                const indx = this.goodsNames.findIndex(x => x.goodsNameId == event.source.value);
                this.selectedP4 = this.goodsNames[indx].goodsName == 'None' ? '' : this.goodsNames[indx].goodsName;
            }


            if (this.selectedP1 !== '')
                name = name.concat(this.selectedP1).concat('-');
            if (this.selectedP2 !== '')
                name = name.concat(this.selectedP2).concat('-');
            if (this.selectedP3 !== '')
                name = name.concat(this.selectedP3).concat('-');
            if (this.selectedP4 !== '')
                name = name.concat(this.selectedP4).concat('-');

            name = name.substring(0, name.length - 1);
            this.frmGoods.controls['name'].setValue(name);
        }
    }

    private addSelectanItemToCatMenu() {
        let obj = new HierarchicalKeyValue();
        obj.id = 0;

        if (this.pageType == 'new' || (this.pageType == 'edit') &&
            (this.goodsInfo.categoryId == null || this.goodsInfo.categoryId == 0)) {
            obj.item = "Select a category";
            this.selectedCat = 0;
        }
        else {
            obj.item = this.goodsInfo.categoryName;
            this.selectedCat = this.goodsInfo.categoryId;
        }
        obj.parentId = -1;
        obj.children = [];
        for (var i = 0; i < this.menuArray.length; i++) {
            obj.children.push(this.menuArray[i]);
        }
        this.menuArray = [];
        this.menuArray.push(obj);

    }

    private addSelectanItemToCatMenuAd() {
        let obj = new HierarchicalKeyValue();
        obj.id = 0;
        obj.item = "Select a category";
        obj.parentId = -1;
        obj.children = [];
        for (var i = 0; i < this.goodsCatArray.length; i++) {
            obj.children.push(this.goodsCatArray[i]);
        }
        this.goodsCatArray = [];
        this.goodsCatArray.push(obj);
    }

    private checkMassAndArea(propertyList: any) {
        propertyList.forEach(element => {
            if (element.propertyId == 10003389)
                this.width = element.propertyText;
            else if (element.propertyId == 10003388)
                this.length = element.propertyText;
        });
        if (this.width !== 0 && this.length !== 0) {
            this.areaVal = this.width * this.length / 1000000;
            this.massVal = this.width * this.length * 7.8 * 1 / 1000000;
        }
    }



    getServiceValues(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            if (event.source.selected)
                this.goodsInfo.serviceList.push(event.source.value);
            else {
                const indx: number = this.goodsInfo.serviceList.findIndex(x => x == event.source.value);
                if (indx !== -1) {
                    this.goodsInfo.serviceList.splice(indx, 1);
                }
            }
        }

    }

    getBrandValues(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            if (event.source.selected)
                null;
            // this.goodsInfo.serviceList.push(event.source.value);
            else {
                /*    const indx: number = this.goodsInfo.serviceList.findIndex(x => x == event.source.value);
                   if (indx !== -1) {
                       this.goodsInfo.serviceList.splice(indx, 1);
                   } */
            }
        }

    }




    trackByFn(index: number, item: any): any {
        return item.id || index;
    }

    @HostListener('scroll', ['$event'])
    onWindowScroll() {
        let div = document.getElementById("scrollDiv");
        if ((div.offsetTop > this.showScrollHeight || div.scrollTop > this.showScrollHeight)) {
            this.showUpScroll = true;
        }
        else if (this.showUpScroll && (div.offsetTop < this.hideScrollHeight || div.scrollTop < this.hideScrollHeight)) {
            this.showUpScroll = false;
        }
        if (div.scrollTop + 1000 < div.scrollHeight)
            this.showDownScroll = true;
        else

            this.showDownScroll = false;
    }
    scrollToTop() {
        (function smoothscroll() {
            let div = document.getElementById("scrollDiv");
            var currentScroll = div.scrollTop;
            if (currentScroll > 0) {
                window.requestAnimationFrame(smoothscroll);
                div.scrollTo(0, currentScroll - (currentScroll / 5));
            }
        })();

        this.showDownScroll = false;
    }

    scrollToDown() {
        //  (function smoothscroll() {
        //window.requestAnimationFrame(smoothscroll);
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;

        //  })();
    }
    private expandAllItemsInCheckListSelection(): void {
        this.selectedProducts.selected.forEach(element => {
            const indx = this.treeControl.dataNodes.findIndex(x => x.id == element.key);
            this.expandAllParents(this.treeControl.dataNodes[indx]);
        });


    }

    filterChanged(filterText: string) {
        if (filterText.length >= 3 || filterText.length == 0) {
            this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
            this._database = new ChecklistDatabase();
            this._database.dataChange.subscribe(data => {
                this.dataSource.data = data;
            });
            this._database.filter(filterText);
            if (filterText) {
                this.treeControl.expandAll();
            } else {
                this.treeControl.collapseAll();
                // this.expandAllItemsInCheckListSelection();
            }

        }
    }
    productListFilterChanged(filterText: string) {

        if (!this.products) {
            return;
        }
        filterText = filterText.toLowerCase();
        this.products$ = this.products.filter(item =>
            item.fullCode.toLowerCase().includes(filterText)
            || item.fullName.toLocaleLowerCase().includes(filterText)
            || item.brandName.toLocaleLowerCase().includes(filterText));


    }
    hasNodeChild(node: TodoItemFlatNode): boolean {
        const parentNode = this.flatNodeMap.get(node);
        if (parentNode.children && parentNode.children.length > 0)
            return true;
        else
            return false;
    }
    descendantsAllSelected(node: TodoItemFlatNode): boolean {

        return this.selectedProducts.selected.findIndex(x => x.key == node.id) !== -1
    }
    descendantsPartiallySelected(node: TodoItemFlatNode): boolean {
        const descendants = this.treeControl.getDescendants(node);
        const result = descendants.some(child => this.selectedProducts.selected.findIndex(x => x.key == child.id) !== -1);
        return result && !this.descendantsAllSelected(node);
    }
    private getBrandName(node: TodoItemFlatNode): string {

        let finalParent: TodoItemFlatNode = node;
        while (true) {
            let parent = this.getParentNode(finalParent);
            if (parent !== null)
                finalParent = parent;
            else
                break;
        }
        return finalParent.item;
    }

    private getProductFullName(node: TodoItemFlatNode): string {
        let productName: string = node.item;
        let finalParent: TodoItemFlatNode = node;
        while (true) {
            finalParent = this.getParentNode(finalParent);
            if (finalParent !== null && this.getLevel(finalParent) > 0)
                productName = finalParent.item.concat(' '.concat(productName));
            else
                break;
        }
        return productName;
    }

    private checkAllParentsSelection(node: TodoItemFlatNode): void {
        let parent: TodoItemFlatNode | null = this.getParentNode(node);
        while (parent) {
            this.checkRootNodeSelection(parent);
            parent = this.getParentNode(parent);
        }
    }

    private checkRootNodeSelection(node: TodoItemFlatNode): void {
        const nodeSelected = this.checklistSelection.isSelected(node);
        const descendants = this.treeControl.getDescendants(node);
        const descAllSelected = descendants.length > 0 && descendants.every(child => {
            return this.checklistSelection.isSelected(child);
        });
        if (nodeSelected && !descAllSelected) {
            this.checklistSelection.deselect(node);
        } else if (!nodeSelected && descAllSelected) {
            this.checklistSelection.select(node);
        }
    }

    todoItemSelectionToggle(node: TodoItemFlatNode): void {
        this.checklistSelection.toggle(node);


        const descendants = this.treeControl.getDescendants(node);
        if (descendants.length == 0)
            descendants.push(node);
        else {

            this.checklistSelection.isSelected(node)
                ? this.checklistSelection.select(...descendants)
                : this.checklistSelection.deselect(...descendants);
        }


        if (this.checklistSelection.isSelected(node)) {
            descendants.forEach(element => {
                if (!this.hasNodeChild(element) && this.selectedProducts.selected.findIndex(x => x.key == node.id) == -1) {
                    this.selectedProducts.selected.push({
                        key: element.id, name: this.getProductFullName(element),
                        code: element.code, categoryName: this.getBrandName(element),
                        measurementMetricId: this.goodsInfo.measurementMetricId
                    });

                    this.toggleSlectedProductControl(element.id.toString());
                    this.selectedProducts$.push(this.selectedProducts.selected[this.selectedProducts.selected.length - 1]);
                }
            });

        }
        else {
            descendants.forEach(element => {
                if (!this.hasNodeChild(element)) {
                    const products = this.selectedProducts.selected.filter(x => x.key == element.id);
                    products.forEach(element => {
                        this.toggleSlectedProductControl(element.key.toString());
                        const index = this.selectedProducts.selected.findIndex(x => x.key == element.key);
                        if (index !== -1)
                            this.selectedProducts.selected.splice(index, 1);


                        const index2 = this.selectedProducts$.findIndex(x => x.key == element.key);
                        if (index2 !== -1)
                            this.selectedProducts$.splice(index2, 1);
                    });

                }
            });


        }


        this.checkAllParentsSelection(node);


    }

    private checkFormValidity(): boolean {
        let result: boolean = true;
        const controls = this.frmGoods.controls;
        for (const name in controls) {
            if (controls[name].invalid) {
                this._result.succeed = false;
                this._result.message = "There is atleast one unfilled element! Please fill all the elements in the all tabs";
                result = false;
                return result;
            }
        }
        if (this.selectedCat == 0 || this.selectedCat == null || this.selectedCat.toString() == "Select a category") {
            this._result.succeed = false;
            this._result.message = "Goods category is not selected! Please select a category and fill all properties";
            result = false;
            return result;
        }
        const propControls = this.frmProperties.controls;
        for (const name in propControls) {
            if (propControls[name].invalid) {
                this._result.succeed = true;
                this._result.message = "There is atleast one unfilled element! Please fill all the elements in the all tabs";
                this.frmProperties.markAllAsTouched();
                result = false;
                return result;
            }
        }

        Object.keys(this.frmSelectedProducts.controls).forEach(key => {

            if (this.frmSelectedProducts.controls[key].value == "") {
                this._result.succeed = true;
                this._result.message = "There is atleast one unfilled element! Please fill all the elements in the all tabs";
                this.frmSelectedProducts.markAllAsTouched();
                result = false;
                return result;
            }
        });



        this.selectedGoods.selected.forEach(element => {


            if (element.measurementMetricId == 1000691 && this.frmSelectedGoods.controls[element.key].value == '') {
                this._result.succeed = true;
                this._result.message = "There is atleast one unfilled element! Please fill all the elements in the all tabs";
                this.frmSelectedGoods.markAllAsTouched();
                result = false;
                return result;

            }
            else if (element.measurementMetricId == 1000692 &&
                (this.frmSelectedGoods.controls['mass'.concat(element.key)].value == '' ||
                    this.frmSelectedGoods.controls['massUnit'.concat(element.key)].value == 0)) {
                this._result.succeed = true;
                this._result.message = "There is atleast one unfilled element! Please fill all the elements in the all tabs";
                this.frmSelectedGoods.markAllAsTouched();
                result = false;
                return result;
            }
            else if (element.measurementMetricId == 1000693 &&
                (this.frmSelectedGoods.controls['width'.concat(element.key)].value == '' ||
                    this.frmSelectedGoods.controls['length'.concat(element.key)].value == '' ||
                    this.frmSelectedGoods.controls['areaUnit'.concat(element.key)].value == 0
                )) {
                this._result.succeed = true;
                this._result.message = "There is atleast one unfilled element! Please fill all the elements in the all tabs";
                this.frmSelectedGoods.markAllAsTouched();
                result = false;
                return result;
            }
            else if (element.measurementMetricId == 1000694 &&
                (this.frmSelectedGoods.controls['length'.concat(element.key)].value == '' ||
                    this.frmSelectedGoods.controls['lengthUnit'.concat(element.key)].value == 0
                )) {
                this._result.succeed = true;
                this._result.message = "There is atleast one unfilled element! Please fill all the elements in the all tabs";
                this.frmSelectedGoods.markAllAsTouched();
                result = false;
                return result;
            }

        });

        return result;
    }
    setProductViewMode(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            this.isLoading = true;

            if (event.source.value == 1) {
                return this.goodsService.getFinalProductList(this.productInfo).pipe(takeUntil(this._unsubscribeAll))
                    .subscribe((products: any) => {
                        this.products = this.products$ = products.data.products;
                        this.productPagination = { ...products.data.page };
                        this.productPagination.pageNumber = this.productPagination.pageNumber - 1;
                        this.setProductPaginatorAndSort();
                        this._database.initialize([]);
                        this.setGoodsProducts();
                        this.isLoading = false;
                        this.productViewMode = event.source.value;
                        this._changeDetectorRef.markForCheck();
                    });;
            }
            else if (event.source.value == 2) {
                this.getProductsTree(this.brands).pipe(takeUntil(this._unsubscribeAll))
                    .subscribe((products: any) => {
                        products = products.reduce((acc, cur) => acc.concat(cur.data), []);
                        this._database.initialize(products);
                        this.setGoodsProducts();
                        this.isLoading = false;
                        this.productViewMode = event.source.value;
                        this._changeDetectorRef.markForCheck();
                    });
            }
        }



    }

    setGoodsSelectedItemsDisplayMode(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            this.isLoading = true;

            if (event.source.value == 1) {
                return this.goodsService.getFinalProductList(this.productInfo).pipe(takeUntil(this._unsubscribeAll))
                    .subscribe((products: any) => {
                        this.products = this.products$ = products.data.products;
                        this.productPagination = { ...products.data.page };
                        this.productPagination.pageNumber = this.productPagination.pageNumber - 1;
                        this.setProductPaginatorAndSort();
                        this._database.initialize([]);
                        this.setGoodsProducts();
                        this.isLoading = false;
                        this.productViewMode = event.source.value;
                        this._changeDetectorRef.markForCheck();
                    });;
            }
            else if (event.source.value == 2) {

            }
        }



    }

    private getSelectedGoods(): Array<Measure> {

        let children: Array<Measure> = [];
        this.selectedGoods.selected.forEach(element => {
            const item: Measure = new Measure();
            item.key = element.key;

            switch (element.measurementMetricId) {
                case 1000691:
                    item.itemId = 1000711;
                    item.measure = this.frmSelectedGoods.controls[element.key].value;
                    item.unitId = 0;
                    children.push(item);
                    break;
                case 1000692:
                    item.itemId = 1000712;
                    item.measure = this.frmSelectedGoods.controls[`mass${element.key}`].value;
                    item.unitId = this.frmSelectedGoods.controls[`massUnit${element.key}`].value;
                    children.push(item);
                    break;
                case 1000693:
                    const widthItem: Measure = new Measure();
                    widthItem.key = element.key;
                    widthItem.itemId = 1000713;
                    widthItem.measure = this.frmSelectedGoods.controls[`width${element.key}`].value;
                    widthItem.unitId = this.frmSelectedGoods.controls[`areaUnit${element.key}`].value;
                    children.push(widthItem);

                    const lengthItem: Measure = new Measure();
                    lengthItem.key = element.key;
                    lengthItem.itemId = 1000714;
                    lengthItem.measure = this.frmSelectedGoods.controls[`length${element.key}`].value;
                    lengthItem.unitId = this.frmSelectedGoods.controls[`areaUnit${element.key}`].value;
                    children.push(lengthItem);
                    break;
                case 1000694:
                    item.itemId = 1000714;
                    item.measure = this.frmSelectedGoods.controls[`length${element.key}`].value;
                    item.unitId = this.frmSelectedGoods.controls[`lengthUnit${element.key}`].value;
                    children.push(item);
                    break;
                default:
                    // Handle other cases if needed
                    break;
            }
        });
        return children;
    }

    private getSelectedProducts(): Array<GoodsMeasure> {

        let products: GoodsMeasure[] = [];

        this.selectedProducts.selected.forEach(element => {
            const item: GoodsMeasure = new GoodsMeasure();
            item.key = element.key;
            item.conformityId = this.frmSelectedProducts.controls['conformity' + element.key].value;

            switch (element.measurementMetricId) {
                case 1000691:
                    item.itemId = 1000711;
                    item.measure = this.frmSelectedProducts.controls[element.key].value;
                    item.unitId = 0;
                    break;
                case 1000692:
                    item.itemId = 1000712;
                    item.measure = this.frmSelectedProducts.controls['mass' + element.key].value;
                    item.unitId = this.frmSelectedProducts.controls['massUnit' + element.key].value;
                    break;
                case 1000693:
                    const widthItem: GoodsMeasure = new GoodsMeasure();
                    widthItem.key = element.key;
                    widthItem.itemId = 1000713;
                    widthItem.measure = this.frmSelectedProducts.controls['width' + element.key].value;
                    widthItem.unitId = this.frmSelectedProducts.controls['areaUnit' + element.key].value;
                    widthItem.conformityId = item.conformityId;
                    products.push(widthItem);

                    item.itemId = 1000714;
                    item.measure = this.frmSelectedProducts.controls['length' + element.key].value;
                    item.unitId = this.frmSelectedProducts.controls['areaUnit' + element.key].value;
                    break;
                case 1000694:
                    item.itemId = 1000714;
                    item.measure = this.frmSelectedProducts.controls['length' + element.key].value;
                    item.unitId = this.frmSelectedProducts.controls['lengthUnit' + element.key].value;
                    break;
                default:
                    // Handle other cases if needed
                    break;
            }

            products.push(item);
        });
        return products;
    }

    save() {
        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');
        if (!this.checkFormValidity()) {
            this.showAlert('errorMessage');
            return;
        }
        this.isLoading = true;
        this.goodsInfo.materialList = [];
        this.goodsInfo.propertyList = [];
        this.goodsInfo.productsList = [];
        this.goodsInfo.childrenList = [];
        this.goodsInfo.categoryId = this.selectedCat;
        this.goodsInfo.goodsCode = this.frmGoods.controls['code'].value;
        this.goodsInfo.goodsName = this.frmGoods.controls['name'].value;
        this.goodsInfo.orderDeadline = this.frmGoods.controls['orderDeadline'].value;
        this.goodsInfo.criticalPoint = this.frmGoods.controls['criticalPoint'].value;
        this.goodsInfo.technicalNumber = this.frmGoods.controls['technicalNumber'].value;
        this.goodsInfo.status = this.frmGoods.controls['status'].value;
        this.goodsInfo.objectWeight = this.frmGoods.controls['weight'].value;
        this.goodsInfo.weightUnitId = this.frmGoods.controls['weightUnit'].value;
        this.goodsInfo.hasGoodsCover = this.frmGoods.controls['cover'].value;
        this.goodsInfo.reductionTimingId = this.frmGoods.controls['reductionTiming'].value;
        this.goodsInfo.language = 'EN';


        Object.keys(this.frmProperties.controls).forEach(key => {

            this.goodsInfo.propertyList.push({ key: Number(key), value: this.frmProperties.controls[key].value });

        });





        this.goodsInfo.childrenList = this.getSelectedGoods();
        this.goodsInfo.productsList = this.getSelectedProducts();

        if (this.pageType == 'new')
            this.create();
        else
            this.edit();


    }

    private create() {

        this.goodsService.create(this.goodsInfo).subscribe(res => {
            this.isLoading = false;
            this._result.succeed = res.succeed;
            this._result.message = res.message;
            if (this._result.succeed)
                this.showAlert('successMessage');
            else
                this.showAlert('errorMessage');

        });
    }

    private edit() {

        this.goodsService.edit(this.goodsInfo).subscribe(res => {
            this.isLoading = false;
            this._result.succeed = res.succeed;
            this._result.message = res.message;
            if (this._result.succeed)
                this.showAlert('successMessage');
            else
                this.showAlert('errorMessage');

        });
    }


}




export class TodoItemNode {
    children: TodoItemNode[];
    item: string;
    id: number;
    code: string;
    status: number;
}

/** Flat to-do item node with expandable and level information */
export class TodoItemFlatNode {
    item: string;
    id: number;
    code: string;
    parentId: number;
    status: number;
    levelId: number;
    expandable: boolean;
}


@Injectable()
export class ChecklistDatabase {
    dataChange = new BehaviorSubject<TodoItemNode[]>([]);

    get data(): TodoItemNode[] { return this.dataChange.value; }

    constructor() {
        //this.initialize(treeData);
    }
    initialize(treeData: Array<TodoItemFlatNode>) {

        // Build the tree nodes from Json object. The result is a list of `TodoItemNode` with nested
        //     file node as children.


        // this.api.getGoodsCats().subscribe(res => {
        const data = this.buildTree(treeData, treeData, 0);
        this.dataChange.next(data);
        // })

        /*   const data = this.buildFileTree(TREE_DATA, 0);
      
          // Notify the change.
          this.dataChange.next(data); */
    }

    /**
     * Build the file structure tree. The `value` is the Json object, or a sub-tree of a Json object.
     * The return value is the list of `TodoItemNode`.
     */
    buildFileTree(obj: { [key: string]: any }, level: number): TodoItemNode[] {
        return Object.keys(obj).reduce<TodoItemNode[]>((accumulator, key) => {
            const value = obj[key];
            const node = new TodoItemNode();
            node.item = key;

            if (value != null) {
                if (typeof value == 'object') {
                    node.children = this.buildFileTree(value, level + 1);
                } else {
                    node.item = value;
                }
            }

            return accumulator.concat(node);
        }, []);
    }

    buildTree(filteredArray: Array<TodoItemFlatNode>, baseArray: Array<TodoItemFlatNode>, level: number): TodoItemNode[] {
        let Filterredproducts = filteredArray.filter(x => x.levelId == level);
        let tree: Array<TodoItemNode> = new Array<TodoItemNode>();

        Filterredproducts.forEach(element => {
            const node = new TodoItemNode();
            node.id = element.id;
            node.code = element.code;
            node.item = element.item;
            node.status = element.status;
            let children = baseArray.filter(x => x.levelId == level + 1 && x.parentId == element.id);
            node.children = this.buildTree(children, baseArray, level + 1);
            tree.push(node);
        })

        return tree;
    }
    private addChildren(flatList: any, id: number): any {
        let children = products.filter(x => x.parentId == id);
        children.forEach(element => {
            flatList = this.addToFlatList(flatList, element.id);
            flatList = this.addChildren(flatList, element.id);
        });
        return flatList;
    }
    private addParents(flatList: any, parentId: number): any {
        const indx = products.findIndex(x => x.id == parentId);
        if (indx !== -1) {
            flatList = this.addToFlatList(flatList, products[indx].id);
            if (products[indx].parentId > 0)
                flatList = this.addParents(flatList, products[indx].parentId);
        }
        return flatList;
    }
    private addToFlatList(flatList: Array<TodoItemFlatNode>, id: number): any {
        if (flatList.findIndex(x => x.id == id) == -1) {
            const indx = products.findIndex(x => x.id == id);
            flatList.push(products[indx]);
        }
        return flatList;

    }

    public filter(filterText: string) {
        let filteredTreeData: Array<TodoItemFlatNode> = [];
        let count: number = 0;
        if (filterText) {
            filteredTreeData = products.filter(d => d.item.toLocaleLowerCase().indexOf(filterText.toLocaleLowerCase()) > -1);
            filteredTreeData.forEach(element => {
                count = count + 1;
                filteredTreeData = this.addParents(filteredTreeData, element.parentId);
                filteredTreeData = this.addChildren(filteredTreeData, element.id);
            });
        } else {
            filteredTreeData = products;
        }

        // Build the tree nodes from Json object. The result is a list of `TodoItemNode` with nested
        // file node as children.

        const data = this.buildTree(filteredTreeData, filteredTreeData, 0);

        // Notify the change.
        this.dataChange.next(data);
    }

    /** Add an item to to-do list */
    insertItem(parent: TodoItemNode, name: string, id: number, status: number, code: string) {
        const child = <TodoItemNode>{ item: name, id: id, code: code, status: status, children: [], isSelected: false, parentId: null };
        if (parent == undefined) {
            this.data.push(child);
        }
        else if (parent.children) { // parent already has children
            parent.children.push(child);
        }
        else { // if parent is a leaf node
            parent.children = [];
            parent.children.push(child);
        }

        this.dataChange.next(this.data);

    }
    removeItem(parent: TodoItemNode) {
        const index: number = parent.children.map(function (e) { return e.item; }).indexOf('');
        if (index !== -1) {
            parent.children.splice(index, 1);
            this.dataChange.next(this.data);
        }
    }

    updateItem(node: TodoItemNode, name: string, id: number, status: number) {
        node.item = name;
        node.id = id;
        node.status = status;
        this.dataChange.next(this.data);
    }
}

