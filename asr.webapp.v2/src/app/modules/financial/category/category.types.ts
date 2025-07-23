import { Paging } from "app/core/type/paging/paging.type";
import { BaseModel } from "app/core/type/base/BaseModel";
export class FinancialCategory extends BaseModel {
    financialCategoryId: number;
    financialCategoryCode: string;
    fullCode: string;
    financialCategoryName: string;
    fullName: string;
    parentId: number;
    parentName: string;
    parentCode: string;
    parentFullCode: string;
    parentFullName: string;
    levelId: number;
    status: number;
    statusDescription: string;
    statusColor: string;
    statusIdList: Array<number>;
    language: string;
    clientIP: string;
    registerUserID: number;
    registerUserName: string;
    localChangeDate: string;
    localChangeTime: string;
    changeDate: string;
    page: Paging;

}

export interface FinancialCategoryPagination {
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}