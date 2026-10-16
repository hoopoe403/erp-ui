import { Paging } from "app/core/type/paging/paging.type";

/** An account of the chart of accounts, as returned by `financial/accountChart` (list, get, create, edit). */
export interface AccountChart {
    accountChartId: number;
    accountChartCode: string;
    fullCode: string;
    accountChartName: string;
    fullName: string;
    parentId: number;
    parentCode: string;
    parentName: string;
    parentFullCode: string;
    parentFullName: string;
    levelNumber: number;
    status: number;
    statusDescription: string;
    statusColor: string;
    userId: string;
    userFullName: string;
    changeDate: string;
}

/** Body of `financial/accountChart/create` and `/edit`. No `accountChartId` = create; no `parentId` = a root account. */
export interface AccountChartRequest {
    accountChartId?: number;
    accountChartCode: string;
    accountChartName: string;
    parentId?: number | null;
    status?: number;
}

/** Filter for `financial/accountChart/findByObj`. Blank or absent fields are not filtered on. */
export interface AccountChartFilter {
    accountChartCode?: string;
    accountChartName?: string;
    statusIdList?: number[];
    page?: Paging;
}

export interface AccountChartListResponse {
    accountCharts: AccountChart[];
    page: Paging;
}
