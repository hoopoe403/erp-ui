import { BaseModel } from "../base/BaseModel";

export class Column {
  columnId: number;
  userId: number;
  viewId: number;
  viewName: string;
  modelName: string;
  orderNumber: number;
  applicationName: string;
  list: number;
  excel: number;
  pdf: number;
  pdfHeader: string;
  excelHeader: string;
  hasAccess: number;
  columnIdList: Array<number>;
  checked: boolean;
  changeable: number;
}

export class UserColumn extends BaseModel {
  userColumnId: number;
  userId: number;
  viewId: number;
  columnId: number;
  columnIdList: Array<number>;
  status: number;
  statusDescription: string;
  statusColor: string;
}


export class ViewColumn {
  viewId: number;
  columnIdList: Array<number>;
}