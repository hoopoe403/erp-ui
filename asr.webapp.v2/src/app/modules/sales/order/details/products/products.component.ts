import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, OnInit, SimpleChanges, TemplateRef, ViewChild, ViewContainerRef, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, NgModel } from '@angular/forms';
import { CustomerOrder } from '../../order.types';
import { Customer } from 'app/modules/configuration/customer/customer/customer.types';
import { Overlay, OverlayRef } from "@angular/cdk/overlay";
import { TemplatePortal } from '@angular/cdk/portal';
import { Subscription, fromEvent, forkJoin, Observable, Subject } from 'rxjs';
import { filter, take, takeUntil } from "rxjs/operators";
import { KeyValue } from 'app/core/type/key-value/key-value.type';
import { ChecklistDatabase, TodoItemFlatNode, TodoItemNode } from '@fuse/services/mat-tree/mat-tree.service';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { SelectionModel } from '@angular/cdk/collections';
import { OrderService } from '../../order.service';
import { Product } from 'app/modules/configuration/branding/product/product.types';

@Component({
    selector: 'details-products',
    templateUrl: './products.component.html',
    styles: [
        /* language=SCSS */
        `
            .font-yekan {
                font-family: "Yekan"
            }
            .font-monospace
            {
                font-family: "monospace"
            }      
            .align-sub{ 
                vertical-align: sub;
            }
            tr{ 
                page-break-inside: avoid;
            }
            
            
        `
    ],
    styleUrls: ['../../../../../layout/common/right-click-menu/right-click.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetailsProductsComponent implements OnInit, OnDestroy {

    @ViewChild('deliveryDaysHiddenText') deliveryDaysHiddenText: ElementRef;
    orderInfo: CustomerOrder;
    @Input() productData: any;
    customerInfo: Customer;
    @Input() customerData: any;
    @Input() orderData: any;
    @Input() brandData: any;
    showAddItem: boolean = false;
    selectedRowNumber: number = 0;
    overlayRef: OverlayRef | null;
    @ViewChild('userMenu') userMenu: TemplateRef<any>;
    sub: Subscription;
    deliveryDaysWidth: number = 8;
    frmProductsAdvancedSearch: FormGroup;
    productViewMode: string = '2';
    brands: Array<KeyValue> = [];
    orderTypeControl: FormControl = new FormControl({ value: '', disabled: this.service.getIsActionDisabled() });
    private _unsubscribeAll = new Subject<void>();
    /**
     * Constructor
     */
    constructor(
        private _formBuilder: FormBuilder,
        public overlay: Overlay,
        public viewContainerRef: ViewContainerRef,
        private cdr: ChangeDetectorRef,
        private service: OrderService
    ) {
        this._database = new ChecklistDatabase();

        this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel,
            this.isExpandable, this.getChildren);
        this.treeControl = new FlatTreeControl<TodoItemFlatNode>(this.getLevel, this.isExpandable);
        this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

        this._database.dataChange.subscribe(data => {
            this.dataSource.data = data;
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */


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

    ngOnInit(): void {

        this.frmProductsAdvancedSearch = this.createProductsAdvancedSearchObject();
        this.orderTypeControl.setValue(this.orderInfo.orderTypeId.toString());
        this._database.initialize(this.service.getProductList());
        //this.setGoodsProducts();
        this.service.isLoading = false;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
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


    createProductsAdvancedSearchObject(): FormGroup {
        return this._formBuilder.group({
            viewMode: { value: this.productViewMode, disabled: this.service.isLoading },
            brands: '',
            type: '',
        });
    }
    ngOnChanges(changes: SimpleChanges) {
        if ('brandData' in changes) {
            this.brands = changes.brandData.currentValue;
        }
        if ('customerData' in changes) {
            this.customerInfo = changes.customerData.currentValue;
        }
        if ('orderData' in changes) {
            this.orderInfo = changes.orderData.currentValue;
        }
    }
    productTreeFilterChanged(filterText: string) {
        if (filterText.length >= 3 || filterText.length === 0) {
            this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
            this._database = new ChecklistDatabase();
            this._database.dataChange.subscribe(data => {
                this.dataSource.data = data;
            });
            this._database.initialize(this.service.getProductList());
            this._database.filter(filterText);
            /*if (filterText) {
                this.treeControl.expandAll();
            } else {
                this.treeControl.collapseAll();
                // this.expandAllItemsInCheckListSelection();
            }*/
            this.cdr.markForCheck();
            this.cdr.detectChanges();

        }
    }
    toggleOrderType(isSpecific: boolean): void {
        let orderTypeId: number;
        orderTypeId = isSpecific ? 1000532 : 1000531;
        if (this.orderInfo.orderTypeId != orderTypeId) {
            this.orderInfo.productList = [];
            this.orderInfo.orderTypeId = orderTypeId;
            this.loadProducts(orderTypeId);
        }
    }

    private loadProducts(productTypeId: number) {
        this.service.isLoading = true;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
        this.getProductsTree(this.brands, productTypeId).pipe(takeUntil(this._unsubscribeAll))
            .subscribe((products: any) => {
                this.cdr.markForCheck();
                this.service.isLoading = false;
                this.service.setProductList(products.reduce((acc, cur) => {
                    if (cur.data.length > 0) {
                        return acc.concat(cur.data);
                    } else {
                        return acc;
                    }
                }, []));
                this._database.initialize(this.service.getProductList());
                this.cdr.detectChanges();
            });
    }
    private getProductsTree(brands: Array<KeyValue>, productTypeId: number): Observable<any> {

        const observables = brands.map(item => this.getProducts(item.key, productTypeId));
        return forkJoin(observables);

    }
    private getProducts(brandId: number, productTypeId: number): Observable<any> {
        let obj: Product = new Product();
        let specificationList: Array<string> = new Array<string>();
        specificationList.push('11');
        if (productTypeId == 1000531)
            specificationList.push('10');
        else
            specificationList.push('01');
        obj.brandId = brandId;
        obj.specificationList = specificationList;
        obj.productTypeId = productTypeId;
        return this.service.getProducts(obj);
    }
    open({ x, y }: MouseEvent, customer) {
        this.close();
        const positionStrategy = this.overlay.position()
            .flexibleConnectedTo({ x, y })
            .withPositions([
                {
                    originX: 'end',
                    originY: 'bottom',
                    overlayX: 'end',
                    overlayY: 'top',
                }
            ]);

        this.overlayRef = this.overlay.create({
            positionStrategy,
            scrollStrategy: this.overlay.scrollStrategies.close()
        });

        this.overlayRef.attach(new TemplatePortal(this.userMenu, this.viewContainerRef, {
            $implicit: customer
        }));


        this.sub = fromEvent<MouseEvent>(document, 'click')
            .pipe(
                filter(event => {
                    const clickTarget = event.target as HTMLElement;
                    return !!this.overlayRef && !this.overlayRef.overlayElement.contains(clickTarget);
                }),
                take(1)
            ).subscribe(() => this.close())
    }

    close() {
        this.sub && this.sub.unsubscribe();
        if (this.overlayRef) {
            this.overlayRef.dispose();
            this.overlayRef = null;
        }
    }
    setProductViewMode(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            this.service.isLoading = true;

            if (event.source.value == 1) {
                /*   return this.goodsService.getFinalProductList(this.productInfo).pipe(takeUntil(this._unsubscribeAll))
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
                      });; */
            }
            else if (event.source.value == 2) {
                /*  this.getProductsTree(this.brands).pipe(takeUntil(this._unsubscribeAll))
                     .subscribe((products: any) => {
                         products = products.reduce((acc, cur) => acc.concat(cur.data), []);
                         this._database.initialize(products);
                         //this.setGoodsProducts();
                         this.isLoading = false;
                         this.productViewMode = event.source.value;
                         this.cdr.markForCheck();
                     }); */
            }
        }



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

    productListFilterChanged(filterText: string) {
        if (filterText.length >= 3 || filterText.length === 0) {

            this.cdr.markForCheck();
            this.cdr.detectChanges();

        }
    }
    descendantsPartiallySelected(node: TodoItemFlatNode): boolean {
        const descendants = this.treeControl.getDescendants(node);
        const result = descendants.some(child => this.orderInfo.productList.findIndex(x => x.productId === child.id) !== -1);
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
                if (!this.hasNodeChild(element) && this.orderInfo.productList.findIndex(x => x.productId === node.id) === -1) {
                    this.orderInfo.productList.push({
                        productId: element.id, productName: '',
                        brandId: 0, brandName: '', panelCoverName: '',
                        productCoverName: '', productCoverId: 0, panelCoverId: 0, controlId: "0",
                        orderDetailId: 0, orderDetailNumber: 0, orderId: 0, panelCoverPrice: null,
                        productCoverPrice: null, quantity: 1, rowNumber: 0, frameConformity: element.frameConformity,
                        panelConformity: element.panelConformity
                    });
                }
            });

        }
        else {
            descendants.forEach(element => {
                if (!this.hasNodeChild(element)) {
                    const products = this.orderInfo.productList.filter(x => x.productId == element.id);
                    products.forEach(element => {
                        const index = this.orderInfo.productList.findIndex(x => x.productId == element.productId);
                        if (index != -1)
                            this.orderInfo.productList.splice(index, 1);

                    });

                }
            });


        }
        this.checkAllParentsSelection(node);
    }



    hasNodeChild(node: TodoItemFlatNode): boolean {
        const parentNode = this.flatNodeMap.get(node);
        if (parentNode.children && parentNode.children.length > 0)
            return true;
        else
            return false;
    }
    descendantsAllSelected(node: TodoItemFlatNode): boolean {

        return this.orderInfo.productList.findIndex(x => x.productId === node.id) !== -1
    }
    private checkAllParentsSelection(node: TodoItemFlatNode): void {
        let parent: TodoItemFlatNode | null = this.getParentNode(node);
        while (parent) {
            this.checkRootNodeSelection(parent);
            parent = this.getParentNode(parent);
        }
    }
    public productSearch() {

    }
    public resetProductAdSearch() {
        this.frmProductsAdvancedSearch.controls['brands'].setValue([]);
        this.frmProductsAdvancedSearch.controls['type'].setValue('');

    }

}
