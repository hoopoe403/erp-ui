import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatDialog } from '@angular/material/dialog';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { forkJoin, of, Subject } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { fuseAnimations } from '../../../../../@fuse/animations';
import { Attribute } from '../../attribute/attribute.types';
import { ProductCategoryService } from '../../product-category/product-category.service';
import { RawMaterialCategoryService } from '../raw-material-category.service';
import {
    RawMaterialCategory,
    RawMaterialCategoryFlatNode,
    RawMaterialCategoryNode,
    RawMaterialCategoryStatus
} from '../raw-material-category.types';
import {
    RawMaterialCategoryDialogComponent,
    RawMaterialCategoryDialogData,
    RawMaterialCategoryDialogResult
} from './category-dialog/category-dialog.component';

/**
 * Raw material category tree on the whole page; adding or editing a category opens a dialog. Every save
 * reloads the tree from `/drp/list`, because editing a category's code, name or parent rebuilds the
 * full code / full name of all its descendants on the server.
 */
@Component({
    selector: 'raw-material-category-tree',
    templateUrl: './tree.component.html',
    styles: [
        /* language=SCSS */
        `
            .raw-material-category-tree .mat-tree {
                background: transparent;
            }

            .raw-material-category-tree .mat-tree-node {
                min-height: 44px;
            }

            .raw-material-category-tree .tree-row-actions {
                opacity: 0;
                transition: opacity 150ms;
            }

            .raw-material-category-tree .mat-tree-node:hover .tree-row-actions,
            .raw-material-category-tree .mat-tree-node:focus-within .tree-row-actions {
                opacity: 1;
            }

            @media (hover: none) {
                .raw-material-category-tree .tree-row-actions {
                    opacity: 1;
                }
            }
        `
    ],
    animations: fuseAnimations,
    encapsulation: ViewEncapsulation.None
})
export class RawMaterialCategoryTreeComponent implements OnInit, OnDestroy {
    isLoading: boolean = false;
    loadError: string = null;
    statuses: Array<RawMaterialCategoryStatus> = [];
    categories: Array<RawMaterialCategory> = [];
    /** Every attribute, for the dialog's attribute picker and the rows' tooltips. */
    attributes: Array<Attribute> = [];
    /** The category last added or edited, highlighted in the tree. */
    selectedId: number = null;

    treeFilter: string = '';
    treeControl: FlatTreeControl<RawMaterialCategoryFlatNode>;
    treeFlattener: MatTreeFlattener<RawMaterialCategoryNode, RawMaterialCategoryFlatNode>;
    dataSource: MatTreeFlatDataSource<RawMaterialCategoryNode, RawMaterialCategoryFlatNode>;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private service: RawMaterialCategoryService,
        private _productCategoryService: ProductCategoryService,
        private cdr: ChangeDetectorRef,
        private route: ActivatedRoute,
        private router: Router,
        private location: Location,
        private _matDialog: MatDialog
    ) {
        this.treeFlattener = new MatTreeFlattener(
            this.transformer, node => node.level, node => node.expandable, node => node.children);
        this.treeControl = new FlatTreeControl<RawMaterialCategoryFlatNode>(node => node.level, node => node.expandable);
        this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
    }

    private transformer = (node: RawMaterialCategoryNode, level: number): RawMaterialCategoryFlatNode => {
        const flatNode = new RawMaterialCategoryFlatNode();
        flatNode.id = node.category.rawMaterialCategoryId;
        flatNode.category = node.category;
        flatNode.level = level;
        flatNode.expandable = node.children.length > 0;
        return flatNode;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    ngOnInit(): void {
        // tree/:id (from the list page) opens that category's edit dialog once the tree is loaded.
        const id = Number(this.route.snapshot.paramMap.get('id'));
        this.loadData(id > 0 ? id : null);
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Data
    // -----------------------------------------------------------------------------------------------------

    loadData(openId: number): void {
        this.isLoading = true;
        this.loadError = null;
        forkJoin([this.service.getStatuses(), this.service.getAllCategories(),
            // Without the attribute list the tree still works; the picker is just empty.
            this._productCategoryService.getAttributes().pipe(catchError(() => of([])))])
            .pipe(takeUntil(this._unsubscribeAll), finalize(() => this.stopLoading()))
            .subscribe(([statuses, categories, attributes]) => {
                this.statuses = statuses;
                this.attributes = attributes;
                this.setCategories(categories, openId);
                const toOpen = this.findCategory(openId);
                if (toOpen)
                    this.editCategory(toOpen);
            }, error => this.loadError = this.service.errorMessage(error));
    }

    /** Reloads the tree, keeping what was expanded, and highlights and reveals `selectId`. */
    reloadCategories(selectId: number): void {
        this.isLoading = true;
        this.loadError = null;
        this.service.getAllCategories()
            .pipe(takeUntil(this._unsubscribeAll), finalize(() => this.stopLoading()))
            .subscribe(categories => {
                this.setCategories(categories, selectId);
                this.selectedId = this.findCategory(selectId) ? selectId : null;
            }, error => this.loadError = this.service.errorMessage(error));
    }

    private setCategories(categories: Array<RawMaterialCategory>, revealId: number): void {
        const expandedIds = new Set<number>(
            (this.treeControl.dataNodes || []).filter(x => this.treeControl.isExpanded(x)).map(x => x.id));
        this.categories = categories || [];
        this.dataSource.data = this.buildTree(this.categories, this.treeFilter);

        this.treeControl.dataNodes
            .filter(x => expandedIds.has(x.id) || this.treeFilter)
            .forEach(x => this.treeControl.expand(x));
        this.revealNode(revealId);
    }

    /**
     * Nests the flat list under parentId. With a filter, keeps the matching categories plus their
     * ancestors, so a match is never shown without its path.
     */
    private buildTree(categories: Array<RawMaterialCategory>, filter: string): Array<RawMaterialCategoryNode> {
        let visible = categories;
        const term = (filter || '').trim().toLowerCase();
        if (term) {
            const byId = new Map(categories.map(x => [x.rawMaterialCategoryId, x] as [number, RawMaterialCategory]));
            const keep = new Set<number>();
            categories
                .filter(x => (x.fullCode || '').toLowerCase().includes(term) ||
                    (x.rawMaterialCategoryName || '').toLowerCase().includes(term))
                .forEach(x => {
                    for (let c = x; c && !keep.has(c.rawMaterialCategoryId); c = byId.get(c.parentId))
                        keep.add(c.rawMaterialCategoryId);
                });
            visible = categories.filter(x => keep.has(x.rawMaterialCategoryId));
        }

        const nodes = new Map<number, RawMaterialCategoryNode>();
        visible.forEach(category => {
            const node = new RawMaterialCategoryNode();
            node.category = category;
            nodes.set(category.rawMaterialCategoryId, node);
        });
        const roots: Array<RawMaterialCategoryNode> = [];
        visible.forEach(category => {
            const parent = category.parentId ? nodes.get(category.parentId) : null;
            (parent ? parent.children : roots).push(nodes.get(category.rawMaterialCategoryId));
        });
        return roots;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Tree
    // -----------------------------------------------------------------------------------------------------

    applyTreeFilter(value: string): void {
        this.treeFilter = value;
        this.setCategories(this.categories, this.selectedId);
    }

    /** True when every category that has sub-categories is open - also after opening them one by one. */
    get allExpanded(): boolean {
        const expandable = (this.treeControl.dataNodes || []).filter(x => x.expandable);
        return expandable.length > 0 && expandable.every(x => this.treeControl.isExpanded(x));
    }

    /** One button for both: collapses everything when all is open, else opens everything. */
    toggleExpandAll(): void {
        if (this.allExpanded)
            this.treeControl.collapseAll();
        else
            this.treeControl.expandAll();
    }

    /** The category's attributes with their allowed values, for the row's tooltip ("Weight: 20, 25, 30"). */
    attributeSummary(category: RawMaterialCategory): string {
        return (category.attributes || []).map(a => {
            const attribute = this.attributes.find(x => x.attributeId === a.attributeId);
            const name = attribute ? attribute.attributeName : '#' + a.attributeId;
            return a.attributeValueIds && a.attributeValueIds.length ? name + ' (' + a.attributeValueIds.length + ')' : name;
        }).join(', ');
    }

    childCount(node: RawMaterialCategoryFlatNode): number {
        return this.categories.filter(x => x.parentId === node.id).length;
    }

    /** Expands every ancestor of the category so its node is visible. */
    private revealNode(id: number): void {
        let category = this.findCategory(id);
        while (category && category.parentId) {
            const parentNode = this.treeControl.dataNodes.find(x => x.id === category.parentId);
            if (parentNode)
                this.treeControl.expand(parentNode);
            category = this.findCategory(category.parentId);
        }
    }

    private findCategory(id: number): RawMaterialCategory {
        return id ? this.categories.find(x => x.rawMaterialCategoryId === id) : null;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Dialog
    // -----------------------------------------------------------------------------------------------------

    addRoot(): void {
        this.addChild(null);
    }

    addChild(parentId: number): void {
        this.openDialog({ parentId: parentId, categories: this.categories, statuses: this.statuses, attributes: this.attributes });
    }

    editCategory(category: RawMaterialCategory): void {
        this.selectedId = category.rawMaterialCategoryId;
        this.replaceUrl(category.rawMaterialCategoryId);
        this.openDialog({ category: category, categories: this.categories, statuses: this.statuses, attributes: this.attributes });
    }

    private openDialog(data: RawMaterialCategoryDialogData): void {
        this._matDialog
            .open<RawMaterialCategoryDialogComponent, RawMaterialCategoryDialogData, RawMaterialCategoryDialogResult>(RawMaterialCategoryDialogComponent, {
                data: data,
                width: '820px',
                maxWidth: '95vw',
                panelClass: 'raw-material-category-dialog',
                // The dialog itself asks before throwing unsaved input away.
                disableClose: true,
                autoFocus: true
            })
            .afterClosed()
            .subscribe(result => {
                this.replaceUrl(null);
                if (result && result.savedId)
                    this.reloadCategories(result.savedId);
                if (result && result.addChildOf)
                    this.addChild(result.addChildOf);
            });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Helpers
    // -----------------------------------------------------------------------------------------------------

    /** Keeps the URL on the edited category (tree/:id) so a refresh reopens it, without navigating. */
    private replaceUrl(id: number): void {
        const base = this.route.snapshot.paramMap.get('id') ? '../../tree' : '../tree';
        const commands = id ? [base, id] : [base];
        this.location.replaceState(this.router.createUrlTree(commands, { relativeTo: this.route }).toString());
    }

    private stopLoading(): void {
        this.isLoading = false;
        this.cdr.detectChanges();
    }
}
