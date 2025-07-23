import { Workbook } from 'exceljs';
import { Injectable } from '@angular/core';
import * as fs from 'file-saver';
import { ExcelHeader, ExcelHeaderLength } from './excel.types';


const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';

@Injectable()
export class ExcelService {

    constructor() { }

    public exportAsExcelFile(reportHeading: string,
        reportSubHeading: string,
        headersArray: Array<ExcelHeader>,
        json: any[],
        footerData: any,
        excelFileName: string,
        sheetName: string): void {
        const header = headersArray;
        const data = json;
        const workbook = new Workbook();
        workbook.creator = 'Snippet Coder';
        workbook.lastModifiedBy = 'SnippetCoder';
        workbook.created = new Date();
        workbook.modified = new Date();
        const worksheet = workbook.addWorksheet(sheetName);
        if (reportHeading != '') {
            worksheet.addRow([]);
            worksheet.mergeCells('A1:' + this.numToAlpha(header.length - 1) + '1');
            worksheet.getCell('A1').value = reportHeading;
            worksheet.getCell('A1').alignment = { horizontal: 'center' };
            worksheet.getCell('A1').font = { size: 15, bold: true };
        }

        if (reportSubHeading != '') {
            worksheet.addRow([]);
            worksheet.mergeCells('A2:' + this.numToAlpha(header.length - 1) + '1');
            worksheet.getCell('A2').value = reportSubHeading;
            worksheet.getCell('A2').alignment = { horizontal: 'center' };
            worksheet.getCell('A2').font = { size: 12, bold: false };
        }
        let head: any[] = [];
        let excelHeaderLength: Array<ExcelHeaderLength> = new Array<ExcelHeaderLength>();
        header.forEach(element => {
            head.push(element.excelColumnName);
        });
        excelHeaderLength = this.getMaxColumnLength(data, headersArray);
        const headerRow = worksheet.addRow(head);
        headerRow.eachCell((cell, index) => {
            cell.fill = {
                type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' },
                bgColor: { argb: 'FF0000FF' }
            };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            cell.font = { size: 12, bold: true };

            worksheet.getColumn(index).width = excelHeaderLength[index - 1].maxWidth < 10 ? 10 : excelHeaderLength[index - 1].maxWidth;
        });
        let columnsArray: any[] = [];
        header.forEach(element => {
            for (const key in json[0]) {
                if (element.basedColumnName.toString().replace(/\s/g, "").toLowerCase() == key.toString().replace(/\s/g, "").toLowerCase())
                    columnsArray.push(element.basedColumnName);
            }
        });


        data.forEach(element => {
            const eachRow = [];
            columnsArray.forEach((column) => {
                eachRow.push(element[column]);
            });
            if (element.isDeleted === 'Y') {
                const deletedRow = worksheet.addRow(eachRow);
                deletedRow.eachCell((cell) => {
                    cell.font = { name: 'Calibri', family: 4, size: 11, bold: false, strike: true };
                });
            }
            else {

                const footerRow = worksheet.addRow(eachRow);
                footerRow.eachCell((cell) => {
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

                });
            }
        });

        worksheet.addRow([]);
        if (footerData != null) {
            footerData.forEach(element => {
                const eachRow = [];
                element.forEach(val => {
                    eachRow.push(val)
                });


                const footerRow = worksheet.addRow(eachRow);
                footerRow.eachCell((cell) => {
                    if (cell.toString() !== '') {
                        cell.fill = {
                            type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' },
                            bgColor: { argb: 'FF0000FF' }
                        };
                        cell.font = { bold: true };
                        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                    }
                });
            });


        }

        workbook.xlsx.writeBuffer().then((data: ArrayBuffer) => {
            const blob = new Blob([data], { type: EXCEL_TYPE });
            fs.saveAs(blob, excelFileName + EXCEL_EXTENSION);
        })

    }
    private numToAlpha(num: number) {
        let alpha = '';
        for (; num >= 0; num = parseInt((num / 26).toString(), 10) - 1)
            alpha = String.fromCharCode(num % 26 + 0x41) + alpha;
        return alpha;
    }
    private getMaxColumnLength(data: any[], headers: Array<ExcelHeader>): Array<ExcelHeaderLength> {

        let result: Array<ExcelHeaderLength> = new Array<ExcelHeaderLength>();
        data.forEach(element => {
            headers.forEach(header => {
                const indx = result.findIndex(x => x.basedColumnName === header.basedColumnName);
                let maxLength: number = 0;
                if (indx !== -1)
                    maxLength = result[indx].maxWidth;
                else
                    maxLength = header.excelColumnName.length + 5;

                if (element[header.basedColumnName] !== null && element[header.basedColumnName].length > maxLength)
                    maxLength = element[header.basedColumnName].length;


                if (indx === -1)
                    result.push({ basedColumnName: header.basedColumnName, maxWidth: maxLength });
                else if (indx !== -1 && maxLength > result[indx].maxWidth)
                    result[indx].maxWidth = maxLength;
            });

        });
        return result;
    }


}