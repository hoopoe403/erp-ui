import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { fromEvent, Subject, merge, Observable, forkJoin } from 'rxjs';
import { debounceTime, switchMap, map, distinctUntilChanged, startWith } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';
import { fuseAnimations } from "../../../../../@fuse/animations";
import { TransferService } from "../transfer.service";
import { Transfer, TransferDetail } from "../transfer.types";
import { Paging } from 'app/core/type/paging/paging.type';
import { AbstractControl, FormControl, FormGroup, ValidatorFn } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
import { KeyValue } from 'app/core/type/key-value/key-value.type';
import { MatSelect } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Invoice } from 'app/modules/financial/invoices/mechanized/invoice.types';
import jsPDF from 'jspdf';
import { ExcelHeader } from 'app/shared/excel/excel.types';
import { ExcelService } from 'app/shared/excel/excel.service';
import { Owner, OwnerType } from 'app/modules/configuration/owner/owner.types';
import { Warehouse } from '../../warehouse/warehouse.types';
import { formatDate } from '@angular/common';
@Component({
    selector: 'transfers-list',
    templateUrl: './list.component.html',
    styles: [
        /* language=SCSS */
        `
            .transfers-list-grid {
                grid-template-columns:100px 100px 40px;

                @screen sm {
                    grid-template-columns:100px 100px 100px 70px;
                }

                @screen md {
                    grid-template-columns: 100px 100px 150px 370px 150px 70px 70px;
                }

                @screen lg {
                    grid-template-columns: 100px 100px auto 290px 70px 120px 70px 70px;
                }
                @screen print{
                    grid-template-columns: 100px 100px 370px 70px;
                }
            }
        `,
        `
        .transfer-details-list-grid {
            grid-template-columns:100px 100px 40px;

            @screen sm {
                grid-template-columns:100px 100px 100px 70px;
            }

            @screen md {
                grid-template-columns: 100px 100px 150px 370px 150px 70px 70px;
            }

            @screen lg {
                grid-template-columns: 100px 100px auto 290px 70px 120px 70px 70px;
            }
            @screen print{
                grid-template-columns: 100px 100px 370px 70px;
            }
        }
    `
    ],
    animations: fuseAnimations,
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransferListComponent implements OnInit, OnDestroy {

    reportMode: number;
    selectedFrameCover = [];
    selectedPanelCover = [];
    selectedBrand = [];
    allFrameCoversSelected = false;
    allPanelCoversSelected = false;
    allBrandsSelected = false;
    brands: Array<KeyValue> = [];
    panelCovers = [];
    frameCovers = [];
    protected _onDestroy = new Subject<void>();
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;
    pagination: Paging;
    selection = new SelectionModel<any>(true, []);
    transferInfo: Transfer;
    transferDetailInfo: TransferDetail;
    statuses = [];
    defaultStatuses = [];
    frmAdvancedSearch = new FormGroup({
        reportType: new FormControl(1),
        requestType: new FormControl([0]),
        status: new FormControl(),
        srcOwnerType: new FormControl(),
        destnOwnerType: new FormControl(),
        transferCode: new FormControl(),
    });
    ownerTypes: Array<OwnerType>;
    srcOwners: Array<Owner>;
    destnOwners: Array<Owner>;
    srcWarehouses: Array<Warehouse>;
    destnWarehouses: Array<Warehouse>;
    srcOwnerControl = new FormControl();
    destnOwnerControl = new FormControl();
    srcOwnerFilteredOptions: Observable<Owner[]>;
    destnOwnerFilteredOptions: Observable<Owner[]>;
    srcWarehouseControl = new FormControl();
    destnWarehouseControl = new FormControl();
    srcWarehouseFilteredOptions: Observable<Warehouse[]>;
    destnWarehouseFilteredOptions: Observable<Warehouse[]>;


    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
    @ViewChild('selectFrameCover') selectFrameCover: MatSelect;
    @ViewChild('selectPanelCover') selectPanelCover: MatSelect;
    @ViewChild('selectBrand') selectBrand: MatSelect;
    searchInputControl: FormControl = new FormControl();
    // Private
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    isLoading: boolean;

    constructor(private service: TransferService,
        private cdr: ChangeDetectorRef,
        private snack: MatSnackBar, private excelService: ExcelService,
        private _changeDetectorRef: ChangeDetectorRef) {
        //this._unsubscribeAll = new Subject();
        this.transferInfo = new Transfer;
        this.transferInfo.requestTypeIdList = [];
        this.transferDetailInfo = new TransferDetail();
        this.srcOwners = new Array<Owner>();
        this.destnOwners = new Array<Owner>();
        this.srcWarehouses = new Array<Warehouse>();
        this.destnWarehouses = new Array<Warehouse>();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------
    isOverlayOpen: boolean = true;
    selectedInfoRow: Transfer = new Transfer();

    transfersList: Array<Transfer> = [];
    /**
     * On init
     */
    get transfers$(): Observable<Transfer[]> {
        return this.service.transfers$;
    }
    ngOnInit(): void {
        this.isLoading = true;
        this.service.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: Paging) => {

                // Update the pagination
                this.pagination = pagination;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        this.srcOwnerFilteredOptions = this.srcOwnerControl.valueChanges.pipe(
            startWith(""),
            map((value) => this._srcOwnerFilter(value))
        );
        this.destnOwnerFilteredOptions = this.destnOwnerControl.valueChanges.pipe(
            startWith(""),
            map((value) => this._destnOwnerFilter(value))
        );
        this.srcWarehouseFilteredOptions = this.srcWarehouseControl.valueChanges.pipe(
            startWith(""),
            map((value) => this._srcWarehouseFilter(value))
        );
        this.destnWarehouseFilteredOptions = this.destnWarehouseControl.valueChanges.pipe(
            startWith(""),
            map((value) => this._destnWarehouseFilter(value))
        );
        this.searchInputControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(150),
                distinctUntilChanged()
            )
            .subscribe(() => {
                if (!this.transfers$)
                    return;
                let value: string = this.searchInputControl.value.toLowerCase();
                this.transfers$.subscribe(items => {
                    this.transfersList = items.filter(x => x.transferCode.includes(value)
                        || x.referenceNo.includes(value)
                        || x.transferTypeName.toLowerCase().includes(value)
                        || x.merchandiseTypeName.toLowerCase().includes(value)
                        || x.srcWarehouseName.toLowerCase().includes(value)
                        || x.srcOwnerName.toLowerCase().includes(value)
                        || x.srcOwnerTypeName.toLowerCase().includes(value)
                        || x.destnWarehouseName.toLowerCase().includes(value)
                        || x.destnOwnerName.toLowerCase().includes(value)
                        || x.destnOwnerTypeName.toLowerCase().includes(value)
                        || x.requestTypeName.toLowerCase().includes(value)
                        || x.statusDescription.toLowerCase().includes(value));
                    this.cdr.detectChanges();
                })


            });
        this.loadData();
    }

    private setPaginatorAndSort(): void {
        if (this._sort && this._paginator) {
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
                    this._paginator.pageIndex = 0;


                });

            // Get products if sort or page changes
            merge(this._sort.sortChange, this._paginator.page).pipe(
                switchMap(() => {
                    this.isLoading = true;
                    this.pagination.order = this._sort.direction;
                    this.pagination.sort = this._sort.active;
                    if (this.reportMode == 1) {
                        this.transferInfo.page = this.pagination;
                        return this.service.getTransfers(this.transferInfo);
                    }
                    else {
                        this.transferDetailInfo.page = this.pagination;
                        return this.service.getTransferDetails(this.transferDetailInfo);
                    }
                }),
                map(() => {
                    this.isLoading = false;
                })
            ).subscribe();
        }
    }

    /** 
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
        this.service.disposeTransfers$();
        this.service.disponsePaginator$();

    }
    private setForkJoinValues(values: Array<any>): void {
        this.statuses = values[0].data;
        this.defaultStatuses = [];
        this.statuses.forEach(element => {
            if (element.isDefault === 1)
                this.defaultStatuses.push(element.statusId);
        });
        this.frmAdvancedSearch.controls["status"].setValue(this.defaultStatuses);
        this.transferInfo.statusIdList = this.defaultStatuses;
        this.transfersList = values[1].data.transfers;
        this.ownerTypes = values[2].data;
        this._changeDetectorRef.markForCheck();
        this.cdr.detectChanges();
        this.setPaginatorAndSort();
        this.transferInfo.requestTypeIdList.push(1000524);
        this.frmAdvancedSearch.controls["requestType"].setValue(this.transferInfo.requestTypeIdList);

    }
    private loadData(): void {
        this.reportMode = 1;
        forkJoin(
            this.getStatuses(),
            this.getTransfersListOnInit(),
            this.getOwnerTypes(),
        ).subscribe(res => {
            this.setForkJoinValues(res);
            this.isLoading = false;
            this.cdr.detectChanges();
        });
    }
    private resetSrcOwner() {
        this.srcOwners = [];
        this.srcOwnerControl.setValue("");
        this.transferInfo.srcOwnerIdList = [];
        this.srcOwnerFilteredOptions = this.srcOwnerControl.valueChanges.pipe(
            startWith(""),
            map((value) => this._srcOwnerFilter(value))
        );
        this.srcOwnerControl.setValidators(srcOwnerForbiddenNamesValidator(this.srcOwners));
        this.cdr.detectChanges();
    }
    private getSrcOwners(ownerTypeId: number) {
        this.isLoading = true;
        this.resetSrcOwner();
        this.service.getOwners(ownerTypeId).subscribe((res) => {
            this.srcOwners = res.data;
            this.srcOwnerControl.setValidators(
                srcOwnerForbiddenNamesValidator(this.srcOwners)
            );
            this.isLoading = false;
            this.cdr.detectChanges();
        });
    }
    private resetDestnOwner() {
        this.destnOwners = [];
        this.destnOwnerControl.setValue("");
        this.transferInfo.destnOwnerIdList = [];
        this.destnOwnerFilteredOptions = this.destnOwnerControl.valueChanges.pipe(
            startWith(""),
            map((value) => this._destnOwnerFilter(value))
        );
        this.destnOwnerControl.setValidators(destnOwnerForbiddenNamesValidator(this.destnOwners));
        this.cdr.detectChanges();
    }
    private getDestnOwners(ownerTypeId: number) {
        this.isLoading = true;
        this.resetDestnOwner();
        this.service.getOwners(ownerTypeId).subscribe((res) => {
            this.destnOwners = res.data;
            this.destnOwnerControl.setValidators(
                destnOwnerForbiddenNamesValidator(this.destnOwners)
            );
            this.isLoading = false;
            this.cdr.detectChanges();
        });
    }
    private resetSrcWarehouse() {
        this.srcWarehouses = [];
        this.srcWarehouseControl.setValue("");
        this.transferInfo.srcWarehouseIdList = [];
        this.srcWarehouseFilteredOptions = this.srcWarehouseControl.valueChanges.pipe(
            startWith(""),
            map((value) => this._srcWarehouseFilter(value))
        );
        this.srcWarehouseControl.setValidators(srcWarehouseForbiddenNamesValidator(this.srcWarehouses));
        this.cdr.detectChanges();
    }
    private getSrcWarehouses(ownerId: number) {
        this.isLoading = true;
        this.resetSrcWarehouse();
        this.service.getWarehouses(ownerId).subscribe((res) => {
            this.srcWarehouses = res.data;
            this.srcWarehouseControl.setValidators(
                srcWarehouseForbiddenNamesValidator(this.srcWarehouses)
            );
            this.isLoading = false;
            this.cdr.detectChanges();
        });
    }
    private resetDestnWarehouse() {
        this.destnWarehouses = [];
        this.destnWarehouseControl.setValue("");
        this.transferInfo.destnOwnerIdList = [];
        this.destnWarehouseFilteredOptions = this.destnWarehouseControl.valueChanges.pipe(
            startWith(""),
            map((value) => this._destnWarehouseFilter(value))
        );
        this.destnWarehouseControl.setValidators(destnWarehouseForbiddenNamesValidator(this.destnWarehouses));
        this.cdr.detectChanges();
    }
    private getDestnWarehouses(ownerId: number) {
        this.isLoading = true;
        this.resetDestnWarehouse();
        this.service.getWarehouses(ownerId).subscribe((res) => {
            this.destnWarehouses = res.data;
            this.destnWarehouseControl.setValidators(
                destnWarehouseForbiddenNamesValidator(this.destnWarehouses)
            );
            this.isLoading = false;
            this.cdr.detectChanges();
        });
    }

    setSrcOwnerTypeValue(event: { isUser: any; source: { value: any } }) {
        this.transferInfo.srcOwnerTypeId = event.source.value;
        this.resetSrcOwner();
        this.resetSrcWarehouse();
        this.getSrcOwners(event.source.value);
    }
    setSrcOwnerValue(event: { isUserInput: any; source: { value: any } }) {
        if (event.isUserInput) {
            const indx = this.srcOwners.findIndex(
                (x) =>
                    x.ownerName.toLowerCase().replace(/\s/g, "") ===
                    event.source.value.toLowerCase().replace(/\s/g, "")
            );
            if (indx === -1) {
                return;
            }
            this.transferInfo.srcOwnerIdList = [];
            this.transferInfo.srcOwnerIdList.push(this.srcOwners[indx].ownerId);
            this.getSrcWarehouses(this.srcOwners[indx].ownerId);
        }
    }

    setSrcWarehouseValue(event: { isUserInput: any; source: { value: any } }) {
        if (event.isUserInput) {
            const indx = this.srcWarehouses.findIndex(
                (x) =>
                    x.warehouseName.toLowerCase().replace(/\s/g, "") ===
                    event.source.value.toLowerCase().replace(/\s/g, "")
            );
            if (indx === -1) {
                return;
            }
            this.transferInfo.srcWarehouseIdList = [];
            this.transferInfo.srcWarehouseIdList.push(this.srcWarehouses[indx].warehouseId);
        }
    }

    setDestnWarehouseValue(event: { isUserInput: any; source: { value: any } }) {
        if (event.isUserInput) {
            const indx = this.destnWarehouses.findIndex(
                (x) =>
                    x.warehouseName.toLowerCase().replace(/\s/g, "") ===
                    event.source.value.toLowerCase().replace(/\s/g, "")
            );
            if (indx === -1) {
                return;
            }
            this.transferInfo.destnWarehouseIdList = [];
            this.transferInfo.destnWarehouseIdList.push(this.destnWarehouses[indx].warehouseId);
        }
    }

    setDestnOwnerTypeValue(event: { isUser: any; source: { value: any } }) {
        this.resetDestnOwner();
        this.resetDestnWarehouse();
        this.transferInfo.destnOwnerTypeId = event.source.value;
        this.getDestnOwners(event.source.value);
    }

    setDestnOwnerValue(event: { isUserInput: any; source: { value: any } }) {
        if (event.isUserInput) {
            const indx = this.destnOwners.findIndex(
                (x) =>
                    x.ownerName.toLowerCase().replace(/\s/g, "") ===
                    event.source.value.toLowerCase().replace(/\s/g, "")
            );
            if (indx === -1) {
                return;
            }
            this.transferInfo.destnOwnerIdList = [];
            this.transferInfo.destnOwnerIdList.push(this.destnOwners[indx].ownerId);
            this.getDestnWarehouses(this.destnOwners[indx].ownerId);
        }
    }
    private getOwnerTypes(): Observable<any> {
        return this.service.getOwnerTypes();
    }
    private getStatuses(): Observable<any> {
        return this.service.getStatuses();
    }
    private _srcOwnerFilter(value: string): Owner[] {
        const filterValue = value.toLowerCase().replace(" ", "");
        return this.srcOwners.filter((option) =>
            option.ownerName.toLowerCase().replace(" ", "").includes(filterValue)
        );
    }

    private _destnOwnerFilter(value: string): Owner[] {
        const filterValue = value.toLowerCase().replace(" ", "");
        return this.destnOwners.filter((option) =>
            option.ownerName.toLowerCase().replace(" ", "").includes(filterValue)
        );
    }
    private _srcWarehouseFilter(value: string): Warehouse[] {
        const filterValue = value.toLowerCase().replace(" ", "");
        return this.srcWarehouses.filter((option) =>
            option.warehouseName.toLowerCase().replace(" ", "").includes(filterValue)
        );
    }
    private _destnWarehouseFilter(value: string): Warehouse[] {
        const filterValue = value.toLowerCase().replace(" ", "");
        return this.destnWarehouses.filter((option) =>
            option.warehouseName.toLowerCase().replace(" ", "").includes(filterValue)
        );
    }
    setStatusValue(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            if (event.source.value != 0 && event.source.selected) {
                this.transferInfo.statusIdList.push(event.source.value);

            }
            else if (event.source.value != 0 && !event.source.selected) {
                const index: number = this.transferInfo.statusIdList.indexOf(event.source.value);
                if (index !== -1)
                    this.transferInfo.statusIdList.splice(index, 1);
                this.frmAdvancedSearch.controls["status"].setValue(this.transferInfo.statusIdList);
            }
        }


    }
    setRequestTypeValue(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            if (event.source.value != 0 && event.source.selected) {
                this.transferInfo.requestTypeIdList.push(event.source.value);

            }
            else if (event.source.value != 0 && !event.source.selected) {
                const index: number = this.transferInfo.requestTypeIdList.indexOf(event.source.value);
                if (index !== -1)
                    this.transferInfo.requestTypeIdList.splice(index, 1);
                this.frmAdvancedSearch.controls["requestType"].setValue(this.transferInfo.requestTypeIdList);
            }
        }


    }
    private getTransfers(transferInfo: Transfer) {
        this.isLoading = true;
        this.service.getTransfers(transferInfo)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((transfers: any) => {
                this.reportMode = 1;
                this.transfersList = transfers.data.transfers;
                this._changeDetectorRef.markForCheck();
                this.cdr.detectChanges();
                this.isLoading = false;
            });
    }
    private getTransferDetails(transferDetailInfo: TransferDetail) {
        this.isLoading = true;
        this.service.getTransferDetails(transferDetailInfo)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((transfers: any) => {
                this.reportMode = 2;
                this.transfersList = transfers.data.transferDetails;
                this._changeDetectorRef.markForCheck();
                this.cdr.detectChanges();
                this.isLoading = false;
            });
    }

    private getTransfersListOnInit(): Observable<any> {
        this.pagination = new Paging();
        this.pagination.flag = true;
        this.pagination.length = 0;
        this.pagination.order = 'desc';
        this.pagination.pageNumber = 1;
        this.pagination.pageSize = 100;
        this.pagination.sort = '';
        this.transferInfo.page = this.pagination;
        return this.service.getTransfersOnInit(this.transferInfo);
    }
    public transfersSearch() {

        this.getFormInfo();
        this.pagination.flag = true;
        this.pagination.pageNumber = 1;
        this.pagination.length = 0;
        let reportType: number = this.frmAdvancedSearch.controls['reportType'].value;
        if (reportType == 1) {
            this.transferInfo.page = this.pagination;
            this.getTransfers(this.transferInfo);
        }
        else {
            this.transferDetailInfo.page = this.pagination;
            this.getTransferDetails(this.transferDetailInfo);
        }

    }


    public resetAdvancedSearch() {
        this.frmAdvancedSearch.controls["transferCode"].setValue(null);
        this.frmAdvancedSearch.controls["status"].setValue(this.defaultStatuses);
        this.frmAdvancedSearch.controls["reportType"].setValue(1);
        this.frmAdvancedSearch.controls["requestType"].setValue([0]);
        this.frmAdvancedSearch.controls["srcOwnerType"].setValue(null);
        this.frmAdvancedSearch.controls["destnOwnerType"].setValue(null);
        this.resetSrcOwner();
        this.resetDestnOwner();
        this.resetSrcWarehouse();
        this.resetDestnWarehouse();

    }


    trackByFn(index: number, item: any): any {
        return item.id || index;
    }


    changeReportType(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            if (event.source.value === 1) {
                /* this.frmAdvancedSearch.controls['productCode'].setValue('');
                this.frmAdvancedSearch.controls['productName'].setValue('');
                this.frmAdvancedSearch.controls['brand'].setValue([]);
                this.frmAdvancedSearch.controls['frameCover'].setValue([]);
                this.frmAdvancedSearch.controls['panelCover'].setValue([]);
                this.frmAdvancedSearch.controls['productCode'].disable();
                this.frmAdvancedSearch.controls['productName'].disable();
                this.frmAdvancedSearch.controls['brand'].disable();
                this.frmAdvancedSearch.controls['frameCover'].disable();
                this.frmAdvancedSearch.controls['panelCover'].disable(); */
            }
            else {
                /*  this.frmAdvancedSearch.controls['productCode'].enable();
                 this.frmAdvancedSearch.controls['productName'].enable();
                 this.frmAdvancedSearch.controls['brand'].enable();
                 this.frmAdvancedSearch.controls['frameCover'].enable();
                 this.frmAdvancedSearch.controls['panelCover'].enable(); */
            }

        }


    }

    getFormInfo() {
        this.transferInfo.transferCode = this.frmAdvancedSearch.controls['transferCode'].value;

    }

    setInvoice(transferId: number) {
        let obj: Invoice = new Invoice();
        obj.requestId = transferId;
        this.service.setInvoice(obj).subscribe(res => {
            this.isLoading = false;
            this.snack.open(res.message, null, { duration: 5000 });
            this.cdr.detectChanges();
        });
    }
    download() {

        var pdf = new jsPDF('l');
        pdf.setFontSize(20);
        pdf.text('Transfer', 14, 8);
        pdf.setFontSize(12);
        pdf.setTextColor(99);
        let header = [];
        let tableData = [];
        let footer = [];
        let qty: number = 0;
        let date = formatDate(new Date(), 'yyyyMMdd_hhmmss', 'en');
        let fileName: string = 'Transfer_'.concat(date.concat('.pdf'));
        header = [{ header: 'Code', dataKey: 'transferCode' },
        { header: 'Type', dataKey: 'transferTypeName' },
        { header: 'Source (Owner & OwnerType)', dataKey: 'srcWarehouseName' },
        { header: 'Destination (Owner & OwnerType)', dataKey: 'destnWarehouseName' },
        { header: 'Measure', dataKey: 'measure' },
        { header: 'Applicant', dataKey: 'requestTypeName' },
        { header: 'Status', dataKey: 'status' },
        ]
        this.transfers$.subscribe(items => items.forEach(element => {
            qty = qty + 1;
            tableData.push([
                element.transferCode, element.transferTypeName, element.srcWarehouseName + (`(${element.srcOwnerName},${element.srcOwnerTypeName})`),
                element.destnWarehouseName + (`(${element.destnOwnerName},${element.destnOwnerTypeName})`), element.measure, element.requestTypeName,
                element.status
            ])
        }))
        footer = [['QTY', '', '', '', '', '', qty]
        ];

        (pdf as any).autoTable({
            columns: header,
            columnStyles: { name: { cellWidth: 50 } },
            body: tableData,
            foot: footer,
            footStyles: { fillColor: [223, 223, 223], textColor: [0, 0, 0] },
            theme: 'grid',
            showFoot: 'lastPage'
        });
        // Open PDF document in browser's new tab
        pdf.output('dataurlnewwindow')

        // Download PDF doc  
        pdf.save(fileName);
    }
    exportTable() {
        let columns: Array<ExcelHeader> = new Array<ExcelHeader>();
        let obj: Array<Transfer> = new Array<Transfer>();
        let qty: number = 0;
        let date = formatDate(new Date(), 'yyyyMMdd_hhmmss', 'en');
        let fileName: string = 'Transfer_'.concat(date.toString());
        columns.push({ basedColumnName: 'transferCode', excelColumnName: 'Code' });
        columns.push({ basedColumnName: 'transferTypeName', excelColumnName: 'Type' });
        columns.push({ basedColumnName: 'srcWarehouseName', excelColumnName: 'Source' });
        columns.push({ basedColumnName: 'destnWarehouseName', excelColumnName: 'Destination' });
        columns.push({ basedColumnName: 'measure', excelColumnName: 'Measure' });
        columns.push({ basedColumnName: 'requestTypeName', excelColumnName: 'Applicant' });
        columns.push({ basedColumnName: 'statusDescription', excelColumnName: 'Status' });

        this.transfers$.subscribe(items => items.forEach(element => {
            qty = qty + 1;
            obj.push(element);
        }));


        let footerData = [];

        footerData.push(['', '', '', '', '', '', '', 'QTY', qty]);

        this.excelService.exportAsExcelFile('transfer', '', columns, obj, footerData, fileName, 'Sheet1');

        obj = [];
    }

}

export function srcOwnerForbiddenNamesValidator(owners: Owner[]): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
        // below findIndex will check if control.value is equal to one of our options or not
        const index = owners.findIndex((debtor) => {
            return (
                debtor.ownerName.toLowerCase().replace(/\s/g, "") ==
                control.value.toLowerCase().replace(/\s/g, "")
            );
        });
        return index < 0 ? { forbiddenNames: { value: control.value } } : null;
    };
}
export function destnOwnerForbiddenNamesValidator(ownerses: Owner[]): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
        // below findIndex will check if control.value is equal to one of our options or not
        const index = ownerses.findIndex((debtor) => {
            return (
                debtor.ownerName.toLowerCase().replace(/\s/g, "") ==
                control.value.toLowerCase().replace(/\s/g, "")
            );
        });
        return index < 0 ? { forbiddenNames: { value: control.value } } : null;
    };
}

export function srcWarehouseForbiddenNamesValidator(warehouses: Warehouse[]): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
        // below findIndex will check if control.value is equal to one of our options or not
        const index = warehouses.findIndex((warehouse) => {
            return (
                warehouse.warehouseName.toLowerCase().replace(/\s/g, "") ==
                control.value.toLowerCase().replace(/\s/g, "")
            );
        });
        return index < 0 ? { forbiddenNames: { value: control.value } } : null;
    };
}
export function destnWarehouseForbiddenNamesValidator(warehouses: Warehouse[]): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
        // below findIndex will check if control.value is equal to one of our options or not
        const index = warehouses.findIndex((warehouse) => {
            return (
                warehouse.warehouseName.toLowerCase().replace(/\s/g, "") ==
                control.value.toLowerCase().replace(/\s/g, "")
            );
        });
        return index < 0 ? { forbiddenNames: { value: control.value } } : null;
    };
}
