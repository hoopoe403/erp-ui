
export class Paging {
    pageSize: number;
    pageNumber: number;
    length: number;
    flag: boolean;
    sort: string;
    order: string;
}

export class SortItem {
    reportMode: number;
    items: Array<SortItemDetail>;
}

export class SortItemDetail {
    sortItem: string;
    sortValue: string;
    orderNumber: number;
    orderType: string;
    checked: boolean;

}