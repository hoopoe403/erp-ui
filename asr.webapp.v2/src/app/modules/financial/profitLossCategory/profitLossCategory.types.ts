import { Paging } from "app/core/type/paging/paging.type";
import { BaseModel } from "app/core/type/base/BaseModel";
export class ProfitLossCategory extends BaseModel {
    profitLossCategoryId: number;
    profitLossCategoryName: number;
    profitLossCategoryCode: number;
    status: number;
    statusDescription: string;
    statusColor: string;
}