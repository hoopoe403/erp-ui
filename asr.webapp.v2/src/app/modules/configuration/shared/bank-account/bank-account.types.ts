import { BaseModel } from "app/core/type/base/BaseModel";
import { Paging } from "app/core/type/paging/paging.type";

/**
 * Bank Account model
 */
export class BankAccount extends BaseModel {
    bankAccountId: number;
    ownerId: number; // Customer ID or Contractor ID
    ownerTypeId: number; // Type: Customer or Contractor
    bankId: number;
    bankCode: string;
    bankName: string;
    branchCode: string;
    branchName: string;
    accountNumber: string;
    swiftCode: string;
    iban: string;
    accountTypeId: number;
    accountTypeCode: string;
    accountTypeName: string;
    status: number;
    statusDescription: string;
    statusColor: string;
    page: Paging;
}

/**
 * Bank Account Type
 */
export class BankAccountType {
    bankAccountTypeId: number;
    bankAccountTypeCode: string;
    bankAccountTypeName: string;
    status: number;
}

