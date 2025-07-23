export class Tree {
    id: number;
    item: string;
    code: string;
    children: Array<Tree>;
    fullName: string;
    fullCode: string;
    levelId: number;
    parentId: number;
    frameConformity: number;
    panelConformity: number;
    status: number;
    isSelected: boolean = false;
}