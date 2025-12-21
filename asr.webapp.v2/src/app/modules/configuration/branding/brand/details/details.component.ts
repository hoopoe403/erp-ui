import { ChangeDetectorRef, Component, ElementRef, Injectable, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { Paging } from "app/core/type/paging/paging.type";
import { BrandService } from "../brand.service";
import { ActivatedRoute } from "@angular/router";
import { FuseAlertService } from "@fuse/components/alert";
import { BehaviorSubject, forkJoin,  fromEvent,  merge, Observable, Subject } from "rxjs";
import { Brand } from "../brand.type";
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { FlatTreeControl } from "@angular/cdk/tree";
import { DataSource, SelectionModel } from "@angular/cdk/collections";
import { Product } from "../../product/product.types";
import { GoodsMeasure, HierarchicalKeyValue, KeyValue } from "app/core/type/key-value/key-value.type";
import {  debounceTime, distinctUntilChanged, map, switchMap, takeUntil } from "rxjs/operators";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort"; 
import { BrandDialogComponent } from "../dialogDetail/dialog.component";
import { MatDialog } from "@angular/material/dialog";
import { OpResult } from "app/core/type/result/result.types";
import { MatMenuTrigger } from "@angular/material/menu";
import { Goods } from "app/modules/inventory/goods/goods/goods.types";
import { MatTabGroup } from "@angular/material/tabs/tab-group";
import { Units } from "app/modules/configuration/measurement/unit/unit.types";
import { ProductPropertiesDialogComponent } from "../../product/properties-dialog/properties-dialog.component";
import { ProductPropertiesDialogResult } from "../../product/properties-dialog/properties-dialog.types";
import { MatSnackBar } from "@angular/material/snack-bar";

let tableName: string;


@Component({
    selector: 'brand-details',
    templateUrl: './details.component.html',
    styles: [
        /* language=SCSS */
        `     
            .goods-mixture-grid {
                grid-template-columns:25px 112px auto 400px;

                @screen sm {
                    grid-template-columns:25px 112px auto ;
                }

                @screen md {
                    grid-template-columns:25px 112px auto ;
                }

                @screen lg {
                    grid-template-columns:25px 200px auto 350px;
                }
            }
            .selected-goods-grid {
                grid-template-columns:150px 500px 150px 20px;

                @screen sm {
                    grid-template-columns:auto  auto ;
                }

                @screen md {
                    grid-template-columns: 150px 500px 150px 20px;
                }

                @screen lg {
                    grid-template-columns: 150px auto 450px;
                }
            }
            
        `
    ],
    encapsulation: ViewEncapsulation.None,
})

export class BrandDetailsComponent implements OnInit {
    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
    @ViewChild('goodsSort') private goodsSort: MatSort;
    @ViewChild('goodsPaginator') goodsPaginator: MatPaginator;
    @ViewChild("tabGroup") tabGroup: MatTabGroup;
    @ViewChild('goodsFilter', { static: true }) goodsFilter: ElementRef;
    pagination: Paging;
    frmBrands: FormGroup;
    goods: Array<Goods> = [];
    goods$: Array<Goods> = [];
    goodsMixtureInfo: Goods = new Goods();
    _resultStepOne: OpResult = new OpResult();
    _resultStepTwo: OpResult = new OpResult();
    brands: Array<KeyValue> = [];
    menuArray = [];
    selectedCat: number = 0;
    selectedGoods$: Array<any> = [];
    massUnitData: Array<Units>;
    lengthUnitData: Array<Units>;
    areaUnitData: Array<Units>;
    disMixtureTab: boolean = true;
    product: Product = new Product();
    // selection = new SelectionModel<any>(true, []);
    disableMixtureApply: boolean = true;
    frmSelectedGoods = new FormGroup({});
    frmAdvancedSearch = new FormGroup({
        code: new FormControl(),
        name: new FormControl(),
       }); 
    public pageType: string;
    public titleInfo: string;
    public isLoading: boolean = false;
    public brand: Brand;
    private _unsubscribeAll: Subject<any>;
    private id : number;
    organizations: Array<{ key: number, value: string }> = [];
    public products: Product[] = [];
    selectedGoods = new SelectionModel<any>(true, []);
    


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
 
     getLevel = (node: TodoItemFlatNode) => node.level;
 
     isExpandable = (node: TodoItemFlatNode) => node.expandable;
 
     getChildren = (node: TodoItemNode): TodoItemNode[] => node.children;
 
     hasChild = (_: number, _nodeData: TodoItemFlatNode) => _nodeData.expandable;
 
     hasNoContent = (_: number, _nodeData: TodoItemFlatNode) => _nodeData.item === '';
 
     editMode: number = 0;
 
     /**
      * Transformer to convert nested node to flat node. Record the nodes in maps for later use.
      */
     transformer = (node: TodoItemNode, level: number) => {
         const existingNode = this.nestedNodeMap.get(node);
         const flatNode = existingNode && existingNode.item === node.item
             ? existingNode
             : new TodoItemFlatNode();
         flatNode.item = node.item;
         flatNode.status = node.status;
         flatNode.code = node.code;
         flatNode.id = node.id;
         flatNode.level = level;
         flatNode.expandable = !!node.children?.length;
         this.flatNodeMap.set(flatNode, node);
         this.nestedNodeMap.set(node, flatNode);
         return flatNode;
     }
     /* ---------------------------------product-section------------------------------ */



    constructor(
        private service: BrandService,
        private _formBuilder: FormBuilder,
        private cdr: ChangeDetectorRef,
        private route: ActivatedRoute,
        private _dialogService: MatDialog,
        private _fuseAlertService: FuseAlertService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _snackBar: MatSnackBar
    ) {
        this._unsubscribeAll = new Subject();
        this.brand = new Brand();
        this.pagination = new Paging();
        this._database = new ChecklistDatabase();

        this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel,
            this.isExpandable, this.getChildren);
        this.treeControl = new FlatTreeControl<TodoItemFlatNode>(this.getLevel, this.isExpandable);
        this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

        this._database.dataChange.subscribe(data => {
            this.dataSource.data = data;
        });
    }

    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    /**
     * on init
     */
    ngOnInit(): void {
        this.frmBrands = this.createFormObject();
        this.getOrganizations();
        this.initialGoodsMixturePaging();
        this.product.goodsList = [];
        this.getGoodsCat();
        this.id = Number(this.route.snapshot.paramMap.get('id'));
        if(this.id > 0) {
            this.pageType = 'edit';
            this.getById(this.id);    
        }else{
            this.pageType = 'new';
        }
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

 

    private getById(id : number){
        this.isLoading = true;

        forkJoin(
            this.getBrand(id),
            this.getProducts(id),
            this.getUnits(),
            this.getOrganizations()
        ).subscribe(res =>{
            this.setForkJoinValuesInEditMode(res);
            this.isLoading = false;
            this.setFormValues();
            this.cdr.detectChanges();
        })

    }

    private setForkJoinValuesInEditMode(values: Array<any>): void {
        this.brand = values[0].data;
        this.titleInfo = this.brand.brandName
        this.products = values[1].data;
        this._database.initialize(this.products);
        this.setPaginatorAndSort();
        this.getGoods(this.goodsMixtureInfo);
        this.massUnitData = values[2].data.filter(x => x.measurementMetricId === 1000692);
        this.lengthUnitData = values[2].data.filter(x => x.measurementMetricId === 1000694);
        this.areaUnitData = values[2].data.filter(x => x.measurementMetricId === 1000693);
        this.organizations = values[3].data;
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
                    return this.service.getGoodsForMixture(this.goodsMixtureInfo);
                }),
                map((res) => {
                    this.goods$ = this.goods  = res.data.goods;
                    this.pagination = { ...res.data.page };
                    this.pagination.pageNumber = this.pagination.pageNumber - 1;
                    this.isLoading = false;
                    this._changeDetectorRef.detectChanges();
                })
            ).subscribe();
        }
    }


    private getProducts(id : number) : Observable<any>{
        return this.service.getProducts({ brandId: id })
    }

    private getUnits(): Observable<any> {
        return this.service.getUnits();
    }

    private getBrand(id: number): Observable<any> {
        return this.service.getBrand(id);
    }

    private getOrganizations() {
        return  this.service.getDrpOrganization();
    }

    private showAlert(name: string): void {
        this._fuseAlertService.show(name);
    }

    private dismissAlert(name: string): void {
        this._fuseAlertService.dismiss(name);
    }

    private initialGoodsMixturePaging() {
        this.pagination = new Paging();
        this.pagination.flag = true;
        this.pagination.length = 0;
        this.pagination.order = 'desc';
        this.pagination.pageNumber = 0;
        this.pagination.pageSize = 100;
        this.pagination.sort = '';
        this.goodsMixtureInfo.page = { ...this.pagination };
        this.goodsMixtureInfo.page.pageNumber = this.goodsMixtureInfo.page.pageNumber + 1;
        this.goodsMixtureInfo.status = 1;
    }

    private getGoods(info: Goods) {
        this.isLoading = true;
        this.service.getGoodsForMixture(info)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((goods: any) => {
                this.goods$ = this.goods = goods.data.goods;
                this.pagination = { ...goods.data.page };
                this.pagination.pageNumber = this.pagination.pageNumber - 1;
                this.isLoading = false;
                this._changeDetectorRef.markForCheck();
            });
    }

    


    private createFormObject(): FormGroup {

        return this._formBuilder.group({
            id: [this.brand.brandId],
            brandCode: [ this.brand.brandCode],
            brandName: [ this.brand.brandName, Validators.required],
            serialPrefix: [ this.brand.serialPrefix , Validators.required],
            serialStartPoint: [ this.brand.serialStartPoint , Validators.required],
            priceIncrement: [ this.brand.priceIncrement],
            priceExpiration: [ this.brand.priceExpireDay, Validators.required],
            organization: [ this.brand.organizationId, Validators.required],
            status: [ this.brand.status, Validators.required]
        }
        );
    }

    private setFormValues() {
        this.frmBrands.controls["brandCode"].setValue(this.brand.brandCode);
        this.frmBrands.controls["brandName"].setValue(this.brand.brandName);
        this.frmBrands.controls["serialPrefix"].setValue(this.brand.serialPrefix);
        this.frmBrands.controls["serialStartPoint"].setValue(this.brand.serialStartPoint);
        this.frmBrands.controls["priceIncrement"].setValue(this.brand.priceIncrement);
        this.frmBrands.controls["priceExpiration"].setValue(this.brand.priceExpireDay);
        this.frmBrands.controls["organization"].setValue(this.brand.organizationId);
        this.frmBrands.controls["status"].setValue(this.brand.status);
   }

   saveStep1(){
    let formResult: boolean;
    formResult = this.checkBrandsFormValidity();
    if (!formResult) {
        this.showAlert('errorMessage');
        this.cdr.detectChanges();
        return;
      }
      this.isLoading = true;
      const data = {
        brandId: this.frmBrands.controls['id'].value ? this.frmBrands.controls['id'].value : 0,
        brandCode: this.frmBrands.controls['code'].value,
        brandName: this.frmBrands.controls['name'].value,
        serialPrefix: this.frmBrands.controls['serialPrefix'].value,
        serialStartPoint: this.frmBrands.controls['serialStartPoint'].value,
        priceIncrement: Number(this.frmBrands.controls['priceIncrement'].value),
        priceExpireDay: Number(this.frmBrands.controls['priceExpiration'].value),
        organizationId: Number(this.frmBrands.controls['organization'].value),
        status: this.frmBrands.controls['status'].value ? 1 : 0
    }
      if(this.pageType === 'new')
         this.createBrand(data)
      else
         this.editBrand(data)
   }

   private checkBrandsFormValidity(): boolean {

    const controls = this.frmBrands.controls;
    for (const name in controls) {
      if (controls[name].invalid) {
        this._resultStepOne.succeed = false;
        this._resultStepOne.message = "There is atleast one unfilled element! Please fill all the elements in the all tabs";
        return false;
      }
    }
   }

   private createBrand(data){
    this.dismissAlert('successMessage');
    this.dismissAlert('errorMessage');
    this.service.saveBrand(data).subscribe(res => {
      this.isLoading = false;
      this._resultStepOne.succeed = res.succeed;
      this._resultStepOne.message = res.message;
      if (this._resultStepOne.succeed)
        this.showAlert('successMessage');
      else
        this.showAlert('errorMessage');
      this.cdr.detectChanges();
    });
   }

   private editBrand(data) {
    this.service.editBrand(data).subscribe(res => {
      this.isLoading = false;
      this._resultStepOne.succeed = res.succeed;
      this._resultStepOne.message = res.message;
      if (this._resultStepOne.succeed)
        this.showAlert('successMessage');
      else
        this.showAlert('errorMessage');
      this.cdr.detectChanges();
    });
  }

   

   hasNodeChild(node: TodoItemFlatNode): boolean {
    const parentNode = this.flatNodeMap.get(node);
    if (parentNode.children && parentNode.children.length > 0)
        return true;
    else
        return false;
    }


    filterChanged(filterText: string) {
        if (filterText.length >= 3 || filterText.length === 0) {
            this._database.filter(filterText);
            if (filterText) {
                this.treeControl.expandAll();
            } else {
                this.treeControl.collapseAll();
            }
        }
    }



    showEditProductDialog(pro: TodoItemFlatNode = null) {
        const indx = this.products.findIndex(x => x.productId === pro.id);
        let data = this.products[indx];

        this._dialogService.open(BrandDialogComponent, {
            panelClass: 'category-form-dialog',
            data: data
        }).afterClosed().subscribe(saved => {
            if (saved) {
                this.service.getBrand(this.brand.brandId).subscribe(res => {
                    this.brand = res.data;
                })
            }
        });
    }


    showAddProductDialogNoItem() {
        let id: number;
        if (this.brand.brandId !== 0)
            id = this.brand.brandId;
        else
            id = Number(this.route.snapshot.paramMap.get('id'));
        this._dialogService.open(BrandDialogComponent, {
            panelClass: 'category-form-dialog',
            data: { brandId: id, parentId: 0 }
        }).afterClosed().subscribe(saved => {
            if (saved) {
                this.service.getBrand(this.brand.brandId).subscribe(res => {
                    this.brand = res.data;
                })
            }
        });
    }


    hasNodeChildById(): boolean {
        if (this.selectedInfoRow.item) {
            const indx = this.treeControl.dataNodes.findIndex(x => x.id === this.selectedInfoRow.id);
            if (indx === -1)
                return true;
            else
                return this.hasNodeChild(this.treeControl.dataNodes[indx]);
        }
        else
            return true;
    }



    showMixtureTab() {
        this.disableMixtureApply = false;
        this.tabGroup.selectedIndex = 2;
        this.product.productId = this.selectedInfoRow.id;

        this.selectedGoods.clear();
        this.selectedGoods$ = [];
        this.removeAllSelectedControls();

        this.service.getProductGoods(this.product.productId).subscribe(res => {
            this.product.goodsList = res.data;
            this.setGoodsMixture();
        });

    }


    private removeAllSelectedControls() {
        Object.keys(this.frmSelectedGoods.controls).forEach(key => {
            this.frmSelectedGoods.removeControl(key);
        });
    }

    

    setGoodsMixture() {
        this.product.goodsList.forEach(element => {
            if (this.selectedGoods.selected.findIndex(x => x.goodsId === element.key) === -1) {
                this.selectedGoods.selected.push({
                    goodsId: element.key, goodsName: element.name,
                    goodsCode: element.code, categoryName: element.categoryName,
                    measurementMetricId: element.itemId
                });

                this.toggleSelectedGoodsControl(element.key.toString());
            }
            this.selectedGoods$.push(this.selectedGoods.selected[this.selectedGoods.selected.length - 1]);
            this.setGoodsMixtureValue(element);
        });
    }

    

    isGoodsSelected(row: any): boolean {

        const indx = this.product.goodsList.map(function (e) { return e.key; }).indexOf(row.goodsId);
        if (indx == -1)
            return false;
        else
            return true;
    }


    private toggleSelectedGoodsControl(controlId: string) {
        let control = this.frmSelectedGoods.controls[controlId];
        if (control)
            this.removeSelectedGoodsContols(Number(controlId));
        else {
            this.addSelectedGoodsContols(Number(controlId));
        }
    }


    private removeSelectedGoodsContols(goodsId: number) {
        const indx = this.selectedGoods.selected.findIndex(x => x.goodsId === goodsId);
        const goods = this.selectedGoods.selected[indx];
        if (goods.measurementMetricId === 1000691)
            this.frmSelectedGoods.removeControl(goodsId.toString());
        else if (goods.measurementMetricId === 1000692) {
            this.frmSelectedGoods.removeControl('mass'.concat(goodsId.toString()));
            this.frmSelectedGoods.removeControl('massUnit'.concat(goodsId.toString()));
            this.frmSelectedGoods.removeControl(goodsId.toString());
        }
        else if (goods.measurementMetricId === 1000693) {
            this.frmSelectedGoods.removeControl('length'.concat(goodsId.toString()));
            this.frmSelectedGoods.removeControl('width'.concat(goodsId.toString()));
            this.frmSelectedGoods.removeControl('areaUnit'.concat(goodsId.toString()));
            this.frmSelectedGoods.removeControl(goodsId.toString());
        }
        else if (goods.measurementMetricId === 1000694) {
            this.frmSelectedGoods.removeControl('length'.concat(goodsId.toString()));
            this.frmSelectedGoods.removeControl('lengthUnit'.concat(goodsId.toString()));
            this.frmSelectedGoods.removeControl(goodsId.toString());
        }
        this.frmSelectedGoods.removeControl('conformity'.concat(goodsId.toString()));

    }


    private addSelectedGoodsContols(goodsId: number) {
        const indx = this.selectedGoods.selected.findIndex(x => x.goodsId === goodsId);
        const goods = this.selectedGoods.selected[indx];
        if (goods.measurementMetricId === 1000691)
            this.frmSelectedGoods.addControl(goodsId.toString(), new FormControl('', Validators.required));
        else if (goods.measurementMetricId === 1000692) {
            this.frmSelectedGoods.addControl('mass'.concat(goodsId.toString()), new FormControl('', Validators.required));
            this.frmSelectedGoods.addControl('massUnit'.concat(goodsId.toString()), new FormControl('', Validators.required));
            this.frmSelectedGoods.addControl(goodsId.toString(), new FormControl('', Validators.required));
        }
        else if (goods.measurementMetricId === 1000693) {
            this.frmSelectedGoods.addControl('length'.concat(goodsId.toString()), new FormControl('', Validators.required));
            this.frmSelectedGoods.addControl('width'.concat(goodsId.toString()), new FormControl('', Validators.required));
            this.frmSelectedGoods.addControl('areaUnit'.concat(goodsId.toString()), new FormControl('', Validators.required))
            this.frmSelectedGoods.addControl(goodsId.toString(), new FormControl('', Validators.required));
        }
        else if (goods.measurementMetricId === 1000694) {
            this.frmSelectedGoods.addControl('length'.concat(goodsId.toString()), new FormControl('', Validators.required));
            this.frmSelectedGoods.addControl('lengthUnit'.concat(goodsId.toString()), new FormControl('', Validators.required))
            this.frmSelectedGoods.addControl(goodsId.toString(), new FormControl('', Validators.required));
        }
        this.frmSelectedGoods.addControl('conformity'.concat(goodsId.toString()), new FormControl('', Validators.required));
        this.frmSelectedGoods.controls['conformity'.concat(goodsId.toString())].setValue(1000650);
    }


    private setGoodsMixtureValue(goodsInfo: GoodsMeasure) {
        const indx = this.selectedGoods.selected.findIndex(x => x.goodsId === goodsInfo.key);
        const goods = this.selectedGoods.selected[indx];
        if (goods.measurementMetricId === 1000691)
            this.frmSelectedGoods.controls[goodsInfo.key].setValue(goodsInfo.measure);
        else if (goods.measurementMetricId === 1000692) {
            this.frmSelectedGoods.controls['mass'.concat(goodsInfo.key.toString())].setValue(goodsInfo.measure);
            this.frmSelectedGoods.controls['massUnit'.concat(goodsInfo.key.toString())].setValue(goodsInfo.unitId);;
        }
        else if (goods.measurementMetricId === 1000693) {

            if (goodsInfo.itemId === 1000713 || goodsInfo.itemId === 1000711)
                this.frmSelectedGoods.controls['width'.concat(goodsInfo.key.toString())].setValue(goodsInfo.measure);
            else if (goodsInfo.itemId === 1000714 || goodsInfo.itemId === 1000711)
                this.frmSelectedGoods.controls['length'.concat(goodsInfo.key.toString())].setValue(goodsInfo.measure);

            this.frmSelectedGoods.controls['areaUnit'.concat(goodsInfo.key.toString())].setValue(goodsInfo.unitId);
        }
        else if (goods.measurementMetricId === 1000694) {

            this.frmSelectedGoods.controls['length'.concat(goodsInfo.key.toString())].setValue(goodsInfo.measure);

            this.frmSelectedGoods.controls['lengthUnit'.concat(goodsInfo.key.toString())].setValue(goodsInfo.unitId);
        }
        this.frmSelectedGoods.controls['conformity'.concat(goodsInfo.key.toString())].setValue(goodsInfo.conformityId);
    }


    changeGoodsCheckBox(goodsId: number) {
        const indx = this.selectedGoods.selected.findIndex(x => x.goodsId == goodsId);
        if (indx !== -1)
            this.toggleSelectedGoodsControl(goodsId.toString());
            this.selectedGoods.selected.splice(indx, 1);
            const index2 = this.selectedGoods$.findIndex(x => x.goodsId === goodsId);
                if (index2 !== -1)
                    this.selectedGoods$.splice(index2, 1);
        else{
            this.addToSelectedGoodsSelection(goodsId);
            this.selectedGoods$.push(this.selectedGoods.selected[this.selectedGoods.selected.length - 1]);
            this.toggleSelectedGoodsControl(goodsId.toString());
        }
    }



    private addToSelectedGoodsSelection(goodsId: number) {
        const indx = this.goods.findIndex(x => x.goodsId === goodsId);
        let goods = this.goods[indx];
        this.selectedGoods.selected.push({
            goodsId: goods.goodsId, goodsName: goods.goodsName,
            goodsCode: goods.categoryGoodsCode, categoryName: goods.categoryName,
            measurementMetricId: goods.measurementMetricId
        });
    }

    



    applyFilterOnSelectedGoods(filterValue: string) {
        this.selectedGoods$ = this.selectedGoods.selected.filter(x => x.goodsCode.includes(filterValue.trim().toLowerCase()) ||
            x.goodsName.toLowerCase().includes(filterValue.trim().toLowerCase()) ||
            x.categoryName.toLowerCase().includes(filterValue.trim().toLowerCase()));
    }

    

    showAddProductDialog(parent: TodoItemFlatNode = null) {
        const indx = this.products.findIndex(x => x.productId === parent.id);
        let parentInfo = this.products[indx];
        let data = { brandId: parentInfo.brandId, parentID: parent.id, productId: 0 };
        this._dialogService.open(BrandDialogComponent, {
            panelClass: 'category-form-dialog',
            data: data
        }).afterClosed().subscribe(saved => {
            if (saved) {
                this.service.getBrand(this.brand.brandId).subscribe(res => {
                    this.brand = res.data;
                })
            }
        });
    }

    /**
     * Open product properties dialog to manage units
     */
    openPropertiesDialog(node: TodoItemFlatNode): void {
        const indx = this.products.findIndex(x => x.productId === node.id);
        if (indx === -1) {
            this._snackBar.open('Product not found', null, { duration: 2000 });
            return;
        }
        
        const product = this.products[indx];
        
        const dialogRef = this._dialogService.open(ProductPropertiesDialogComponent, {
            width: '950px',
            maxHeight: '90vh',
            data: {
                product: product,
                title: 'Product Properties'
            }
        });

        dialogRef.afterClosed().subscribe((result: ProductPropertiesDialogResult) => {
            if (result && result.saved) {
                // Update the product with the new units
                product.units = result.units;
                
                // TODO: Call API to save units to backend
                // this.service.updateProductUnits(product.productId, result.units).subscribe(...)
                
                this._snackBar.open('Product units updated successfully', null, { duration: 3000 });
                this._changeDetectorRef.markForCheck();
            }
        });
    }



    save() {
        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');
        if (!this.checkFormValidity()) {
            this.showAlert('errorMessage');
            return;
        }
        this.isLoading = true;
        this.product.goodsList = [];
        this.product.goodsList = this.getSelectedGoods();
        this.service.setProductGoods(this.product).subscribe(res => {
            this.isLoading = false;
            this._resultStepTwo.succeed = res.succeed;
            this._resultStepTwo.message = res.message;
            if (this._resultStepTwo.succeed)
                this.showAlert('successMessage');
            else
                this.showAlert('errorMessage');

        });


    }

    private getSelectedGoods(): Array<GoodsMeasure> {
        let children: Array<GoodsMeasure> = [];
        this.selectedGoods.selected.forEach(element => {
            const item: GoodsMeasure = new GoodsMeasure();
            item.key = element.key;
            switch (element.measurementMetricId) {
                case 1000691:
                    item.key = element.goodsId;
                    item.itemId = 1000711;
                    item.measure = this.frmSelectedGoods.controls[element.goodsId].value;
                    item.unitId = 0;
                    item.conformityId = this.frmSelectedGoods.controls['conformity'.concat(element.goodsId)].value;
                    children.push(item);
                    break;
                case 1000692:
                    item.key = element.goodsId;
                    item.itemId = 1000712;
                    item.measure = this.frmSelectedGoods.controls[`mass${element.goodsId}`].value;
                    item.unitId = this.frmSelectedGoods.controls[`massUnit${element.goodsId}`].value;
                    item.conformityId = this.frmSelectedGoods.controls[`conformity${element.goodsId}`].value;
                    children.push(item);
                    break;
                case 1000693:
                    const widthItem: GoodsMeasure = new GoodsMeasure();
                    widthItem.key = element.goodsId;
                    widthItem.itemId = 1000713;
                    widthItem.measure = this.frmSelectedGoods.controls[`width${element.goodsId}`].value;
                    widthItem.unitId = this.frmSelectedGoods.controls[`areaUnit${element.goodsId}`].value;
                    widthItem.conformityId = this.frmSelectedGoods.controls[`conformity${element.goodsId}`].value;
                    children.push(widthItem);

                    const lengthItem: GoodsMeasure = new GoodsMeasure();
                    lengthItem.key = element.goodsId;
                    lengthItem.itemId = 1000714;
                    lengthItem.measure = this.frmSelectedGoods.controls[`length${element.goodsId}`].value;
                    lengthItem.unitId = this.frmSelectedGoods.controls[`areaUnit${element.goodsId}`].value;
                    lengthItem.conformityId = this.frmSelectedGoods.controls[`conformity${element.goodsId}`].value;
                    children.push(lengthItem);
                    break;
                case 1000694:
                    item.key = element.goodsId;
                    item.itemId = 1000714;
                    item.measure = this.frmSelectedGoods.controls[`length${element.goodsId}`].value;
                    item.unitId = this.frmSelectedGoods.controls[`lengthUnit${element.goodsId}`].value;
                    item.conformityId = this.frmSelectedGoods.controls[`conformity${element.goodsId}`].value;
                    children.push(item);
                    break;
                default:
                    // Handle other cases if needed
                    break;
            }
        });
        return children;
    }

    

    private checkFormValidity(): boolean {

        let result: boolean = true;
        this.selectedGoods.selected.forEach(element => {

            if (this.frmSelectedGoods.controls['conformity'.concat(element.goodsId)].value === null
                || this.frmSelectedGoods.controls['conformity'.concat(element.goodsId)].value === '') {
                    this._resultStepTwo.succeed = false;
                    this._resultStepTwo.message = "There is atleast one unfilled element! Please fill all the elements in the all tabs";;
                this.frmSelectedGoods.markAllAsTouched();
                result = false;
                return result;
            }
            if (element.measurementMetricId === 1000691 &&
                (this.frmSelectedGoods.controls[element.goodsId].value === '' ||
                    this.frmSelectedGoods.controls[element.goodsId].value === null)) {
                        this._resultStepTwo.succeed = false;
                        this._resultStepTwo.message = "There is atleast one unfilled element! Please fill all the elements in the all tabs";
                this.frmSelectedGoods.markAllAsTouched();
                result = false;
                return result;

            }
            else if (element.measurementMetricId === 1000692 &&
                (this.frmSelectedGoods.controls['mass'.concat(element.goodsId)].value === '' ||
                    this.frmSelectedGoods.controls['mass'.concat(element.goodsId)].value === null ||
                    this.frmSelectedGoods.controls['massUnit'.concat(element.goodsId)].value === 0)) {
                        this._resultStepTwo.succeed = false;
                        this._resultStepTwo.message = "There is atleast one unfilled element! Please fill all the elements in the all tabs";
                this.frmSelectedGoods.markAllAsTouched();
                result = false;
                return result;
            }
            else if (element.measurementMetricId === 1000693 &&
                (this.frmSelectedGoods.controls['width'.concat(element.goodsId)].value === '' ||
                    this.frmSelectedGoods.controls['width'.concat(element.goodsId)].value === null ||
                    this.frmSelectedGoods.controls['length'.concat(element.goodsId)].value === '' ||
                    this.frmSelectedGoods.controls['length'.concat(element.goodsId)].value === null ||
                    this.frmSelectedGoods.controls['areaUnit'.concat(element.goodsId)].value === 0
                )) {
                    this._resultStepTwo.succeed = false;
                    this._resultStepTwo.message = "There is atleast one unfilled element! Please fill all the elements in the all tabs";
                this.frmSelectedGoods.markAllAsTouched();
                result = false;
                return result;
            }
            else if (element.measurementMetricId === 1000694 &&
                (this.frmSelectedGoods.controls['length'.concat(element.goodsId)].value === '' ||
                    this.frmSelectedGoods.controls['length'.concat(element.goodsId)].value === null ||
                    this.frmSelectedGoods.controls['lengthUnit'.concat(element.goodsId)].value === 0
                )) {
                    this._resultStepTwo.succeed = false;
                    this._resultStepTwo.message = "There is atleast one unfilled element! Please fill all the elements in the all tabs";
                this.frmSelectedGoods.markAllAsTouched();
                result = false;
                return result;
            }

        });
        return result;
    }



    public goodsSearch() {
        this.pagination.flag = true;
        this.pagination.pageNumber = 1;
        this.pagination.length = 0;
        this.goodsMixtureInfo.categoryGoodsCode = this.frmAdvancedSearch.controls["code"].value;
        this.goodsMixtureInfo.goodsName = this.frmAdvancedSearch.controls["name"].value;
        this.goodsMixtureInfo.page = this.pagination;
        if(this.selectedCat=== 0){
            this.goodsMixtureInfo.categoryId = null
        }else{
            this.goodsMixtureInfo.categoryId = this.selectedCat;
        }
        this.getGoods(this.goodsMixtureInfo);
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



    public resetAdSearch() {
        this.frmAdvancedSearch.controls['name'].setValue('');
        this.frmAdvancedSearch.controls['code'].setValue('');
        this.resetGoodsCatBotton();

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
        return this.service.getGoodsCatgories()
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



    trackByFn(index: number, item: any): any {
        return item.id || index;
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
    status: number;
    code: string;
    level: number;
    expandable: boolean;
}


@Injectable()
export class ChecklistDatabase {
    dataChange = new BehaviorSubject<TodoItemNode[]>([]);
    treeData: Array<Product>;
    treeTempData: any[];
    get data(): TodoItemNode[] { return this.dataChange.value; }

    constructor() {
        //this.initialize(treeData);
    }

    initialize(treeData: Array<Product>) {
        this.treeData = treeData;
        this.treeTempData = treeData;
        // Build the tree nodes from Json object. The result is a list of `TodoItemNode` with nested
        //     file node as children.


        // this.api.getGoodsCats().subscribe(res => {
        const data = this.buildTree(this.treeData, 1);
        this.dataChange.next(data);
        // })

        /*   const data = this.buildFileTree(TREE_DATA, 0);
      
          // Notify the change.
          this.dataChange.next(data); */
    }
    private addChildren(flatList: any, productId: number): any {
        let children = this.treeData.filter(x => x.parentID === productId);
        children.forEach(element => {
            flatList = this.addToFlatList(flatList, element.productId);
            flatList = this.addChildren(flatList, element.productId);
        });
        return flatList;
    }
    private addParents(flatList: any, parentID: number): any {
        const indx = this.treeData.findIndex(x => x.productId === parentID);
        if (indx !== -1) {
            flatList = this.addToFlatList(flatList, this.treeData[indx].productId);
            flatList = this.addParents(flatList, this.treeData[indx].parentID);
        }
        return flatList;
    }
    private addToFlatList(flatList: Array<Product>, productId: number): any {
        if (flatList.findIndex(x => x.productId === productId) === -1) {
            const indx = this.treeData.findIndex(x => x.productId === productId);
            flatList.push(this.treeData[indx]);
        }
        return flatList;

    }
    public filter(filterText: string) {
        let filteredTreeData: Array<Product> = [];
        if (filterText) {
            filteredTreeData = this.treeData.filter(d => d.productCode.concat('-'.concat(d.productName)).toLocaleLowerCase().indexOf(filterText.toLocaleLowerCase()) > -1 ||
                d.productCode.toLocaleLowerCase().indexOf(filterText.toLocaleLowerCase()) > -1);
            filteredTreeData.forEach(element => {
                filteredTreeData = this.addToFlatList(filteredTreeData, element.productId);
                filteredTreeData = this.addParents(filteredTreeData, element.parentID);
                filteredTreeData = this.addChildren(filteredTreeData, element.productId);
            });
        } else {
            filteredTreeData = this.treeData;
        }

        // Build the tree nodes from Json object. The result is a list of `TodoItemNode` with nested
        // file node as children.
        this.treeTempData = filteredTreeData;
        const data = this.buildTree(filteredTreeData, 1);
        // Notify the change.
        this.dataChange.next(data);
    }

    /**
     * Build the file structure tree. The `value` is the Json object, or a sub-tree of a Json object.
     * The return value is the list of `TodoItemNode`.
     */
    buildFileTree(obj: any, level: number): TodoItemNode[] {
        return Object.keys(obj).reduce<TodoItemNode[]>((accumulator, key) => {
            const value = obj[key];
            const node = new TodoItemNode();
            node.item = key;

            if (value != null) {
                if (typeof value === 'object') {
                    node.children = this.buildFileTree(value, level + 1);
                } else {
                    node.item = value;
                }
            }

            return accumulator.concat(node);
        }, []);
    }



    buildTree(productArray: Array<Product>, level: number): TodoItemNode[] {
        let products = productArray.filter(x => x.levelId === level);
        let tree: Array<TodoItemNode> = new Array<TodoItemNode>();

        products.forEach(element => {
            const node = new TodoItemNode();
            node.id = element.productId;
            node.code = element.productCode;
            node.item = element.productName;
            node.status = element.status;
            let children = this.treeTempData.filter(x => x.levelId === level + 1 && x.parentID === element.productId);
            node.children = this.buildTree(children, level + 1);
            tree.push(node);
        })

        return tree;
    }

    /** Add an item to to-do list */
    insertItem(parent: TodoItemNode, name: string, id: number, code: string, status: number) {
        const child = <TodoItemNode>{ item: name, id: id, code: code, status: status, children: [], isSelected: false, parentId: null };
        if (parent === undefined) {
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

export class FilesDataSource extends DataSource<any> {
    private _filterChange = new BehaviorSubject('');
    private _filteredDataChange = new BehaviorSubject('');

    /**
     * Constructor
     *
     * @param _data
     * @param {MatPaginator} _matPaginator
     * @param {MatSort} _matSort
     */
    constructor(
        private _data,
        private _matPaginator: MatPaginator,
        private _matSort: MatSort
    ) {
        super();

        this.filteredData = this._data;
    }

    /**
     * Connect function called by the table to retrieve one stream containing the data to render.
     *
     * @returns {Observable<any[]>}
     */
    connect(): Observable<any[]> {
        const displayDataChanges = [
            // this._ecommerceProductsService.onProductsChanged,
            this._matPaginator.page,
            this._filterChange,
            this._matSort.sortChange
        ];

        return merge(...displayDataChanges)
            .pipe(
                map(() => {
                    let data = this._data.slice();

                    data = this.filterData(data);

                    this.filteredData = [...data];

                    data = this.sortData(data);

                    // Grab the page's slice of data.
                    const startIndex = this._matPaginator.pageIndex * this._matPaginator.pageSize;
                    return data.splice(startIndex, this._matPaginator.pageSize);
                }
                ));
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    // Filtered data
    get filteredData(): any {
        return this._filteredDataChange.value;
    }

    set filteredData(value: any) {
        this._filteredDataChange.next(value);
    }

    // Filter
    get filter(): string {
        return this._filterChange.value;
    }

    set filter(filter: string) {
        this._filterChange.next(filter);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Filter data
     *
     * @param data
     * @returns {any}
     */
    filterData(data): any {
        if (!this.filter) {
            return data;
        }
        if (tableName === 'goods') {
            return data.filter(r => r.goodsName.toLowerCase().includes(this.filter.toLowerCase()) ||
                r.categoryGoodsCode.toLowerCase().includes(this.filter.toLowerCase()) ||
                r.categoryName.toLowerCase().includes(this.filter.toLowerCase()));
        }
        else if (tableName === 'selectedGoods') {
            return data.filter(r => r.goodsName.toLowerCase().includes(this.filter.toLowerCase()) ||
                r.goodsCode.toLowerCase().includes(this.filter.toLowerCase()));
        }


    }

    /**
     * Sort data
     *
     * @param data
     * @returns {any[]}
     */
    sortData(data): any[] {
        if (!this._matSort.active || this._matSort.direction === '') {
            return data;
        }

        return data.sort((a, b) => {
            let goodsA: number | string = '';
            let goodsB: number | string = '';

            switch (this._matSort.active) {
                case 'code':
                    [goodsA, goodsB] = [a.goodsCode, b.goodsCode];
                    break;
                case 'name':
                    [goodsA, goodsB] = [a.goodsName, b.goodsName];
                    break;
                case 'categoryName':
                    [goodsA, goodsB] = [a.categoryName, b.categoryName];
                    break;
                case 'stock':
                    [goodsA, goodsB] = [a.stock, b.stock];
                    break;
                case 'status':
                    [goodsA, goodsB] = [a.status, b.status];
                    break;
            }

            const valueA = isNaN(+goodsA) ? goodsA : +goodsA;
            const valueB = isNaN(+goodsB) ? goodsB : +goodsB;

            return (valueA < valueB ? -1 : 1) * (this._matSort.direction === 'asc' ? 1 : -1);
        });
    }

    /**
     * Disconnect
     */
    disconnect(): void {
    }

}


