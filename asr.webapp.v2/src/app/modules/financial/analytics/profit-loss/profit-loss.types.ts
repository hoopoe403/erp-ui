import { BaseModel } from "app/core/type/base/BaseModel";
import { Paging } from "app/core/type/paging/paging.type";

export class ProfitLoss extends BaseModel {
    profitLossId: number;
    localFromDate: string;
    localToDate: string;
    fromDate: Date;
    toDate: Date;
    grossIncomes: number;
    grossCosts: number;
    grossProfit: number;
    netIncomes: number;
    netCosts: number;
    netProfit: number;
    chartXAxis: String;
    chartIncomes: number;
    chartCosts: number;
    status: number;
    statusDescription: string;
    statusColor: string;
    totalFrom: number;
    totalTo: number;
    localYear: number;
    isCurrent: number;
    profitLossDetailList: Array<ProfitLossDetail>;
    statusIdList: Array<number>;
    page: Paging;
}

export class ProfitLossDetail extends BaseModel {
    profitLossDetailId: number;
    profitLossId: number;
    profitLossItemId: number;
    profitLossItemDesc: string;
    sourceId: number;
    profitLossItemTypeId: number;
    profitLossItemTypeName: string;
    profitLossItemTypeSign: string;
    profitLossCategoryId: number;
    profitLossCategoryName: string;
    initialAmount: number;
    finalAmount: number;
    remained: number;
    status: number;
    page: Paging;
}

export class ProfitLossConfiguration {
    profitLossDetailType: string;
    showDetailInitialAndFinal: boolean;
    isProfit: boolean;
}

export class ExcelSummary {
    incomes: number;
    costs: number;
    profit: number;

}

export class ExcelDetails {
    category: string;
    item: string;
    type: string;
    initial: number;
    final: number;
    remained: number

}
export class ExcelGrouped {
    category: string;
    type: string;
    initial: number;
    final: number;
    remained: number

}