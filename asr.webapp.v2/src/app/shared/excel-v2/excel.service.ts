import { Workbook } from 'exceljs';
import { Injectable } from '@angular/core';
import * as fs from 'file-saver';
import { ExcelHeader, ExcelHeaderLength, ExcelSheet } from './excel.types';
import numfmt from "numfmt";
const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';

@Injectable()
export class ExcelService {

    constructor() { }

    public exportAsExcelFile(excelData: Array<ExcelSheet>,
        excelFileName: string): void {
        const workbook = new Workbook();
        workbook.creator = 'Snippet Coder';
        workbook.lastModifiedBy = 'SnippetCoder';
        workbook.created = new Date();
        workbook.modified = new Date();
        for (let i = 0; i < excelData.length; i++) {
            const worksheet = workbook.addWorksheet(excelData[i].sheetName);
            let rows: number = 1;
            for (let j = 0; j < excelData[i].data.length; j++) {

                worksheet.addRow([]);
                let cell: string;
                let mergedCells: string;
                cell = 'A' + (rows).toString();
                mergedCells = cell + ':' + this.numToAlpha(excelData[i].data[j].headerArray.length - 1) + (rows).toString();
                worksheet.mergeCells(mergedCells);
                worksheet.getCell(cell).value = excelData[i].data[j].heading;
                worksheet.getCell(cell).alignment = { horizontal: 'center' };
                worksheet.getCell(cell).font = { size: 15, bold: true };
                worksheet.getCell(cell).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                worksheet.getCell(cell).fill = {
                    type: 'pattern', pattern: 'solid', fgColor: { argb: 'f1f5f9' },
                    bgColor: { argb: 'f1f5f9' }
                };

                rows = rows + 1;
                if (excelData[i].data[j].subHeading && excelData[i].data[j].subHeading != '') {
                    worksheet.addRow([]);
                    worksheet.mergeCells('A2:' + this.numToAlpha(excelData[i].data[j].headerArray.length - 1) + '1');
                    worksheet.getCell('A2').value = excelData[i].data[j].subHeading;
                    worksheet.getCell('A2').alignment = { horizontal: 'center' };
                    worksheet.getCell('A2').font = { size: 12, bold: false };
                }
                let head: any[] = [];
                let excelHeaderLength: Array<ExcelHeaderLength> = new Array<ExcelHeaderLength>();
                excelData[i].data[j].headerArray.forEach(element => {
                    head.push(element.excelColumnName);
                });
                excelHeaderLength = this.getMaxColumnLength(excelData[i].data[j].data, excelData[i].data[j].headerArray);
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
                rows = rows + 1;
                excelData[i].data[j].headerArray.forEach(element => {
                    for (const key in excelData[i].data[j].data[0]) {
                        if (element.basedColumnName.toString().replace(/\s/g, "").toLowerCase() == key.toString().replace(/\s/g, "").toLowerCase())
                            columnsArray.push(element.basedColumnName);
                    }
                });
                excelData[i].data[j].data.forEach(element => {
                    rows = rows + 1;
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

                        const bodyRow = worksheet.addRow(eachRow);
                        let counter: number = 0;
                        bodyRow.eachCell((cell) => {
                            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                            let format: string = excelData[i].data[j].headerArray[counter].format;
                            if (format && format != '')
                                cell.numFmt = format;
                            counter = counter + 1;
                        });
                    }
                });

                worksheet.addRow([]);
                rows = rows + 1;
                if (excelData[i].data[j].footerData != null) {
                    excelData[i].data[j].footerData.forEach(element => {
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
            }

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
                else if (header.width && header.width != 0)
                    maxLength = header.width;
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