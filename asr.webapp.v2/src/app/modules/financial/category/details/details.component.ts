import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { fuseAnimations } from "../../../../../@fuse/animations";
import { FormBuilder, FormGroup } from "@angular/forms";
import { animate, state, style, transition, trigger } from "@angular/animations";
import { FinancialCategoryService } from "../category.service";
import { FuseAlertService } from '@fuse/components/alert';
import { Observable, Subject, forkJoin } from 'rxjs';
import { FinancialCategory } from '../category.types';
import { OpResult } from 'app/core/type/result/result.types';
import { ActivatedRoute } from '@angular/router';
import { FlatTreeControl } from '@angular/cdk/tree';
import { ChecklistDatabase, TodoItemFlatNode, TodoItemNode } from '../../../../../@fuse/services/mat-tree/mat-tree.service';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { FuseDataEntryDialogService } from '@fuse/services/data-entry-dialog/data-entry-dialog.service';
import { FuseDataEntryDialogFormControls } from '@fuse/services/data-entry-dialog/data-entry-dialog.types';
import { ProfitLossCategory } from '../../profitLossCategory/profitLossCategory.types';
@Component({
    selector: 'category-details',
    templateUrl: './details.component.html',
    animations: [fuseAnimations, trigger('detailExpand', [
        state('collapsed', style({ height: '0px', minHeight: '0' })),
        state('expanded', style({ height: '*' })),
        transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
    ],
    styles: [
        /* language=SCSS */
    ],
    encapsulation: ViewEncapsulation.None
})

export class CategroyDetailsComponent implements OnInit, OnDestroy {
    proftLossCategories: Array<ProfitLossCategory> = [];
    categories: Array<TodoItemFlatNode> = [];
    selectedCatNode: TodoItemFlatNode;
    titleInfo: string;
    id: number;
    categoryInfo: FinancialCategory = new FinancialCategory();
    _result: OpResult = new OpResult();
    pageType: string;
    private _unsubscribeAll: Subject<any>;
    isLoading: boolean = false;
    frmCategory: FormGroup;
    dateObject = "";
    price: number;
    year: string = '';
    month: string = '';
    day: string = '';
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

    getLevel = (node: TodoItemFlatNode) => node.levelId;

    isExpandable = (node: TodoItemFlatNode) => node.expandable;

    getChildren = (node: TodoItemNode): TodoItemNode[] => node.children;

    hasChild = (_: number, _nodeData: TodoItemFlatNode) => _nodeData.expandable;

    hasNoContent = (_: number, _nodeData: TodoItemFlatNode) => _nodeData.item === '';



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
        flatNode.frameConformity = node.frameConformity;
        flatNode.panelConformity = node.panelConformity;
        this.flatNodeMap.set(flatNode, node);
        this.nestedNodeMap.set(node, flatNode);
        return flatNode;
    }

    constructor(
        private _fuseDataEntryDialogService: FuseDataEntryDialogService,
        private service: FinancialCategoryService,
        private _formBuilder: FormBuilder,
        private cdr: ChangeDetectorRef,
        private route: ActivatedRoute,
        private _fuseAlertService: FuseAlertService
    ) {

        this._unsubscribeAll = new Subject();
        this.selectedCatNode = new TodoItemFlatNode();
        this._database = new ChecklistDatabase();
        this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel,
            this.isExpandable, this.getChildren);
        this.treeControl = new FlatTreeControl<TodoItemFlatNode>(this.getLevel, this.isExpandable);
        this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

        this._database.dataChange.subscribe(data => {
            this.dataSource.data = data;
        });
    }



    /** Whether all the descendants of the node are selected. */
    descendantsAllSelected(node: TodoItemFlatNode): boolean {
        return this.categories.filter(x => x.id === node.id)[0].status === 1000001;
    }

    /* Get the parent node of a node */
    getParentNode(node: TodoItemFlatNode): TodoItemFlatNode | null {
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
    hasNodeChild(node: TodoItemFlatNode): boolean {
        const parentNode = this.flatNodeMap.get(node);
        if (parentNode.children && parentNode.children.length > 0)
            return true;
        else
            return false;
    }
    private getMappedToDoItemNode(id: number): TodoItemNode {
        let obj: TodoItemNode = new TodoItemNode();
        this.flatNodeMap.forEach(element => {
            if (element.id === id) {
                obj = element;
            }
        });
        return obj;
    }
    /** Select the category so we can insert the new item. */
    private addNewItemToTree(parentId: number, item: string, id: number, status: number, code: string) {
        const parentFlatNode = this.categories.filter(x => x.id === parentId)[0];
        this.categories.push({
            id: id, parentId: parentId, item: item, status: status,
            code: code, panelConformity: 0, frameConformity: 0,
            expandable: false, levelId: this.getLevel(parentFlatNode)
        });

        const parentNode = this.getMappedToDoItemNode(parentId);
        this._database.insertItem(parentNode, item, id, status, code, 0, 0);
        // expand the subtree only if the parent has children (parent is not a leaf node)

        this.treeControl.expand(parentFlatNode);

    }


    private editTreeItem(parentId: number, id: number, item: string, code: string, status: number) {
        const parentFlatNode = this.categories.filter(x => x.id === parentId)[0];
        const indx = this.categories.findIndex(x => x.id === id);
        this.categories[indx].id = id;
        this.categories[indx].parentId = parentId;
        this.categories[indx].item = item;
        this.categories[indx].code = code;
        this.categories[indx].status = status;

        const obj: TodoItemNode = this.getMappedToDoItemNode(id);
        this._database.updateItem(obj, item, id, code, status);
        if (status === 1000000)
            this.treeControl.getDescendants(this.categories[indx]).forEach(element => {
                this.editTreeItem(id, element.id, element.item, element.code, 1000000);
            });
        this.treeControl.expand(parentFlatNode);
    }

    /** Save the node to database */

    removeItem(node: TodoItemFlatNode) {

        const parentNode = this.flatNodeMap.get(node);
        this._database.removeItem(parentNode);
    }
    /**
     * On init
     */
    ngOnInit(): void {
        this.frmCategory = this.createFormObject();
        this.isLoading = true;
        this.titleInfo = 'Financial Category Tree';
        this.loadData();
        this.pageType = 'new';

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
            this.getCategoriesTree(),
            this.getProfitLossCategory(),
        ).subscribe(res => {
            this.setForkJoinValues(res);
            this.isLoading = false;
            this.cdr.detectChanges();
        });

    }
    public static registerDialog(formControls: Array<FuseDataEntryDialogFormControls>) {
        console.log(formControls[2].value);


    }
    private getProfitLossCategory(): Observable<any> {
        return this.service.getProfitLossCategories();
    }
    private getCategoriesTree(): Observable<any> {

        this.isLoading = true;
        return this.service.getCategoryTree();

    }
    private initialDialogFormContorls(parentName: string, categoryCode: string, categoryName: string, status: number): FormGroup {
        let configForm: FormGroup;
        let formControls: Array<FuseDataEntryDialogFormControls> = [];
        formControls.push({
            formControlName: 'parent', index: 0, label: 'Parent', placeHolder: 'Parent',
            type: 'text', disabled: true, value: parentName
        });
        formControls.push({
            formControlName: 'code', index: 1, label: 'Code', placeHolder: 'Code',
            type: 'text', disabled: false, value: categoryCode
        });
        formControls.push({
            formControlName: 'name', index: 2, label: 'Name', placeHolder: 'Name',
            type: 'text', disabled: false, value: categoryName
        });

        formControls.push({
            formControlName: 'status', index: 3, label: 'Active', placeHolder: 'Status',
            type: 'checkbox', disabled: false, value: status === 1000001 ? true : false
        });
        configForm = this._formBuilder.group({
            title: 'Add New Category',
            message: 'Are you sure you want to remove this contact permanently? <span class="font-medium">This action cannot be undone!</span>',
            formControls: this._formBuilder.group(formControls),
            icon: this._formBuilder.group({
                show: true,
                name: 'heroicons_outline:information-circle',
                color: 'info'
            }),
            actions: this._formBuilder.group({
                confirm: this._formBuilder.group({
                    show: true,
                    label: 'Register',
                    color: 'primary'
                }),
                cancel: this._formBuilder.group({
                    show: true,
                    label: 'Cancel'
                })
            }),
            dismissible: true
        });
        return configForm;
    }
    addNewRoot() {

        let configForm: FormGroup = this.initialDialogFormContorls('root', '', '', 1000001);
        const dialogRef = this._fuseDataEntryDialogService.open(configForm.value);
        dialogRef.afterClosed().subscribe((result) => {
            if (result !== 'cancelled')
                this.categoryTreeModification(result, 0, 0, 'new');
        });
    }

    addItem(parentId: number) {
        let parentName: string = this.categories.filter(x => x.id === parentId)[0].item;
        let configForm: FormGroup = this.initialDialogFormContorls(parentName, '', '', 1000001);
        const dialogRef = this._fuseDataEntryDialogService.open(configForm.value);
        dialogRef.afterClosed().subscribe((result) => {
            if (result !== 'cancelled')
                this.categoryTreeModification(result, 0, parentId, 'new');
        });
    }

    editItem(node: TodoItemFlatNode) {
        let parent: TodoItemFlatNode = this.getParentNode(node)
        let configForm: FormGroup = this.initialDialogFormContorls(parent ? parent.item : 'Root', node.code, node.item, node.status);
        const dialogRef = this._fuseDataEntryDialogService.open(configForm.value);
        dialogRef.afterClosed().subscribe((result) => {
            if (result !== 'cancelled')
                this.categoryTreeModification(result, node.id, parent ? parent.id : 0, 'edit');
        });
    }
    private categoryTreeModification(formInfo: Array<FuseDataEntryDialogFormControls>,
        nodeId: number,
        parentId: number, actionType: string) {
        this.categoryInfo.financialCategoryCode = formInfo.filter(x => x.index === 1)[0].value;
        this.categoryInfo.financialCategoryName = formInfo.filter(x => x.index === 2)[0].value;
        this.categoryInfo.status = formInfo.filter(x => x.index === 3)[0].value ? 1000001 : 1000000;
        this.categoryInfo.parentId = parentId;
        this.categoryInfo.financialCategoryId = nodeId;
        if (actionType === 'new')
            this.create(parentId);
        else
            this.edit();
    }


    private setForkJoinValues(values: Array<any>): void {
        this.categories = values[0].data;
        this.proftLossCategories = values[1].data;
        this._database.initialize(this.categories);
    }


    private createFormObject(): FormGroup {

        return this._formBuilder.group({
            paymentType: '',
            bank: '',
            chequeNumber: '',
            jdatepicker: '',
            amount: '',
            payerFinancialResource: '',
            recipientFinancialResource: '',
            billId: '',
            paymentId: '',
            trackingId: '',
            currency: ''
        });
    }


    private showAlert(name: string): void {
        this._fuseAlertService.show(name);
    }

    private dismissAlert(name: string): void {
        this._fuseAlertService.dismiss(name);
    }


    private create(parentId: number) {
        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');
        this.service.create(this.categoryInfo).subscribe(res => {
            this.isLoading = false;
            this._result.succeed = res.succeed;
            this._result.message = res.message;
            if (this._result.succeed) {
                this.showAlert('successMessage');
                this.addNewItemToTree(parentId, this.categoryInfo.financialCategoryName, res.data,
                    this.categoryInfo.status, this.categoryInfo.financialCategoryCode);
            }
            else
                this.showAlert('errorMessage');
            this.cdr.detectChanges();
        });
    }

    private edit() {

        this.service.edit(this.categoryInfo).subscribe(res => {
            this.isLoading = false;
            this._result.succeed = res.succeed;
            this._result.message = res.message;
            if (this._result.succeed) {
                this.showAlert('successMessage');
                this.editTreeItem(this.categoryInfo.parentId, this.categoryInfo.financialCategoryId, this.categoryInfo.financialCategoryName,
                    this.categoryInfo.financialCategoryCode, this.categoryInfo.status)
            }
            else
                this.showAlert('errorMessage');
            this.cdr.detectChanges();
        });
    }


}


