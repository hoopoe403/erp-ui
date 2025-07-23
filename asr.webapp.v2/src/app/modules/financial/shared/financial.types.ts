import { BaseModel } from "app/core/type/base/BaseModel";

export class FinancialYear {
    financialYearId: number;
    partitionKey: number;
    partitionValue: number;
    isCurrent: number;

}

export class FinancialResourceType {
    financialResourceTypeId: number;
    financialResourceTypeCode: string;
    financialResourceTypeName: string;
    status: number;
    statusDescription: string;
    statusColor: string;
}
export class BankAccountType {
    bankAccountTypeId: number;
    bankAccountTypeCode: string;
    bankAccountTypeName: string;
    status: number;
    statusDescription: string;
    statusColor: string;
}
export class Bank {
    bankId: number;
    bankCode: string;
    bankName: string;
    status: number;
    url: string;
}



export class ChequeType extends BaseModel {
    chequeTypeId: number;
    chequeTypeCode: string;
    chequeTypeName: string;
    orderNumber: number;
    status: number;
    statusDescription: string;
    statusColor: string;

}

export class AuthorizedPaymentParty {
    authorizedPaymentPartyId: number;
    paymentTypeId: number;
    payerTypeId: number;
    recipientTypeId: number;
    payerTypeIdList: Array<number>;
    recipientTypeIdList: Array<number>;

}
export class SettlementType {
    settlementTypeId: number;
    settlementTypeCode: string;
    settlementTypeName: string;
    status: number;
    statusDescription: string;

}