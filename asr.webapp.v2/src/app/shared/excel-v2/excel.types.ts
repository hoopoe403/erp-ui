
export class ExcelHeader {

    basedColumnName: string;
    excelColumnName: string;
    format?: string = '';
    width?: number = 0
}

export class ExcelHeaderLength {

    basedColumnName: string;
    maxWidth: number;
}



export class ExcelSheet {
    sheetName: string;
    data: Array<SheetData>;

}
export class SheetData {
    heading: string;
    subHeading: string;
    headerArray: Array<ExcelHeader>;
    data: any;
    footerData: any;


}
