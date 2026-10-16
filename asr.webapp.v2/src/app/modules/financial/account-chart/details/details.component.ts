import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { fuseAnimations } from "../../../../../@fuse/animations";
import { FormBuilder, FormGroup } from "@angular/forms";
import { animate, state, style, transition, trigger } from "@angular/animations";
import { HttpErrorResponse } from '@angular/common/http';
import { AccountChartService } from "../account-chart.service";
import { FuseAlertService } from '@fuse/components/alert';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AccountChart, AccountChartRequest } from '../account-chart.types';
import { OpResult } from 'app/core/type/result/result.types';
import { FlatTreeControl } from '@angular/cdk/tree';
import { ChecklistDatabase, TodoItemFlatNode, TodoItemNode } from '../../../../../@fuse/services/mat-tree/mat-tree.service';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { FuseDataEntryDialogService } from '@fuse/services/data-entry-dialog/data-entry-dialog.service';
import { FuseDataEntryDialogFormControls } from '@fuse/services/data-entry-dialog/data-entry-dialog.types';

/** Status ids of the chart of accounts (TBL_ACCOUNT_CHART rows in TBL_TABLE_STATUS). */
const ACTIVE = 1000001;
const INACTIVE = 1000000;

@Component({
    selector: 'account-chart-details',
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

export class AccountChartDetailsComponent implements OnInit, OnDestroy {
    accountCharts: Array<TodoItemFlatNode> = [];
    selectedNode: TodoItemFlatNode;
    titleInfo: string;
    _result: OpResult = new OpResult();
    pageType: string;
    private _unsubscribeAll: Subject<any>;
    isLoading: boolean = false;
    frmAccountChart: FormGroup;
    selectedInfoRow: TodoItemFlatNode = new TodoItemFlatNode();
    private _database: ChecklistDatabase;
    flatNodeMap = new Map<TodoItemFlatNode, TodoItemNode>();

    /** Map from nested node to flattened node. This helps us to keep the same object for selection */
    nestedNodeMap = new Map<TodoItemNode, TodoItemFlatNode>();

    treeControl: FlatTreeControl<TodoItemFlatNode>;

    treeFlattener: MatTreeFlattener<TodoItemNode, TodoItemFlatNode>;

    dataSource: MatTreeFlatDataSource<TodoItemNode, TodoItemFlatNode>;

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
        flatNode.nature = node.nature;
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
        private service: AccountChartService,
        private _formBuilder: FormBuilder,
        private cdr: ChangeDetectorRef,
        private _fuseAlertService: FuseAlertService
    ) {

        this._unsubscribeAll = new Subject();
        this.selectedNode = new TodoItemFlatNode();
        this._database = new ChecklistDatabase();
        this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel,
            this.isExpandable, this.getChildren);
        this.treeControl = new FlatTreeControl<TodoItemFlatNode>(this.getLevel, this.isExpandable);
        this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

        this._database.dataChange.subscribe(data => {
            this.dataSource.data = data;
        });
    }

    /** Shown as a ticked checkbox when the account is active. */
    descendantsAllSelected(node: TodoItemFlatNode): boolean {
        const accountChart = this.accountCharts.find(x => x.id === node.id);
        return !!accountChart && accountChart.status === ACTIVE;
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
        return !!(parentNode && parentNode.children && parentNode.children.length > 0);
    }
    private getMappedToDoItemNode(id: number): TodoItemNode | undefined {
        let obj: TodoItemNode;
        this.flatNodeMap.forEach(element => {
            if (element.id === id) {
                obj = element;
            }
        });
        return obj;
    }

    /** Puts a newly created account into the tree, under its parent (or as a root when parentId is null). */
    private addNewItemToTree(account: AccountChart) {
        const parentId = account.parentId ?? null;
        const parentFlatNode = parentId === null ? undefined : this.accountCharts.find(x => x.id === parentId);
        this.accountCharts.push({
            id: account.accountChartId, parentId: parentId, item: account.accountChartName, status: account.status,
            code: account.accountChartCode, nature: null, panelConformity: 0, frameConformity: 0,
            expandable: false, levelId: parentFlatNode ? parentFlatNode.levelId + 1 : 0
        });

        const parentNode = parentId === null ? undefined : this.getMappedToDoItemNode(parentId);
        this._database.insertItem(parentNode, account.accountChartName, account.accountChartId, account.status,
            account.accountChartCode, null, 0, 0);
        if (parentFlatNode)
            this.treeControl.expand(parentFlatNode);
    }

    private editTreeItem(account: AccountChart) {
        const indx = this.accountCharts.findIndex(x => x.id === account.accountChartId);
        if (indx !== -1) {
            this.accountCharts[indx].item = account.accountChartName;
            this.accountCharts[indx].code = account.accountChartCode;
            this.accountCharts[indx].status = account.status;
        }
        const obj = this.getMappedToDoItemNode(account.accountChartId);
        if (obj)
            this._database.updateItem(obj, account.accountChartName, account.accountChartId,
                account.accountChartCode, account.status, null);
    }

    removeItem(node: TodoItemFlatNode) {

        const parentNode = this.flatNodeMap.get(node);
        this._database.removeItem(parentNode);
    }
    /**
     * On init
     */
    ngOnInit(): void {
        this.frmAccountChart = this._formBuilder.group({});
        this.titleInfo = 'Chart of Accounts Tree';
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

    /** Loads every account (any status) and builds the tree from the flat, full-code-ordered list. */
    private loadData() {
        this.isLoading = true;
        this.service.getAllAccountCharts()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (res) => {
                    this.accountCharts = this.toTreeNodes(res.accountCharts || []);
                    this._database.initialize(this.accountCharts);
                    this.isLoading = false;
                    this.cdr.detectChanges();
                },
                error: (err: HttpErrorResponse) => {
                    this.isLoading = false;
                    this.showError(err);
                }
            });
    }

    /**
     * Account chart rows -> the flat nodes the tree is built from. The tree needs a 0-based level
     * that matches the parent chain, so it is derived from parentId here rather than taken from
     * levelNumber. An account whose parent is missing from the list is shown as a root.
     */
    private toTreeNodes(accounts: AccountChart[]): TodoItemFlatNode[] {
        const byId = new Map<number, AccountChart>(accounts.map(a => [a.accountChartId, a]));
        const levels = new Map<number, number>();
        const levelOf = (account: AccountChart, seen: Set<number> = new Set()): number => {
            if (levels.has(account.accountChartId))
                return levels.get(account.accountChartId);
            const parent = account.parentId != null ? byId.get(account.parentId) : undefined;
            const level = !parent || seen.has(parent.accountChartId)
                ? 0
                : levelOf(parent, seen.add(account.accountChartId)) + 1;
            levels.set(account.accountChartId, level);
            return level;
        };
        return accounts.map(a => {
            const level = levelOf(a);
            return {
                id: a.accountChartId,
                parentId: level === 0 ? null : a.parentId,
                item: a.accountChartName,
                code: a.accountChartCode,
                status: a.status,
                nature: null,
                levelId: level,
                expandable: false,
                panelConformity: 0,
                frameConformity: 0
            };
        });
    }

    private initialDialogFormContorls(parentName: string, accountChartCode: string, accountChartName: string, status: number): FormGroup {
        let configForm: FormGroup;
        let formControls: Array<FuseDataEntryDialogFormControls> = [];

        formControls.push({
            formControlName: 'parent', index: 0, label: 'Parent', placeHolder: 'Parent',
            type: 'text', disabled: true, value: parentName
        });
        formControls.push({
            formControlName: 'code', index: 1, label: 'Code', placeHolder: 'Code',
            type: 'text', disabled: false, value: accountChartCode
        });
        formControls.push({
            formControlName: 'name', index: 2, label: 'Name', placeHolder: 'Name',
            type: 'text', disabled: false, value: accountChartName
        });
        formControls.push({
            formControlName: 'status', index: 3, label: 'Active', placeHolder: 'Status',
            type: 'checkbox', disabled: false, value: status === ACTIVE
        });
        configForm = this._formBuilder.group({
            title: 'Add New Account',
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

        let configForm: FormGroup = this.initialDialogFormContorls('root', '', '', ACTIVE);
        const dialogRef = this._fuseDataEntryDialogService.open(configForm.value);
        dialogRef.afterClosed().subscribe((result) => {
            if (result !== 'cancelled')
                this.accountChartTreeModification(result, null, null);
        });
    }

    addItem(parentId: number) {
        let parentName: string = this.accountCharts.find(x => x.id === parentId)?.item;
        let configForm: FormGroup = this.initialDialogFormContorls(parentName, '', '', ACTIVE);
        const dialogRef = this._fuseDataEntryDialogService.open(configForm.value);
        dialogRef.afterClosed().subscribe((result) => {
            if (result !== 'cancelled')
                this.accountChartTreeModification(result, null, parentId);
        });
    }

    editItem(node: TodoItemFlatNode) {
        let parent: TodoItemFlatNode = this.getParentNode(node)
        let configForm: FormGroup = this.initialDialogFormContorls(parent ? parent.item : 'Root', node.code, node.item, node.status);
        const dialogRef = this._fuseDataEntryDialogService.open(configForm.value);
        dialogRef.afterClosed().subscribe((result) => {
            if (result !== 'cancelled')
                this.accountChartTreeModification(result, node.id, parent ? parent.id : null);
        });
    }

    /** Dialog values -> an account chart request; no nodeId = create, no parentId = a root account. */
    private accountChartTreeModification(formInfo: Array<FuseDataEntryDialogFormControls>,
        nodeId: number | null,
        parentId: number | null) {
        const request: AccountChartRequest = {
            accountChartCode: formInfo.find(x => x.index === 1).value,
            accountChartName: formInfo.find(x => x.index === 2).value,
            status: formInfo.find(x => x.index === 3).value ? ACTIVE : INACTIVE,
            parentId: parentId
        };
        if (nodeId === null)
            this.create(request);
        else
            this.edit({ ...request, accountChartId: nodeId });
    }

    private showAlert(name: string): void {
        this._fuseAlertService.show(name);
    }

    private dismissAlert(name: string): void {
        this._fuseAlertService.dismiss(name);
    }

    private showSuccess(message: string): void {
        this._result.succeed = true;
        this._result.message = message;
        this.showAlert('successMessage');
        this.cdr.detectChanges();
    }

    /** The backend answers failures with an RFC 7807 problem; `detail` is the readable text. */
    private showError(err: HttpErrorResponse): void {
        this._result.succeed = false;
        this._result.message = (err && err.error && err.error.detail) || (err && err.message) || 'Request failed';
        this.showAlert('errorMessage');
        this.cdr.detectChanges();
    }

    private create(request: AccountChartRequest) {
        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');
        this.isLoading = true;
        this.service.create(request).subscribe({
            next: (account) => {
                this.isLoading = false;
                this.addNewItemToTree(account);
                this.showSuccess('Account saved');
            },
            error: (err: HttpErrorResponse) => {
                this.isLoading = false;
                this.showError(err);
            }
        });
    }

    private edit(request: AccountChartRequest) {
        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');
        this.isLoading = true;
        this.service.edit(request).subscribe({
            next: (account) => {
                this.isLoading = false;
                this.editTreeItem(account);
                this.showSuccess('Account saved');
            },
            error: (err: HttpErrorResponse) => {
                this.isLoading = false;
                this.showError(err);
            }
        });
    }
}
