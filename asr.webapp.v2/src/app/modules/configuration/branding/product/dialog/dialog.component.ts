import { ChangeDetectorRef, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ProductSubsetDialogConfig } from './dialog.types';
import { ProductService } from '../product.service';
import { Product } from '../product.types';
import { FuseAlertService } from '@fuse/components/alert';
import { OpResult } from 'app/core/type/result/result.types';
import { forkJoin, fromEvent, merge, Observable, of, Subject, Subscription } from 'rxjs';
import { filter, map, switchMap, takeUntil, debounceTime, distinctUntilChanged, take } from 'rxjs/operators';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ChecklistDatabase, TodoItemFlatNode, TodoItemNode } from '@fuse/services/mat-tree/mat-tree.service';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { SelectionModel } from '@angular/cdk/collections';
import { KeyValue } from 'app/core/type/key-value/key-value.type';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Paging } from 'app/core/type/paging/paging.type';
import { Goods } from 'app/modules/inventory/goods/goods/goods.types';

@Component({
    selector: 'fuse-confirmation-dialog',
    templateUrl: './dialog.component.html',
    encapsulation: ViewEncapsulation.None,
    styles: [
        /* language=SCSS */
        `
            .product-goods-import-grid {
                grid-template-columns:50px  120px auto;

                @screen sm {
                    grid-template-columns:auto 100px  100px 70px;
                }

                @screen md {
                    grid-template-columns: auto 100px  100px 70px;
                }

                @screen lg {
                    grid-template-columns:  50px  120px auto;
                }
                @screen print{
                    grid-template-columns: 100px 370px 370px 70px;
                }
            }
        `
    ]
})
export class ProductSubsetDialogComponent implements OnInit, OnDestroy {
    /**
     * Constructor
     */
    goods$: Array<Goods> = [];
    goods: Array<Goods> = [];
    goodsInfo: Goods = new Goods();
    pagination: Paging;
    @ViewChild('goodsPaginator') goodsPaginator: MatPaginator;
    @ViewChild('goodsSort') private goodsSort: MatSort;
    frmProductsAdvancedSearch: FormGroup;
    frmGoodsAdvancedSearch: FormGroup;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    products: Array<Product>;
    products$: Array<Product>;
    importProductIdList: Array<number>;
    importType: string = '0';
    isDataLoading: boolean;
    _result: OpResult = new OpResult();
    searchInputControl: FormControl = new FormControl();
    constructor(private service: ProductService,
        private _fuseAlertService: FuseAlertService,
        private cdr: ChangeDetectorRef,
        private _formBuilder: FormBuilder,
        @Inject(MAT_DIALOG_DATA) public data: ProductSubsetDialogConfig,
        public matDialogRef: MatDialogRef<ProductSubsetDialogComponent>
    ) {
        this.products = [];
        this.products$ = [];
        this.importType = data.importType;
        this.importProductIdList = new Array<number>();
        this._database = new ChecklistDatabase();
        this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel, this.isExpandable, this.getChildren);
        this.treeControl = new FlatTreeControl<TodoItemFlatNode>(this.getLevel, this.isExpandable);
        this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

        this._database.dataChange.subscribe(data => {
            this.dataSource.data = data;
        });
    }

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
        flatNode.levelId = level;
        flatNode.expandable = !!node.children?.length;
        flatNode.panelConformity = node.panelConformity;
        flatNode.frameConformity = node.frameConformity;
        this.flatNodeMap.set(flatNode, node);
        this.nestedNodeMap.set(node, flatNode);
        return flatNode;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {

        this.frmProductsAdvancedSearch = this.createProductsAdvancedSearchObject();
        this.frmGoodsAdvancedSearch = this.createGoodsAdvancedSearchObject();
        this.initialGoodsMixturePaging();
        this.loadData();
        this.service.getExpandedNodes()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(expandedNodes => {
                this.treeControl.dataNodes.forEach(node => {
                    if (expandedNodes.has(node.id)) {
                        this.treeControl.expand(node);
                    }
                });
            });
    }
    ngOnDestroy() {
        const expandedNodes = new Set<number>();
        this.treeControl.expansionModel.selected.forEach(element => {
            expandedNodes.add(element.id);
        });
        this.service.setExpandedNodes(expandedNodes);
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }
    private initialGoodsMixturePaging() {
        this.pagination = new Paging();
        this.pagination.flag = true;
        this.pagination.length = 0;
        this.pagination.order = 'desc';
        this.pagination.pageNumber = 0;
        this.pagination.pageSize = 50;
        this.pagination.sort = '';
        this.goodsInfo.page = { ...this.pagination };
        this.goodsInfo.page.pageNumber = this.goodsInfo.page.pageNumber + 1;
        this.goodsInfo.status = 1;
    }

    private loadData() {
        this.isDataLoading = true;
        if (this.importType == '1') {
            this._database.initialize(this.service.getProductList());
            this.importProductIdList = [...this.service.getImportedProductIdList()];
        }
        else {
            this.cdr.detectChanges();
            this.setPaginatorAndSort();
            this.goodsInfo.selectedItemsViewMode = 2;
            this.goodsInfo.notGoodsIdList = [...this.service.getProductInfo().goodsList.map(obj => obj.key)];
            this.getGoods(this.goodsInfo);
        }
        this.isDataLoading = false;
        this.cdr.detectChanges();
    }




    private showAlert(name: string): void {
        this._fuseAlertService.show(name);
    }


    private dismissAlert(name: string): void {
        this._fuseAlertService.dismiss(name);
    }
    closeDialog(result: boolean) {
        this.matDialogRef.close(result);
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
    private expandAllItemsInCheckListSelection(): void {
        this.importProductIdList.forEach(element => {
            const indx = this.treeControl.dataNodes.findIndex(x => x.id == element);
            this.expandAllParents(this.treeControl.dataNodes[indx]);
        });


    }

    filterChanged(filterText: string) {
        if (filterText.length >= 3 || filterText.length === 0) {
            this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
            this._database = new ChecklistDatabase();
            this._database.dataChange.subscribe(data => {
                this.dataSource.data = data;
            });
            this._database.initialize(this.service.getProductList());
            this._database.filter(filterText);
            /*      if (filterText) {
                   this.treeControl.expandAll();
                 } else {
                   this.treeControl.collapseAll();
                 } */
            this.cdr.detectChanges();
        }
    }
    productListFilterChanged(filterText: string) {
        if (filterText.length >= 3 || filterText.length === 0) {

            this.cdr.markForCheck();
            this.cdr.detectChanges();

        }
    }
    descendantsPartiallySelected(node: TodoItemFlatNode): boolean {
        const descendants = this.treeControl.getDescendants(node);
        const result = descendants.some(child => this.importProductIdList.findIndex(x => x == child.id) !== -1);
        return result && !this.descendantsAllSelected(node);
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
        if (descendants.length === 0)
            descendants.push(node);
        else {

            this.checklistSelection.isSelected(node)
                ? this.checklistSelection.select(...descendants)
                : this.checklistSelection.deselect(...descendants);
        }


        if (this.checklistSelection.isSelected(node)) {
            descendants.forEach(element => {
                if (!this.hasNodeChild(element) && this.importProductIdList.findIndex(x => x == element.id) == -1) {
                    this.importProductIdList.push(element.id);
                }
            });

        }
        else {
            descendants.forEach(element => {
                if (!this.hasNodeChild(element)) {
                    const products = this.importProductIdList.filter(x => x == element.id);
                    products.forEach(element => {
                        const index = this.importProductIdList.findIndex(x => x == element);
                        if (index != -1)
                            this.importProductIdList.splice(index, 1);

                    });

                }
            });


        }
        this.checkAllParentsSelection(node);
        console.log(this.importProductIdList);
    }



    hasNodeChild(node: TodoItemFlatNode): boolean {
        const parentNode = this.flatNodeMap.get(node);
        if (parentNode.children && parentNode.children.length > 0)
            return true;
        else
            return false;
    }
    descendantsAllSelected(node: TodoItemFlatNode): boolean {

        return this.importProductIdList.findIndex(x => x == node.id) !== -1
    }
    private checkAllParentsSelection(node: TodoItemFlatNode): void {
        let parent: TodoItemFlatNode | null = this.getParentNode(node);
        while (parent) {
            this.checkRootNodeSelection(parent);
            parent = this.getParentNode(parent);
        }
    }
    confirm() {
        this.service.setImportedProductIdList([...this.importProductIdList]);
        this.closeDialog(true);
    }
    createProductsAdvancedSearchObject(): FormGroup {
        return this._formBuilder.group({
            /*  viewMode: 2,
             brands: '',
             type: '', */
        });
    }
    createGoodsAdvancedSearchObject(): FormGroup {
        return this._formBuilder.group({
            goodsName: '',
            goodsCode: '',
        });
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
            this.cdr.markForCheck();

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
                    this.isDataLoading = true;
                    this.cdr.detectChanges();
                    this.pagination.length = this.goodsPaginator.length;
                    this.pagination.pageSize = this.goodsPaginator.pageSize;
                    this.pagination.pageNumber = this.goodsPaginator.pageIndex + 1;
                    this.pagination.flag = false;
                    this.pagination.order = this.goodsSort.direction == null ? 'desc' : this.goodsSort.direction;
                    this.pagination.sort = this.goodsSort.active == null ? '' : this.goodsSort.active;
                    this.goodsInfo.page = this.pagination;
                    return this.service.getGoods(this.goodsInfo);
                }),
                map((res) => {
                    this.goods = this.goods$ = res.data.goods;
                    this.pagination = { ...res.data.page };
                    this.pagination.pageNumber = this.pagination.pageNumber - 1;
                    this.isDataLoading = false;
                    this.cdr.detectChanges();
                })
            ).subscribe();
        }
    }
    private getGoods(info: Goods) {
        this.isDataLoading = true;
        this.cdr.detectChanges();
        this.service.getGoods(info)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((goods: any) => {
                this.goods = this.goods$ = goods.data.goods;
                this.pagination = { ...goods.data.page };
                this.pagination.pageNumber = this.pagination.pageNumber - 1;
                this.isDataLoading = false;
                this.cdr.markForCheck();
            });
    }
    isGoodsSelected(row: any): boolean {
        const indx = this.service.getImportedGoodsList().map(function (e) { return e.goodsId; }).indexOf(row.goodsId);
        if (indx == -1)
            return false;
        else
            return true;
    }
    changeGoodsCheckBox(goodsId: number) {

        const indx = this.service.getImportedGoodsList().findIndex(x => x.goodsId == goodsId);
        if (indx !== -1)
            this.service.getImportedGoodsList().splice(indx, 1);
        else
            this.service.getImportedGoodsList().push(this.goods$.filter(x => x.goodsId == goodsId)[0]);

    }
    public goodsSearch() {
        this.pagination.flag = true;
        this.pagination.pageNumber = 1;
        this.pagination.length = 0;
        this.goodsInfo.goodsCode = this.frmGoodsAdvancedSearch.controls["goodsCode"].value;
        this.goodsInfo.goodsName = this.frmGoodsAdvancedSearch.controls["goodsName"].value;
        this.goodsInfo.page = this.pagination;
        this.getGoods(this.goodsInfo);

    }

    public resetAdSearch() {
        this.frmGoodsAdvancedSearch.controls['goodsName'].setValue('');
        this.frmGoodsAdvancedSearch.controls['goodsCode'].setValue('');

    }
    productSearch() {

    }
    resetProductAdSearch() {

    }
    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

}
