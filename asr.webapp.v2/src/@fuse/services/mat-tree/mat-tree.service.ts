import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable()
export class ChecklistDatabase {
    dataChange = new BehaviorSubject<TodoItemNode[]>([]);

    get data(): TodoItemNode[] { return this.dataChange.value; }
    treeFlatData: Array<TodoItemFlatNode> = new Array<TodoItemFlatNode>();
    constructor() {
        //this.initialize(treeData);
    }
    initialize(treeData: Array<TodoItemFlatNode>) {

        // Build the tree nodes from Json object. The result is a list of `TodoItemNode` with nested
        //     file node as children.

        this.treeFlatData = treeData;
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
                if (typeof value === 'object') {
                    node.children = this.buildFileTree(value, level + 1);
                } else {
                    node.item = value;
                }
            }

            return accumulator.concat(node);
        }, []);
    }

    buildTree(filteredArray: Array<TodoItemFlatNode>, baseArray: Array<TodoItemFlatNode>, level: number): TodoItemNode[] {
        let Filterredproducts = filteredArray.filter(x => x.levelId === level);
        let tree: Array<TodoItemNode> = new Array<TodoItemNode>();

        Filterredproducts.forEach(element => {
            const node = new TodoItemNode();
            node.id = element.id;
            node.code = element.code;
            node.item = element.item;
            node.status = element.status;
            node.frameConformity = element.frameConformity;
            node.panelConformity = element.panelConformity;
            let children = baseArray.filter(x => x.levelId === level + 1 && x.parentId === element.id);
            node.children = this.buildTree(children, baseArray, level + 1);
            tree.push(node);
        })

        return tree;
    }
    private addChildren(flatList: any, id: number): any {
        let children = this.treeFlatData.filter(x => x.parentId === id);
        children.forEach(element => {
            flatList = this.addToFlatList(flatList, element.id);
            flatList = this.addChildren(flatList, element.id);
        });
        return flatList;
    }
    private addParents(flatList: any, parentId: number): any {
        const indx = this.treeFlatData.findIndex(x => x.id === parentId);
        if (indx !== -1) {
            flatList = this.addToFlatList(flatList, this.treeFlatData[indx].id);
            if (this.treeFlatData[indx].parentId > 0)
                flatList = this.addParents(flatList, this.treeFlatData[indx].parentId);
        }
        return flatList;
    }
    private addToFlatList(flatList: Array<TodoItemFlatNode>, id: number): any {
        if (flatList.findIndex(x => x.id === id) === -1) {
            const indx = this.treeFlatData.findIndex(x => x.id === id);
            flatList.push(this.treeFlatData[indx]);
        }
        return flatList;

    }

    public filter(filterText: string) {
        let filteredTreeData: Array<TodoItemFlatNode> = [];
        let count: number = 0;
        if (filterText) {
            filteredTreeData = this.treeFlatData.filter(d => d.item.toLocaleLowerCase().indexOf(filterText.toLocaleLowerCase()) > -1);
            filteredTreeData.forEach(element => {
                count = count + 1;
                filteredTreeData = this.addParents(filteredTreeData, element.parentId);
                filteredTreeData = this.addChildren(filteredTreeData, element.id);
            });
        } else {
            filteredTreeData = this.treeFlatData;
        }

        // Build the tree nodes from Json object. The result is a list of `TodoItemNode` with nested
        // file node as children.

        const data = this.buildTree(filteredTreeData, filteredTreeData, 0);

        // Notify the change.
        this.dataChange.next(data);
    }

    /** Add an item to to-do list */
    insertItem(parent: TodoItemNode, name: string, id: number, status: number, code: string,
        frameConformity: number, panelConformity: number) {
        const child = <TodoItemNode>{
            item: name, id: id, code: code, status: status,
            children: [], isSelected: false, parentId: null, frameConformity: frameConformity, panelConformity: panelConformity
        };
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

    updateItem(node: TodoItemNode, name: string, id: number, code: string, status: number) {
        node.item = name;
        node.id = id;
        node.status = status;
        node.code = code;
        this.dataChange.next(this.data);
    }
}


export class TodoItemNode {
    children: TodoItemNode[];
    item: string;
    id: number;
    code: string;
    status: number;
    panelConformity: number;
    frameConformity: number;
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
    panelConformity: number;
    frameConformity: number;
}