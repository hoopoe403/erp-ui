import { Paging } from "app/core/type/paging/paging.type";
import { BaseModel } from "app/core/type/base/BaseModel";

/**
 * A vendor (supplier) as erp-be's Vendor API (/api/shared/vendor, TBL_VENDOR) sends and accepts it.
 * Formerly "Contractor" in this UI.
 */
export class Vendor extends BaseModel {
  vendorId: number;
  vendorCode: string;
  vendorName: string;
  vendorTypeId: number | null;
  vendorTypeName: string;
  phone: string;
  email: string;
  address: string;
  status: number;
  statusDescription: string;
  statusColor: string;
  currencyId: number | null;
  currencyName: string;
  currencyAbbreviation: string;
  vatGroupId: number | null;
  vatGroupName: string;
  paymentTypeId: number | null;
  paymentTypeName: string;
  /** The payment term in days (e.g. 30 = "Net 30") - defaults a purchase invoice's Due Date. */
  dueDate: number | null;
  bankAccounts: VendorBankAccount[];
}

/** A vendor's bank account on the wire - the API calls the status `status`. */
export interface VendorBankAccount {
  bankAccountId?: number;
  bankId: number;
  bankName?: string;
  branchCode: string;
  branchName: string;
  accountNumber: string;
  currencyId: number;
  currencyName?: string;
  currencyAbbreviation?: string;
  swiftCode?: string;
  iban?: string;
  status: number;
}

export interface VendorSearch {
  vendorCode?: string;
  vendorName?: string;
  statusIdList?: number[];
  page: Paging;
}

export interface VendorList {
  vendors: Vendor[];
  page: Paging;
}

export interface VendorType {
  vendorTypeId: number;
  vendorTypeCode: string;
  vendorTypeName: string;
}

export interface VendorStatus {
  statusId: number;
  statusDescription: string;
}
