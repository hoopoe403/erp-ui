import { ChangeDetectorRef, Component, ElementRef, Inject, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UploadDialogConfig } from '../upload-dialog.types';
import { PricingService } from '../../pricing.service';
import * as XLSX from 'xlsx';
import { Price, Pricing, ProductPriceList } from '../../pricing.types';
import { OpResult } from 'app/core/type/result/result.types';
import { fromEvent, Subject, merge, forkJoin, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, switchMap, takeUntil } from 'rxjs/operators';
import { MatSort } from '@angular/material/sort';
import { Paging } from 'app/core/type/paging/paging.type';
import { FuseAlertService } from '@fuse/components/alert';
import { AccessApi } from 'app/modules/configuration/identity/identity.types';
import { ExcelHeader } from 'app/shared/excel/excel.types';
import { formatDate } from '@angular/common';
import { ExcelService } from 'app/shared/excel/excel.service';

@Component({
    selector: 'upload-dialog',
    templateUrl: './upload-dialog.component.html',
    encapsulation: ViewEncapsulation.None, styles: [
        `
        .price-list-grid {
            grid-template-columns:  100px 50px auto  130px 130px 130px 100px;

            @screen sm {
                grid-template-columns: 48px auto 112px 72px;
            }

            @screen md {
                grid-template-columns:  100px 50px auto  130px 130px 130px 100px;
            }

            @screen lg {
                grid-template-columns: 100px 50px auto  130px 130px 130px 100px;
            }
        }
        
        `
    ],
})
export class UploadDialogComponent implements OnInit {
    /**
     * Constructor
     */
    @ViewChild(MatSort) private _sort: MatSort;
    @ViewChild('priceListFilter', { static: true }) priceListFilter: ElementRef;
    @ViewChild('fileUpload', { static: true }) fileUpload: ElementRef;
    informationType: string = 'list';
    _result: OpResult = new OpResult();
    isLoading: boolean;
    productPriceList: Array<ProductPriceList>;
    filteredProductPriceList: Array<ProductPriceList>;
    productPriceListInfo: ProductPriceList;
    private _unsubscribeAll: Subject<any>;
    fileName = '';
    pagination: Paging;
    uploadProcess: boolean = false;
    userAccessList: AccessApi;
    private prices: Array<Pricing>;
    constructor(private service: PricingService,
        @Inject(MAT_DIALOG_DATA) public data: UploadDialogConfig, private cdr: ChangeDetectorRef,
        private _changeDetectorRef: ChangeDetectorRef, private excelService: ExcelService,
        private _fuseAlertService: FuseAlertService,
        public matDialogRef: MatDialogRef<UploadDialogComponent>
    ) {
        this._unsubscribeAll = new Subject();
        this.productPriceList = new Array<ProductPriceList>();
        this.filteredProductPriceList = new Array<ProductPriceList>();
        this.productPriceListInfo = new ProductPriceList();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        this.bindFilters();
        this.initialPagination();

    }
    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }


    getSummmaryTextColor(type: string) {
        /*  let classValue: string;
         let targetValue: number;
         switch (type) {
             case 'a':
                 targetValue = this.Upload.stock -
                     this.Upload.initialStock;
            
                 break;
             case 'b':
                 targetValue = this.Upload.stock -
                     this.Upload.preReserve - this.Upload.reserve -
                     this.Upload.initialStock;
                 break;
             case 'c':
                 targetValue = this.Upload.totalPrice -
                     this.Upload.totalInitialPrice;
                 break;
             case 'd':
                 targetValue = this.Upload.totalRemainedPrice -
                     this.Upload.totalInitialPrice;
                 break;
         }
         if (targetValue < 0)
             classValue = 'text-red-500';
         else if (targetValue > 0)
             classValue = 'text-green-500';
         else
             classValue = 'text-blue-500';
 
         return classValue; */



    }
    private setForkJoinValues(values: Array<any>): void {

        this.userAccessList = values[0].data;
        this._changeDetectorRef.markForCheck();
        this.cdr.detectChanges();
    }
    private loadData(): void {

        forkJoin(
            this.loadUserAccess(),
        ).subscribe(res => {
            this.setForkJoinValues(res);
            this.isLoading = false;
            this.cdr.detectChanges();
        });
    }
    private loadUserAccess(): Observable<any> {
        return this.service.loadUserAccess(this.productPriceListInfo);
    }

    ReadExcel(event: any): void {
        this.isLoading = true;
        let file = event.target.files[0];
        this.fileName = file.name;
        let fileReader = new FileReader();
        fileReader.readAsBinaryString(file);
        fileReader.onload = (e) => {
            var workbook = XLSX.read(fileReader.result, { type: 'binary' });
            var sheetNames = workbook.SheetNames;
            var excelData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNames[0]]);
            this.createProductPriceList(excelData);
        }
    }
    private createProductPriceList(excelData: any): void {
        let obj: ProductPriceList = new ProductPriceList();
        obj.priceList = [];
        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');
        this.uploadProcess = false;
        for (let index = 0; index < excelData.length; index++) {
            if (!excelData[index].PRODUCT_ID || !excelData[index].PRICE && excelData[index].PRICE !=  0) {
                this.isLoading = false;
                this.fileUpload.nativeElement.value = "";
                this._result.succeed = false;
                this._result.message = 'File format is invalid';
                this.showAlert('errorMessage');
                return;
            }
            obj.priceList.push({ targetId: excelData[index].PRODUCT_ID, price: excelData[index].PRICE });
        }
        this.service.createProductPriceList(obj).subscribe(res => {
            this.uploadProcess = res.succeed;
            if (res.succeed) {
                this.filteredProductPriceList = this.productPriceList = res.data;
                this.productPriceListInfo.listId = this.productPriceList[0].listId;
            }
            else {
                this.filteredProductPriceList = this.productPriceList = [];
                this.productPriceListInfo.listId = 0;
                this._result.succeed = res.succeed;
                this._result.message = res.message;
                this.showAlert('errorMessage');
            }

            this.setSort();
            this.isLoading = false;
            this.cdr.detectChanges();

        });

    }
    private bindFilters() {
        fromEvent(this.priceListFilter.nativeElement, 'keyup')
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(150),
                distinctUntilChanged()
            )
            .subscribe(() => {

                if (!this.productPriceList)
                    return;

                if (this.priceListFilter.nativeElement.value) {
                    let value: string = this.priceListFilter.nativeElement.value.toLowerCase();
                    this.filteredProductPriceList = this.productPriceList.filter(x => x.productCode.toLocaleLowerCase().includes(value)
                        || x.fullName.toLocaleLowerCase().includes(value)
                        || x.brandName.toLocaleLowerCase().includes(value)
                        || x.oldPrice.toString().includes(value)
                        || x.newPrice.toString().includes(value)
                        || x.difference.toString().includes(value)
                        || x.differencePercent.toString().includes(value));
                }
                else
                    this.filteredProductPriceList = this.productPriceList;
                this.cdr.detectChanges();

            });


    }
    getDifferenceTextColor(value: number): string {
        let classValue: string;
        if (value < 0)
            classValue = 'text-red-500';
        else
            classValue = 'text-green-500';

        return classValue;

    }
    private setSort(): void {
        if (this._sort) {
            // Set the initial sort
            this._sort.sort({
                id: '',
                start: 'desc',
                disableClear: true
            });

            // Mark for check
            this._changeDetectorRef.markForCheck();

            // If the user changes the sort order...
            this._sort.sortChange
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe(() => {
                    // Reset back to the first page



                });

            // Get products if sort or page changes
            merge(this._sort.sortChange).pipe(
                switchMap(() => {
                    this.isLoading = true;
                    this.pagination.flag = false;
                    this.pagination.order = this._sort.direction == null ? 'desc' : this._sort.direction;
                    this.pagination.sort = this._sort.active == null ? '' : this._sort.active;
                    this.productPriceListInfo.page = this.pagination;
                    return this.service.getProductPriceList(this.productPriceListInfo);
                }),
                map((res: any) => {
                    this.isLoading = false;
                    this.filteredProductPriceList = this.productPriceList = res.data;
                    this.productPriceListInfo.listId = this.productPriceList[0].listId;
                })
            ).subscribe();
        }
    }
    private initialPagination() {
        this.pagination = new Paging();
        this.pagination.flag = true;
        this.pagination.length = 0;
        this.pagination.order = 'desc';
        this.pagination.pageNumber = 1;
        this.pagination.pageSize = 100;
        this.pagination.sort = '';
    }
    confirm() {
        this.isLoading = true;
        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');
        this.service.confirmProductPriceList(this.productPriceListInfo).subscribe(res => {
            this.isLoading = false;
            this._result.succeed = res.succeed;
            this._result.message = res.message;
            if (this._result.succeed)
                this.showAlert('successMessage');
            else
                this.showAlert('errorMessage');
            this.cdr.detectChanges();
        });
    }
    private showAlert(name: string): void {
        this._fuseAlertService.show(name);
    }

    private dismissAlert(name: string): void {
        this._fuseAlertService.dismiss(name);
    }
    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    exportCurrentPrice() {
        this.isLoading = true;
        this.service.getAllPrices(new Pricing).subscribe(res => {
            this.prices = res.data;
            this.exportTable();
            this.isLoading = false;
        });


    }
    exportTable() {



        let columns: Array<ExcelHeader> = new Array<ExcelHeader>();
        let obj: Array<Pricing> = new Array<Pricing>();
        let price: number = 0;
        let qty: number = 0;
        let date = formatDate(new Date(), 'yyyyMMdd_hhmmss', 'en');
        let fileName: string = 'Price_'.concat(date.toString());

        columns.push({ basedColumnName: 'productId', excelColumnName: 'PRODUCT_ID' });
        columns.push({ basedColumnName: 'brandName', excelColumnName: 'Brand' });
        columns.push({ basedColumnName: 'productCode', excelColumnName: 'Code' });
        columns.push({ basedColumnName: 'productName', excelColumnName: 'Name' });
        columns.push({ basedColumnName: 'price', excelColumnName: 'PRICE' });
        columns.push({ basedColumnName: 'effLocalDate', excelColumnName: 'Effective Date' });
        columns.push({ basedColumnName: 'effLocalTime', excelColumnName: 'Effective Time' });


        this.prices.forEach(element => {
            qty = qty + 1;
            price = price + element.price;
            obj.push(element);

        });


        this.excelService.exportAsExcelFile('', '', columns, obj, [], fileName, 'Sheet1');

        obj = [];
    }
}
