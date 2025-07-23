import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, forkJoin, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators'
import { ApexOptions } from 'ng-apexcharts';
import { ProfitLossService } from './profit-loss.service';
import { DecimalPipe, formatDate } from '@angular/common';
import { FormControl, FormGroup } from '@angular/forms';
import { ProfitLoss, ProfitLossDetail, ProfitLossConfiguration, ExcelDetails, ExcelGrouped, ExcelSummary } from './profit-loss.types';
import { SheetData, ExcelHeader, ExcelSheet } from 'app/shared/excel-v2/excel.types';
import { ExcelService } from 'app/shared/excel-v2/excel.service';
import { FinancialYear } from '../../shared/financial.types';


@Component({
    selector: 'profit-loss',
    templateUrl: './profit-loss.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfitLossComponent implements OnInit, OnDestroy {
    chartVisitors: ApexOptions;
    chartConversions: ApexOptions;
    chartImpressions: ApexOptions;
    chartVisits: ApexOptions;
    chartVisitorsVsPageViews: ApexOptions;
    chartNewVsReturning: ApexOptions;
    chartGender: ApexOptions;
    chartAge: ApexOptions;
    chartLanguage: ApexOptions;
    profitLossList: Array<ProfitLoss> = [];
    profitLossDetailsList: Array<ProfitLossDetail> = [];
    profitLossExcelDetailsList: Array<ProfitLossDetail> = [];
    profitLossExcelGroupedList: Array<ProfitLossDetail> = [];
    profitLossDetailsInfo: ProfitLossDetail;
    profitLossInfo: ProfitLoss;
    totalSales: number;
    totalInvestment: number;
    _data: any;
    _financeData: any;
    cycles: any = [];
    isLoading: boolean = false;
    config: ProfitLossConfiguration;
    financialYears: Array<FinancialYear>;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    frmProfit = new FormGroup({
        cycle: new FormControl(),
        year: new FormControl(),
    });
    /**
     * Constructor
     */
    constructor(
        private _service: ProfitLossService,
        private _decimalPipe: DecimalPipe,
        private _router: Router,
        private cdr: ChangeDetectorRef,
        private excelService: ExcelService,
    ) {
        this.profitLossDetailsInfo = new ProfitLossDetail();
        this.profitLossInfo = new ProfitLoss();
        this.config = new ProfitLossConfiguration();
        this.config.profitLossDetailType = 'accumulative';
        this.config.showDetailInitialAndFinal = true;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Get the data
        this.loadData();
        this.isLoading = true;
        this._service.chartData$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((chartData) => {

                // Store the data
                this._data = chartData;

                // Prepare the chart data
                this._prepareChartData();
            });

        this._service.financeData$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((financeData) => {

                // Store the data
                this._financeData = financeData;

                // Prepare the chart data
            });

        this._service.profitLossList$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((list) => {
                this.profitLossList = list;
                this.getLastProfitLossDetailsBasedOnchosenYear();
            });

        // Attach SVG fill fixer to all ApexCharts
        window['Apex'] = {
            chart: {
                events: {
                    mounted: (chart: any, options?: any): void => {
                        this._fixSvgFill(chart.el);
                    },
                    updated: (chart: any, options?: any): void => {
                        this._fixSvgFill(chart.el);
                    }
                }
            }
        };
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Fix the SVG fill references. This fix must be applied to all ApexCharts
     * charts in order to fix 'black color on gradient fills on certain browsers'
     * issue caused by the '<base>' tag.
     *
     * Fix based on https://gist.github.com/Kamshak/c84cdc175209d1a30f711abd6a81d472
     *
     * @param element
     * @private
     */
    private _fixSvgFill(element: Element): void {
        // Current URL
        const currentURL = this._router.url;

        // 1. Find all elements with 'fill' attribute within the element
        // 2. Filter out the ones that doesn't have cross reference so we only left with the ones that use the 'url(#id)' syntax
        // 3. Insert the 'currentURL' at the front of the 'fill' attribute value
        Array.from(element.querySelectorAll('*[fill]'))
            .filter(el => el.getAttribute('fill').indexOf('url(') !== -1)
            .forEach((el) => {
                const attrVal = el.getAttribute('fill');
                el.setAttribute('fill', `url(${currentURL}${attrVal.slice(attrVal.indexOf('#'))}`);
            });
    }

    /**
     * Prepare the chart data from the data
     *
     * @private
     */


    private _prepareChartData(): void {
        // Visitors
        this.chartVisitors = {
            chart: {
                animations: {
                    speed: 400,
                    animateGradually: {
                        enabled: false
                    }
                },
                fontFamily: 'inherit',
                foreColor: 'inherit',
                width: '100%',
                height: '100%',
                type: 'area',
                toolbar: {
                    show: false
                },
                zoom: {
                    enabled: false
                }
            },
            colors: ['#818CF8'],
            dataLabels: {
                enabled: false
            },
            fill: {
                colors: ['#312E81']
            },
            grid: {
                show: true,
                borderColor: '#334155',
                padding: {
                    top: 10,
                    bottom: -20,
                    left: 20,
                    right: 0
                },
                position: 'back',
                xaxis: {
                    lines: {
                        show: true
                    }
                }
            },
            series: this._data,
            stroke: {
                width: 2
            },
            tooltip: {
                followCursor: true,
                theme: 'dark',
                x: {
                    format: 'MMM dd, yyyy'
                },
                y: {
                    formatter: (value: number): string => this._decimalPipe.transform(value, '1.0-5')
                }
            },
            xaxis: {
                axisBorder: {
                    show: false
                },
                axisTicks: {
                    show: false
                },
                crosshairs: {
                    stroke: {
                        color: '#475569',
                        dashArray: 0,
                        width: 2
                    }
                },
                labels: {
                    offsetY: -20,
                    style: {
                        colors: '#CBD5E1'
                    }
                },
                tickAmount: 10,
                tooltip: {
                    enabled: false
                },
                type: 'category',
            },
            yaxis: {
                axisTicks: {
                    show: false
                },
                axisBorder: {
                    show: false
                },
                tickAmount: 5,
                show: false,
                logarithmic: true,
                min: 0,
                labels: {
                    formatter: (val): string => this._decimalPipe.transform(val, '1.0-5')
                }
            }
        };


    }
    private getLastProfitLossDetailsBasedOnchosenYear() {
        let id = Math.max(...this.profitLossList.map(o => o.profitLossId))
        this.frmProfit.controls['cycle'].setValue(id);
        this.profitLossDetailsInfo.profitLossId = id;
        this.profitLossInfo = this.profitLossList.filter(x => x.profitLossId == id)[0];
        this.profitLossInfo.isCurrent = null;
        this.getPorfitLossDetail();
    }
    private getPorfitLossDetail() {
        if (this.config.profitLossDetailType == 'accumulative')
            this.getProfitLossDetailsGrouped(this.profitLossDetailsInfo);
        else
            this.getProfitLossDetails(this.profitLossDetailsInfo);
    }
    setCycle(event: {
        isUserInput: any;
        source: { value: any };
    }) {
        if (event.isUserInput && this.profitLossDetailsInfo.profitLossId != event.source.value) {
            this.isLoading = true;
            this.profitLossDetailsInfo.profitLossId = event.source.value;
            this.profitLossInfo = this.profitLossList.filter(x => x.profitLossId == event.source.value)[0];
            this.getPorfitLossDetail();
        }
    }
    setFinancialYear(event: {
        isUserInput: any;
        source: { value: any };
    }) {
        if (event.isUserInput && this.profitLossInfo.localYear != event.source.value) {
            this.isLoading = true;
            this.profitLossInfo.localYear = event.source.value;
            this.getProfitLoss(this.profitLossInfo);
        }
    }
    private getProfitLoss(profitLossInfo: ProfitLoss) {
        this._service
            .findByObj(profitLossInfo)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((list: any) => {
                this.profitLossList = list.data;
                this.getLastProfitLossDetailsBasedOnchosenYear();
                this.getChartData(this.profitLossInfo);
                this.isLoading = false;
                this.cdr.markForCheck();
                this.cdr.detectChanges();
            });
    }
    private getChartData(profitLossInfo: ProfitLoss) {
        this._service
            .getChartData(profitLossInfo)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((list: any) => {
                this._data = list.data;
                this.isLoading = false;
                this.cdr.markForCheck();
                this.cdr.detectChanges();
            });
    }
    private getProfitLossDetails(profitLossDetailInfo: ProfitLossDetail) {
        this._service
            .findByObjDetail(profitLossDetailInfo)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((list: any) => {
                this.costsAndIncomesTotalCalculation(list.data);
                this.investmentCalculation(list.data);
                this.profitLossDetailsList = list.data;
                this.isLoading = false;
                this.cdr.markForCheck();
                this.cdr.detectChanges();
            });
    }

    private getProfitLossDetailsGrouped(profitLossDetailInfo: ProfitLossDetail) {
        this._service
            .findByObjDetailGrouped(profitLossDetailInfo)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((list: any) => {
                this.costsAndIncomesTotalCalculation(list.data);
                this.investmentCalculation(list.data);
                this.profitLossDetailsList = list.data;
                this.isLoading = false;
                this.cdr.markForCheck();
                this.cdr.detectChanges();
            });
    }
    private costsAndIncomesTotalCalculation(data: Array<ProfitLossDetail>): void {
        this.totalSales = 0;
        data.forEach(element => {
            if (element.profitLossCategoryId == 1001491)
                this.totalSales = this.totalSales + element.remained;
        });
        if (this.profitLossInfo.grossProfit > 0)
            this.config.isProfit = true;
        else
            this.config.isProfit = false;

    }
    private investmentCalculation(data: Array<ProfitLossDetail>) {
        this.totalInvestment = 0;
        data.forEach(element => {
            if (element.profitLossCategoryName.toLowerCase().includes('wealth')
                || element.profitLossCategoryName.toLowerCase().includes('shareholder')) {
                this.totalInvestment = this.totalInvestment + element.remained;
            }
        });

    }
    setProfitLossDetailType(type: string): void {
        if (this.config.profitLossDetailType != type) {
            this.isLoading = true;
            this.config.profitLossDetailType = type;
            if (this.config.profitLossDetailType == 'accumulative')
                this.getProfitLossDetailsGrouped(this.profitLossDetailsInfo);
            else
                this.getProfitLossDetails(this.profitLossDetailsInfo);
        }

    }
    toggleShowInitialAndFinal(): void {
        this.config.showDetailInitialAndFinal = !this.config.showDetailInitialAndFinal;
    }
    private setForkJoinValues(values: Array<any>): void {
        this.financialYears = values[0].data;
        this.frmProfit.controls['year'].setValue(this.profitLossList[0].localYear);
        this.cdr.markForCheck();
        this.cdr.detectChanges();
    }
    private loadData(): void {
        forkJoin(
            this.getFinancialYear(),
        ).subscribe(res => {
            this.setForkJoinValues(res);
            this.isLoading = false;
            this.cdr.detectChanges();
        });
    }
    private getFinancialYear(): Observable<any> {
        return this._service.getFinancialYear();
    }
    exportTable() {
        let obj: Array<ExcelSheet> = new Array<ExcelSheet>();
        let sheet: ExcelSheet;
        let summaryData: Array<ExcelSummary>;
        let sheetData: SheetData;
        let columns: Array<ExcelHeader>;
        let date = formatDate(new Date(), 'yyyyMMdd_hhmmss', 'en');
        let fileName: string = 'ProfitLoss_'.concat(date.toString());

        sheet = new ExcelSheet();
        sheet.sheetName = 'Summary';
        sheet.data = new Array<SheetData>();
        sheetData = new SheetData();
        sheetData.heading = 'Gross Profit';
        summaryData = new Array<ExcelSummary>();
        summaryData.push({ incomes: this.profitLossInfo.grossIncomes, costs: this.profitLossInfo.grossCosts, profit: this.profitLossInfo.grossProfit });
        sheetData.data = summaryData;
        columns = new Array<ExcelHeader>();
        columns.push({ basedColumnName: 'incomes', excelColumnName: 'Incomes', format: '#,##0', width: 20 });
        columns.push({ basedColumnName: 'costs', excelColumnName: 'Costs', format: '#,##0', width: 20 });
        columns.push({ basedColumnName: 'profit', excelColumnName: 'Profit', format: '#,##0', width: 20 });
        sheetData.headerArray = columns;
        sheet.data.push(sheetData);



        /*      totalIncomesWithoutInventoryChanges = this.profitLossInfo.grossIncomes;
             totalCostsWithoutInventoryChanges = this.profitLossInfo.grossCosts;
             let productChanges: ProfitLossDetail = this.profitLossExcelDetailsList.filter(x => x.profitLossItemId == 100145346)[0];
             let goodsChanges: ProfitLossDetail = this.profitLossExcelDetailsList.filter(x => x.profitLossItemId == 100145347)[0];
             if (productChanges.profitLossItemTypeId == 1001481)
                 totalIncomesWithoutInventoryChanges = totalIncomesWithoutInventoryChanges - productChanges.remained;
             else
                 totalCostsWithoutInventoryChanges = totalCostsWithoutInventoryChanges - productChanges.remained;
             if (goodsChanges.profitLossItemTypeId == 1001481)
                 totalIncomesWithoutInventoryChanges = totalIncomesWithoutInventoryChanges - goodsChanges.remained;
             else
                 totalCostsWithoutInventoryChanges = totalCostsWithoutInventoryChanges - goodsChanges.remained; */

        sheetData = new SheetData();
        sheetData.heading = 'Net Profit';
        summaryData = new Array<ExcelSummary>();
        summaryData.push({ incomes: this.profitLossInfo.netIncomes, costs: this.profitLossInfo.netCosts, profit: this.profitLossInfo.netProfit });
        sheetData.data = summaryData;
        columns = new Array<ExcelHeader>();
        columns.push({ basedColumnName: 'incomes', excelColumnName: 'Incomes', format: '#,##0', width: 20 });
        columns.push({ basedColumnName: 'costs', excelColumnName: 'Costs', format: '#,##0', width: 20 });
        columns.push({ basedColumnName: 'profit', excelColumnName: 'Profit', format: '#,##0', width: 20 });
        sheetData.headerArray = columns;
        sheet.data.push(sheetData);
        obj.push(sheet);


        sheet = new ExcelSheet();
        sheet.sheetName = 'Details';
        sheet.data = new Array<SheetData>();
        sheetData = new SheetData();
        sheetData.heading = 'Profit and Loss Details';
        sheetData.data = this.profitLossExcelDetailsList;
        columns = new Array<ExcelHeader>();
        columns.push({ basedColumnName: 'profitLossCategoryName', excelColumnName: 'Category' });
        columns.push({ basedColumnName: 'profitLossItemDesc', excelColumnName: 'Item' });
        columns.push({ basedColumnName: 'profitLossItemTypeName', excelColumnName: 'Type' });
        columns.push({ basedColumnName: 'initialAmount', excelColumnName: 'Initial', format: '#,##0', width: 20 });
        columns.push({ basedColumnName: 'finalAmount', excelColumnName: 'Final', format: '#,##0', width: 20 });
        columns.push({ basedColumnName: 'remained', excelColumnName: 'Remained', format: '#,##0', width: 20 });
        sheetData.headerArray = columns;
        sheet.data.push(sheetData);
        obj.push(sheet);

        sheet = new ExcelSheet();
        sheet.sheetName = 'Group By Details';
        sheet.data = new Array<SheetData>();
        sheetData = new SheetData();
        sheetData.heading = 'Profit and Loss Grouped';
        sheetData.data = this.profitLossExcelGroupedList;
        columns = new Array<ExcelHeader>();
        columns.push({ basedColumnName: 'profitLossCategoryName', excelColumnName: 'Category' });
        columns.push({ basedColumnName: 'profitLossItemTypeName', excelColumnName: 'Type' });
        columns.push({ basedColumnName: 'initialAmount', excelColumnName: 'Initial', format: '#,##0', width: 20 });
        columns.push({ basedColumnName: 'finalAmount', excelColumnName: 'Final', format: '#,##0', width: 20 });
        columns.push({ basedColumnName: 'remained', excelColumnName: 'Remained', format: '#,##0', width: 20 });
        sheetData.headerArray = columns;
        sheet.data.push(sheetData);
        obj.push(sheet);

        this.excelService.exportAsExcelFile(obj, fileName);

        obj = [];
    }

    private getProfitLossDetailsForExcel() {
        return this._service
            .findByObjDetail(this.profitLossDetailsInfo);/* 
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((list: any) => {
                this.costsAndIncomesTotalCalculation(list.data);
                this.profitLossDetailsList = list.data;
                this.isLoading = false;
                this.cdr.markForCheck();
                this.cdr.detectChanges();
            }); */
    }

    private getProfitLossDetailsGroupedForExcel() {
        return this._service
            .findByObjDetailGrouped(this.profitLossDetailsInfo);/* 
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((list: any) => {
                this.costsAndIncomesTotalCalculation(list.data);
                this.cdr.markForCheck();
                this.cdr.detectChanges();
                this.profitLossDetailsList = list.data;
                this.isLoading = false;
                this.cdr.markForCheck();
                this.cdr.detectChanges();
            }); */
    }
    public loadExcelData(): void {
        forkJoin(
            this.getProfitLossDetailsForExcel(),
            this.getProfitLossDetailsGroupedForExcel(),
        ).subscribe(res => {
            this.profitLossExcelDetailsList = res[0].data;
            this.profitLossExcelGroupedList = res[1].data;
            this.exportTable();
            this.isLoading = false;
            this.cdr.detectChanges();
        });
    }
}
