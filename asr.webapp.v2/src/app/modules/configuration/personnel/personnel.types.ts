import { Paging } from "app/core/type/paging/paging.type";
import { BaseModel } from "app/core/type/base/BaseModel";

export class Personnel extends BaseModel {
  personnelId: number;
  personnelNo: string;
  personnelName: string;
  personnelFamily: string;
  genderId: number;
  genderName: string;
  language: string;
  nationalId: string;
  status: number;
  statusColor: string;
  statusDescription: string;
  statusIdList: Array<number>;
  page: Paging;
}

export interface PersonnelPagination { }
