import { BaseModel } from "app/core/type/base/BaseModel";
import { Paging } from "app/core/type/paging/paging.type";

export class Customer {
    customerId: number;
    companyName: string;
    customerCode: string;
    customerName: string;
    customerFamily: string;
    organizationId: number;
    organizationName: string;
    branchId: number;
    branchName: string;
    customerTypeId: number;
    customerTypeName: string;
    discountPercent: number;
    budgetId: number;
    budgetBalance: number;
    budgetCredit: number;
    budgetTotal: number;
    phone: string;
    address: string;
    status: number;
    statusDescription: string;
    clientIP: string;
    registerUserID: number;
    registerUserName: string;
    localChangeDate: string;
    localChangeTime: string;
    balanceFrom: number;
    balanceTo: number;
    creditFrom: number;
    creditTo: number;
    totalFrom: number;
    totalTo: number;
    customerTypeIdList: Array<number>;
    chaneDate: string; page: Paging;
}
export class BudgetDetail extends BaseModel {
    budgetDetailId: number;
    budgetId: number;
    ownerId: number;
    ownerName: string;
    ownerTypeId: number;
    amount: number;
    balance: number;
    Credit: number;
    currencyId: number;
    currencyName: string;
    currencyAbbreviation;
    requestId: number;
    requestDetailId: number;
    requestTypeId: number;
    requestTypeName: string;
    status: number;
    statusDescription: string;
    statusColor: string;
}
export class CustomerDrp {
    customerId: number;
    customerNameFamily: string;
    customerTypeId: number;
    customerTypeName: string;
    dicountPercent: number;

}