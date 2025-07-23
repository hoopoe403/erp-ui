import { Paging } from "app/core/type/paging/paging.type";
import { BaseModel } from "app/core/type/base/BaseModel";
export class Contractor extends BaseModel {
  contractorId: number;
  contractorCode: string;
  contractorName: string;
  contractorTypeId: number;
  contractorTypeName: string;
  organizationId: number;
  organizationName: string;
  settlementTypeId: number;
  settlementTypeName: string;
  phone: string;
  email: string;
  address: string;
  status: number;
  statusDescription: string;
  statusColor: string;
  statusIdList: Array<number>;
  contractorTypeIdList: Array<number>;
  settlementTypeIdList: Array<number>;
  page: Paging;
}


