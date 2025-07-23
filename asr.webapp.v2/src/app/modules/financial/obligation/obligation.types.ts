import { Paging } from "app/core/type/paging/paging.type";
import { BaseModel } from "app/core/type/base/BaseModel";
import { extend } from "lodash";

export class Obligation extends BaseModel {
    obligationId: number;
    obligationTypeId: number;
    obligationTypeName: string;
    pledgerTypeId: number;
    pledgerTypeName: string;
    pledgerId: number;
    pledgerName: string;
    pledgeeTypeId: number;
    pledgeeTypeName: string;
    pledgeeId: number;
    pledgeeName: string;
    collateralTypeId: number;
    obligationLocalDate: string;
    chequeNumber: string;
    chequeTypeId: number;
    bankId: number;
    amount: number;
    pledgeeFinancialResourceId: number;
    status: number;
    clientIP: string;
    registerUserID: number;
    registerUserName: string;
    localChangeDate: string;
    localChangeTime: string;
    chaneDate: string;
    statusIdList: Array<number>;
    page: Paging;
}