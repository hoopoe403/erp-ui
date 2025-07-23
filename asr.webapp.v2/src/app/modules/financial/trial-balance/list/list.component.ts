import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { Subject, merge, Observable, forkJoin, fromEvent, of } from 'rxjs';
import { debounceTime, switchMap, map, distinctUntilChanged } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';
import { fuseAnimations } from "../../../../../@fuse/animations";
import { TrialBalanceService } from "../trial-balance.service";
import { TrialBalance, TrialBalanceDetail } from "../trial-balance.types";
import { Paging } from 'app/core/type/paging/paging.type';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
import { FinancialYear } from '../../shared/financial.types';
import { DialogService } from '../details/dialog.service'
import { Owner, OwnerType } from 'app/modules/configuration/owner/owner.types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { DecimalPipe, formatDate } from '@angular/common';
import { ExcelService } from 'app/shared/excel/excel.service';
import { ExcelHeader } from 'app/shared/excel/excel.types';
import { KeyValue } from 'app/core/type/key-value/key-value.type';

@Component({
    selector: 'trial-balance-list',
    templateUrl: './list.component.html',
    styles: [
        /* language=SCSS */
        `
            .trial-balance-grid {
                grid-template-columns:auto  150px  150px 150px 150px  50px; 

                @screen sm {
                    grid-template-columns:auto  150px  150px 150px 150px  50px;
                }

                @screen md {
                    grid-template-columns: auto  150px  150px 150px 150px  50px;
                }

                @screen lg {
                    grid-template-columns: auto  150px  150px 150px 150px  50px;
                }
                @screen print{
                    grid-template-columns:auto  150px  150px 150px 150px  50px;
                }
            }
        `,
        `
        .trial-balances-detail-grid {
            grid-template-columns:auto  70px 90px 90px 130px  130px 130px 150px 120px 120px 50px ;

            @screen sm {
                grid-template-columns:auto  100px 100px 100px 100px 70px;
            }

            @screen md {
                grid-template-columns: auto  100px 100px 100px 100px 70px;
            }

            @screen lg {
                grid-template-columns: auto  70px 90px 90px 130px  130px 130px 150px 120px 120px 50px ;
            }
            @screen print{
                grid-template-columns: auto  70px 90px 90px 130px  130px 130px 150px 120px 120px 50px ;
            }
        }
    `
    ],
    animations: fuseAnimations,
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrialBalanceListComponent implements OnInit, OnDestroy {
    protected _onDestroy = new Subject<void>();
    @ViewChild('paginator') _paginator: MatPaginator;
    @ViewChild('sort') private _sort: MatSort;
    @ViewChild('filter', { static: true }) filter: ElementRef;
    public ownersMultiCtrl: FormControl = new FormControl();
    public ownersMultiFilterCtrl: FormControl = new FormControl();
    public filteredOwnersMulti: Array<Owner> = new Array<Owner>();
    public selectedOwners: Array<Owner> = new Array<Owner>();
    public owners: Array<Owner> = new Array<Owner>();
    paymentTypes: Array<KeyValue> = [];
    partitionKeyList: Array<number> = [];

    pagination: Paging;
    selection = new SelectionModel<any>(true, []);
    trialBalanceInfo: TrialBalance;
    trialBalanceDetailInfo: TrialBalanceDetail;
    financialYears: Array<FinancialYear>;
    reportType: number;
    lastValueReportType: number;
    ownerTypes: Array<OwnerType>;
    frmAdvancedSearch = new FormGroup({
        reportType: new FormControl(),
        year: new FormControl(),
        accountType: new FormControl(),
        debitFrom: new FormControl(),
        debitTo: new FormControl(),
        creditFrom: new FormControl(),
        creditTo: new FormControl(),
        debitBalanceFrom: new FormControl(),
        debitBalanceTo: new FormControl(),
        creditBalanceFrom: new FormControl(),
        creditBalanceTo: new FormControl(),
        paymentType: new FormControl(),
    });


    searchInputControl: FormControl = new FormControl();

    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;

    // Private
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    isLoading: boolean;

    constructor(private service: TrialBalanceService,
        private excelService: ExcelService,
        private _dialogService: DialogService,
        private _decimalPipe: DecimalPipe,
        private cdr: ChangeDetectorRef,
        private _formBuilder: FormBuilder,
        private _changeDetectorRef: ChangeDetectorRef) {
        //this._unsubscribeAll = new Subject();
        this.trialBalanceInfo = new TrialBalance;
        this.trialBalanceInfo.ownerIdList = [];
        this.trialBalanceDetailInfo = new TrialBalanceDetail();
        this.trialBalanceDetailInfo.ownerIdList = [];
        this.trialBalanceDetailInfo.paymentTypeIdList = [];
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------
    isOverlayOpen: boolean = true;
    selectedInfoRow: TrialBalance = new TrialBalance();
    selectedInfoDetailRow: TrialBalanceDetail = new TrialBalanceDetail();

    trialBalances: Array<TrialBalance> = [];
    trialBalancesDetails: Array<TrialBalanceDetail> = [];
    /**
     * On init
     */


    get trialBalances$(): Observable<TrialBalance[]> {
        return this.service.trialBalances$;
    }
    get trialBalancesDetails$(): Observable<TrialBalanceDetail[]> {
        return this.service.trialBalancesDetails$;
    }
    ngOnInit(): void {
        this.reportType = 1;
        this.isLoading = true;
        this.ownersMultiCtrl.disable();
        this.service.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: Paging) => {

                // Update the pagination
                this.pagination = pagination;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        this.ownersMultiFilterCtrl.valueChanges
            .pipe(takeUntil(this._onDestroy))
            .subscribe(() => {
                this.filterOwnersMulti();
            });



        fromEvent(this.filter.nativeElement, 'keyup')
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(150),
                distinctUntilChanged()
            )
            .subscribe(() => {
                if (this.reportType == 1)
                    if (!this.trialBalances)
                        return;
                    else
                        if (!this.trialBalancesDetails)
                            return;

                if (this.reportType == 1)
                    this.trialBalances$.pipe(map(items => items.filter(x =>
                        x.ownerName.toLowerCase().includes(this.filter.nativeElement.value) ||
                        x.ownerTypeName.toLowerCase().includes(this.filter.nativeElement.value) ||
                        x.debit.toString().includes(this.filter.nativeElement.value) ||
                        x.credit.toString().includes(this.filter.nativeElement.value) ||
                        x.debitBalance.toString().includes(this.filter.nativeElement.value) ||
                        x.creditBalance.toString().includes(this.filter.nativeElement.value)))).subscribe(elements => {
                            this.trialBalances = elements as TrialBalance[];
                            this._changeDetectorRef.markForCheck();
                            this.cdr.detectChanges();
                        });
                else
                    this.trialBalancesDetails$.pipe(map(items => items.filter(x =>
                        x.ownerName.toLowerCase().includes(this.filter.nativeElement.value) ||
                        x.ownerTypeName.toLowerCase().includes(this.filter.nativeElement.value) ||
                        x.documentNumber.toLowerCase().includes(this.filter.nativeElement.value) ||
                        x.localChangeDate.toLowerCase().includes(this.filter.nativeElement.value) ||
                        x.credit.toString().includes(this.filter.nativeElement.value) ||
                        x.debit.toString().includes(this.filter.nativeElement.value) ||
                        x.remained.toString().includes(this.filter.nativeElement.value) ||
                        x.financialCategoryName.toLowerCase().includes(this.filter.nativeElement.value) ||
                        x.requestTypeName.toLowerCase().includes(this.filter.nativeElement.value) ||
                        x.requestStatusDescription.toLowerCase().includes(this.filter.nativeElement.value)))).subscribe(elements => {
                            this.trialBalancesDetails = elements as TrialBalanceDetail[];
                            this._changeDetectorRef.markForCheck();
                            this.cdr.detectChanges();
                        });
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
                    this.pagination.pageNumber = this._paginator.pageIndex + 1;
                    if (this.reportType == 1) {
                        this.trialBalanceInfo.page = this.pagination;
                        return this.service.getTrialBalances(this.trialBalanceInfo)
                    } else {
                        this.trialBalanceDetailInfo.page = this.pagination;
                        return this.service.getTrialBalancesDetails(this.trialBalanceDetailInfo);
                    }
                }),
                map(() => {
                    this.isLoading = false;
                    this._changeDetectorRef.markForCheck();
                    this.cdr.detectChanges();
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
        this.service.disposeTrialbalances$();
        this.service.disposeTrialbalancesDetails$();
        this.service.disponsePaginator$();

    }
    private setForkJoinValues(values: Array<any>): void {

        this.financialYears = values[0].data;
        this.trialBalances = values[1].data.trialBalances;
        this.ownerTypes = values[2].data;
        this.paymentTypes = values[3].data;
        this.paymentTypes.push({ key: 0, value: 'None' });
        this.partitionKeyList.push(this.financialYears.filter(x => x.isCurrent === 1)[0].partitionKey);
        this.frmAdvancedSearch.controls['year'].setValue(this.partitionKeyList);
        this.trialBalanceInfo.page = this.pagination;
        this.changeReportType({
            isUserInput: true,
            source: { value: 1, selected: true }
        });
        this.frmAdvancedSearch.controls['reportType'].setValue(1);
        this.lastValueReportType = 1;
        this.frmAdvancedSearch.controls['accountType'].setValue(1000612);
        this._changeDetectorRef.markForCheck();
        this.cdr.detectChanges();
        this.getOwners(1000612);
        this.setPaginatorAndSort();
    }
    private loadData(): void {
        this.trialBalanceDetailInfo.ownerTypeId = 1000612;
        this.trialBalanceInfo.ownerTypeId = 1000612;
        forkJoin(
            this.getFinancialYears(),
            this.getTrialBalancesOnInit(),
            this.getOwnertTypes(),
            this.getPaymentTypes(),
        ).subscribe(res => {
            this.setForkJoinValues(res);
            this.isLoading = false;
            this.cdr.detectChanges();
        });
    }

    private getFinancialYears(): Observable<any> {
        return this.service.getFinancialYears();
    }
    private getOwnertTypes(): Observable<any> {
        return this.service.getOwnerTypes();
    }

    private getPaymentTypes(): Observable<any> {
        return this.service.getPaymentTypes();
    }

    setStatusValue(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            if (event.source.value != 0 && event.source.selected) {
                this.trialBalanceDetailInfo.statusIdList.push(event.source.value);

            }
            else if (event.source.value != 0 && !event.source.selected) {
                const index: number = this.trialBalanceDetailInfo.statusIdList.indexOf(event.source.value);
                if (index !== -1)
                    this.trialBalanceDetailInfo.statusIdList.splice(index, 1);
                this.frmAdvancedSearch.controls["status"].setValue(this.trialBalanceDetailInfo.statusIdList);
            }
        }


    }

    setOwnerTypeValue(event: {
        isUserInput: any;
        source: { value: any; };
    }) {

        if (event.isUserInput) {
            this.trialBalanceDetailInfo.ownerTypeId = event.source.value;
            this.trialBalanceInfo.ownerTypeId = event.source.value;
            this.trialBalanceDetailInfo.ownerIdList = [];
            this.trialBalanceInfo.ownerIdList = [];
            this.getOwners(event.source.value);
        }


    }
    private getOwners(ownerTypeId: number) {
        this.selectedOwners = [];
        this.ownersMultiCtrl.disable();
        this.service.getOwners(ownerTypeId).subscribe(res => {
            this.owners = [...res.data];
            this.filteredOwnersMulti = [...res.data];
            this.ownersMultiCtrl.enable();
        });
    }
    private getTrialBalances(trialBalanceInfo: TrialBalance) {
        this.isLoading = true;
        this.service.getTrialBalances(trialBalanceInfo)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((trialBalances: any) => {
                this.reportType = this.frmAdvancedSearch.controls['reportType'].value;
                this.trialBalancesDetails = [];
                this.trialBalances = trialBalances.data.trialBalances;
                this.trialBalanceInfo.page = this.pagination;
                this._changeDetectorRef.markForCheck();
                this.isLoading = false;
                this.cdr.detectChanges();
                if (this.lastValueReportType !== this.reportType) {
                    this.setPaginatorAndSort();
                    this.lastValueReportType = this.reportType;
                }
            });

    }

    private getTrialBalancesDetails(trialBalanceDetailInfo: TrialBalanceDetail) {
        this.isLoading = true;
        this.service.getTrialBalancesDetails(trialBalanceDetailInfo)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((trialBalancesDetails: any) => {
                this.reportType = this.frmAdvancedSearch.controls['reportType'].value;
                this.trialBalances = [];
                this.trialBalancesDetails = trialBalancesDetails.data.trialBalancesDetails;
                this.trialBalanceDetailInfo.page = this.pagination;
                this._changeDetectorRef.markForCheck();
                this.isLoading = false;
                this.cdr.detectChanges();
                if (this.lastValueReportType !== this.reportType) {
                    this.setPaginatorAndSort();
                    this.lastValueReportType = this.reportType;
                }
            });
    }

    private getTrialBalancesOnInit(): Observable<any> {
        this.pagination = new Paging();
        this.pagination.flag = true;
        this.pagination.length = 0;
        this.pagination.order = 'desc';
        this.pagination.pageNumber = 1;
        this.pagination.pageSize = 100;
        this.pagination.sort = '';
        this.trialBalanceInfo.page = this.pagination;
        return this.service.geTrialBalancesInOnInit(this.trialBalanceInfo);
    }
    public trialBalancesSearch() {

        this.pagination.flag = true;
        this.pagination.pageNumber = 1;
        this.pagination.length = 0;
        this.pagination.sort = '';
        this.pagination.order = 'asc';
        if (this.frmAdvancedSearch.controls['reportType'].value === 1) {
            this.trialBalanceInfo.debitFrom = this.frmAdvancedSearch.controls["debitFrom"].value;
            this.trialBalanceInfo.debitTo = this.frmAdvancedSearch.controls["debitTo"].value;
            this.trialBalanceInfo.creditFrom = this.frmAdvancedSearch.controls["creditFrom"].value;
            this.trialBalanceInfo.creditTo = this.frmAdvancedSearch.controls["creditTo"].value;
            this.trialBalanceInfo.debitBalanceFrom = this.frmAdvancedSearch.controls["debitBalanceFrom"].value;
            this.trialBalanceInfo.debitBalanceTo = this.frmAdvancedSearch.controls["debitBalanceTo"].value;
            this.trialBalanceInfo.creditBalanceFrom = this.frmAdvancedSearch.controls["creditBalanceFrom"].value;
            this.trialBalanceInfo.creditBalanceTo = this.frmAdvancedSearch.controls["creditBalanceTo"].value;
            this.trialBalanceInfo.page = this.pagination;
            this.trialBalanceInfo.partitionKeyList = this.partitionKeyList;
            this.getTrialBalances(this.trialBalanceInfo);
        }
        else {
            this.trialBalanceDetailInfo.debitFrom = this.frmAdvancedSearch.controls["debitFrom"].value;
            this.trialBalanceDetailInfo.debitTo = this.frmAdvancedSearch.controls["debitTo"].value;
            this.trialBalanceDetailInfo.creditFrom = this.frmAdvancedSearch.controls["creditFrom"].value;
            this.trialBalanceDetailInfo.creditTo = this.frmAdvancedSearch.controls["creditTo"].value;
            this.trialBalanceDetailInfo.page = this.pagination;
            this.trialBalanceDetailInfo.partitionKeyList = this.partitionKeyList;
            this.getTrialBalancesDetails(this.trialBalanceDetailInfo);
        }

        //this.trialBalanceInfo.ownerIdList = this.frmAdvancedSearch.controls["totalTo"].value;


    }




    public resetAdvancedSearch() {
        this.frmAdvancedSearch.controls["reportType"].setValue(1);
        this.frmAdvancedSearch.controls["year"].setValue(0);
        this.frmAdvancedSearch.controls["name"].setValue(null);
        this.frmAdvancedSearch.controls["parentCode"].setValue(null);
        this.frmAdvancedSearch.controls["parentName"].setValue(null);

    }

    handlePageEvent(event: PageEvent) {

        this.pagination.length = event.length;
        this.pagination.pageSize = event.pageSize;
        this.pagination.pageNumber = event.pageIndex + 1;
        this.pagination.flag = false;

        if (this.reportType == 1) {
            this.trialBalanceInfo.page = this.pagination;
            this.getTrialBalances(this.trialBalanceInfo);
        }
        else {
            this.trialBalanceDetailInfo.page = this.pagination;
            this.getTrialBalancesDetails(this.trialBalanceDetailInfo);
        }
    }
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }
    changeReportType(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            if (event.source.value === 2) {
                this.frmAdvancedSearch.controls['debitBalanceFrom'].setValue('');
                this.frmAdvancedSearch.controls['debitBalanceTo'].setValue('');
                this.frmAdvancedSearch.controls['creditBalanceFrom'].setValue('');
                this.frmAdvancedSearch.controls['creditBalanceTo'].setValue('');
                this.frmAdvancedSearch.controls['debitBalanceFrom'].disable();
                this.frmAdvancedSearch.controls['debitBalanceTo'].disable();
                this.frmAdvancedSearch.controls['creditBalanceFrom'].disable();
                this.frmAdvancedSearch.controls['creditBalanceTo'].disable();
            }
            else {
                this.trialBalanceDetailInfo.statusIdList = [];
                this.frmAdvancedSearch.controls['debitBalanceFrom'].enable();
                this.frmAdvancedSearch.controls['debitBalanceTo'].enable();
                this.frmAdvancedSearch.controls['creditBalanceFrom'].enable();
                this.frmAdvancedSearch.controls['creditBalanceTo'].enable();
            }
        }



    }

    openDetailDialog(requestId: number, requestDetailId: number, requestTypeId: number, documentNumber: string) {
        let configForm: FormGroup = this._formBuilder.group({
            requestId: requestId,
            requestDetailId: requestDetailId,
            requestTypeId: requestTypeId,
            title: 'Document Number: ' + documentNumber
        });
        const dialogRef = this._dialogService.open(configForm.value);
        dialogRef.afterClosed().subscribe((result) => {
            /*    if (result !== 'cancelled')
                   this.categoryTreeModification(result, 0, 0, 'new'); */
        });
    }

    protected filterOwnersMulti() {
        if (this.owners.length === 0) {
            return;
        }
        // get the search keyword
        let search = this.ownersMultiFilterCtrl.value;
        if (search && search.length > 2) {
            this.filteredOwnersMulti = [];
            const owners = this.owners.filter(x => x.ownerName.toLocaleLowerCase().includes(search.toLowerCase()));
            owners.forEach(element => {
                const selectedIndx = this.selectedOwners.findIndex(x => x.ownerId === element.ownerId);
                if (selectedIndx === -1)
                    this.filteredOwnersMulti.push(element);
            });

        }
        if (!search && search.length < 2) {
            return this.filteredOwnersMulti = this.owners;
        }
    }

    setPaymentTypeValue(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            if (event.source.selected) {
                this.trialBalanceDetailInfo.paymentTypeIdList.push(event.source.value);

            }
            else if (!event.source.selected) {
                const index: number = this.trialBalanceDetailInfo.paymentTypeIdList.indexOf(event.source.value);
                if (index !== -1)
                    this.trialBalanceDetailInfo.paymentTypeIdList.splice(index, 1);
                this.frmAdvancedSearch.controls["paymentType"].setValue(this.trialBalanceDetailInfo.paymentTypeIdList);
            }
        }


    }
    setFinancialYearValue(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            if (event.source.selected)
                this.partitionKeyList.push(event.source.value);
            else if (!event.source.selected) {
                const index: number = this.partitionKeyList.indexOf(event.source.value);
                if (index !== -1)
                    this.partitionKeyList.splice(index, 1);
                this.frmAdvancedSearch.controls["year"].setValue(this.partitionKeyList);
            }
        }


    }
    modifyOwners(event: {
        isUserInput: any;
        source: { value: any; selected: any, group: any };
    }, action: string) {

        if (event.isUserInput) {
            if (action === 'add') {
                const indx = this.filteredOwnersMulti.findIndex(x => x.ownerId === event.source.value);
                this.selectedOwners.push(this.filteredOwnersMulti[indx]);
                this.trialBalanceInfo.ownerIdList.push(this.filteredOwnersMulti[indx].ownerId);
                this.trialBalanceDetailInfo.ownerIdList.push(this.filteredOwnersMulti[indx].ownerId);
                this.filteredOwnersMulti.splice(indx, 1);
            }
            else {
                const indx = this.selectedOwners.findIndex(x => x.ownerId === event.source.value);
                this.filteredOwnersMulti.push(this.selectedOwners[indx]);
                this.trialBalanceInfo.ownerIdList.splice(indx, 1);
                this.trialBalanceDetailInfo.ownerIdList.splice(indx, 1);
                this.selectedOwners.splice(indx, 1);
            }

        }

    }
    private downloadExcelFile(trialBalance: Observable<TrialBalance[]>, trialBalanceDetail: Observable<TrialBalanceDetail[]>) {
        let columns: Array<ExcelHeader> = new Array<ExcelHeader>();
        let obj: Array<TrialBalance> = new Array<TrialBalance>();
        let detailObj: Array<TrialBalanceDetail> = new Array<TrialBalanceDetail>();
        let credit: number = 0;
        let debit: number = 0;
        let remained: number = 0;
        let creditBalance: number = 0;
        let debitBalance: number = 0;
        let qty: number = 0;
        let date = formatDate(new Date(), 'yyyyMMdd_hhmmss', 'en');
        let fileName: string = 'TrialBalance_'.concat(date.toString());
        if (this.reportType === 1) {
            columns.push({ basedColumnName: 'ownerName', excelColumnName: 'Account' });
            columns.push({ basedColumnName: 'ownerTypeName', excelColumnName: 'Account Type' });
            columns.push({ basedColumnName: 'debit', excelColumnName: 'Debit' });
            columns.push({ basedColumnName: 'credit', excelColumnName: 'Credit' });
            columns.push({ basedColumnName: 'debitBalance', excelColumnName: 'Debit Balance' });
            columns.push({ basedColumnName: 'creditBalance', excelColumnName: 'Credit Balance' });
        }
        else {
            columns.push({ basedColumnName: 'ownerName', excelColumnName: 'Account' });
            columns.push({ basedColumnName: 'ownerTypeName', excelColumnName: 'Account Type' });
            columns.push({ basedColumnName: 'documentNumber', excelColumnName: 'Number' });
            columns.push({ basedColumnName: 'localChangeDate', excelColumnName: 'Date Register' });
            columns.push({ basedColumnName: 'updateLocalDate', excelColumnName: 'Date Update' });
            columns.push({ basedColumnName: 'debit', excelColumnName: 'Debit' });
            columns.push({ basedColumnName: 'credit', excelColumnName: 'Credit' });
            columns.push({ basedColumnName: 'remained', excelColumnName: 'Remained' });
            columns.push({ basedColumnName: 'remainedDesc', excelColumnName: 'Status' });
            columns.push({ basedColumnName: 'paymentTypeName', excelColumnName: 'Payment Type' });
            columns.push({ basedColumnName: 'financialCategoryName', excelColumnName: 'Category' });
            columns.push({ basedColumnName: 'requestTypeName', excelColumnName: 'Applicant' });
            columns.push({ basedColumnName: 'requestStatusDescription', excelColumnName: 'Applicant Status' });
            columns.push({ basedColumnName: 'documentDescription', excelColumnName: 'Description' });
        }

        if (this.reportType === 1)
            trialBalance.subscribe(items => items.forEach(element => {
                qty = qty + 1;
                debit = debit + element.debit;
                credit = credit + element.credit;
                debitBalance = debitBalance + element.debitBalance;
                creditBalance = creditBalance + element.creditBalance;
                obj.push(element);

            }));
        else {
            trialBalanceDetail.subscribe(items => items.forEach(element => {
                qty = qty + 1;
                debit = debit + element.debit;
                credit = credit + element.credit;
                remained = element.remained;
                detailObj.push(element);
            }));
            trialBalanceDetail
                .pipe(
                    map(details => {
                        return details.reduce(
                            (acc, currentDetail) => {
                                if (currentDetail.updOrder > acc.max.updOrder) {
                                    acc.max = currentDetail;
                                }
                                if (currentDetail.updOrder < acc.min.updOrder) {
                                    acc.min = currentDetail;
                                }
                                return acc;
                            },
                            {
                                max: details[0],
                                min: details[0]
                            }
                        );
                    })
                )
                .subscribe(({ max, min }) => {
                    remained = max.remained;
                    if (min.remained < 0)
                        debit = debit + Math.abs(min.remained);
                    else
                        credit = credit + min.remained;
                });
        }

        let footerData = [];
        if (this.reportType === 1) {
            footerData.push(['', '', '', '', 'QTY', qty]);
            footerData.push(['', '', '', '', 'DEBIT', debit.toString().concat(' IRR')]);
            footerData.push(['', '', '', '', 'CREDIT', credit.toString().concat(' IRR')]);
            footerData.push(['', '', '', '', 'DEBIT BALANCE', debitBalance.toString().concat(' IRR')]);
            footerData.push(['', '', '', '', 'CREDIT BALANCE', creditBalance.toString().concat(' IRR')]);
        }
        else {
            if (this.trialBalanceDetailInfo.ownerIdList.length !== 1) {
                footerData.push(['', '', '', '', '', '', '', '', '', '', '', '', 'QTY', qty]);
                footerData.push(['', '', '', '', '', '', '', '', '', '', '', '', 'DEBIT', debit.toString().concat(' IRR')]);
                footerData.push(['', '', '', '', '', '', '', '', '', '', '', '', 'CREDIT', credit.toString().concat(' IRR')]);
            }
            else {
                footerData.push(['', '', '', '', '', '', '', '', '', '', '', '', 'QTY', qty]);
                footerData.push(['', '', '', '', '', '', '', '', '', '', '', '', 'DEBIT', debit.toString().concat(' IRR')]);
                footerData.push(['', '', '', '', '', '', '', '', '', '', '', '', 'CREDIT', credit.toString().concat(' IRR')]);
                footerData.push(['', '', '', '', '', '', '', '', '', '', '', '', 'REMAINED', remained.toString().concat(' IRR')]);
            }

        }


        if (this.reportType === 1)
            this.excelService.exportAsExcelFile('Trial Balance', '', columns, obj, footerData, fileName, 'Sheet1');
        else
            this.excelService.exportAsExcelFile('Trial Balance', '', columns, detailObj, footerData, fileName, 'Sheet1');

        obj = [];
        detailObj = [];
    }
    async exportTable() {
        if (this.reportType == 1) {
            this.isLoading = true;
            const data = await this.service.getTrialBalancesForDownloadingFile(this.trialBalanceInfo);
            this.isLoading = false;
            this.downloadExcelFile(of(data), null);
            this._changeDetectorRef.markForCheck();
            this.cdr.detectChanges();
        }
        else if (this.reportType == 2) {
            this.isLoading = true;
            const data = await this.service.getTrialBalanceDetailsForDownloadingFile(this.trialBalanceDetailInfo);
            this.isLoading = false;
            this.downloadExcelFile(null, of(data));
            this._changeDetectorRef.markForCheck();
            this.cdr.detectChanges();
        }

    }

    private downloadPdfFile(trialBalance: Observable<TrialBalance[]>, trialBalanceDetail: Observable<TrialBalanceDetail[]>) {
        var pdf = new jsPDF('l');
        pdf.setFontSize(20);
        if (this.trialBalanceDetailInfo.ownerIdList.length !== 1)
            pdf.text('Trial Balance', 14, 8);
        else {
            const indx = this.owners.findIndex(x => x.ownerId == this.trialBalanceDetailInfo.ownerIdList[0]);
            let obj = this.owners[indx];
            pdf.text('Trial Balance-'.concat(obj?.ownerName).concat('-').concat(obj.ownerTypeName), 14, 8);
        }

        pdf.setFontSize(12);
        pdf.setTextColor(99);
        let header = [];
        let tableData = [];
        let footer = [];
        let remained: number = 0;
        let credit: number = 0;
        let debit: number = 0;
        let creditBalance: number = 0;
        let debitBalance: number = 0;
        let qty: number = 0;
        let date = formatDate(new Date(), 'yyyyMMdd_hhmmss', 'en');
        let fileName: string = 'TrialBalance_'.concat(date.concat('.pdf'));
        if (this.reportType === 1)
            header = [{ header: 'Account', dataKey: 'ownerName' },
            { header: 'Account Type', dataKey: 'ownerTypeName' },
            { header: 'Debit', dataKey: 'debit' },
            { header: 'Credit', dataKey: 'credit' },
            { header: 'Debit Balance', dataKey: 'debitBalance' },
            { header: 'Credit Balance', dataKey: 'creditBalance' }];
        else
            if (this.trialBalanceDetailInfo.ownerIdList.length !== 1)
                header = [{ header: 'Account', dataKey: 'ownerName' },
                { header: 'Account Type', dataKey: 'ownerTypeName' },
                { header: 'Number', dataKey: 'documentNumber' },
                { header: 'Date', dataKey: 'localChangeDate' },
                { header: 'Debit', dataKey: 'debit' },
                { header: 'Credit', dataKey: 'credit' },
                { header: 'Remained', dataKey: 'remained' },
                { header: 'Category', dataKey: 'financialCategoryName' },
                { header: 'Applicant', dataKey: 'requestTypeName' },
                { header: 'Description', dataKey: 'documentDescription' }]
            else
                header = [{ header: 'Number', dataKey: 'documentNumber' },
                { header: 'Date', dataKey: 'localChangeDate' },
                { header: 'Debit', dataKey: 'debit' },
                { header: 'Credit', dataKey: 'credit' },
                { header: 'Remained', dataKey: 'remained' },
                { header: 'Status', dataKey: 'remainedDesc' },
                { header: 'Payment', dataKey: 'paymentTypeName' },
                { header: 'Category', dataKey: 'financialCategoryName' },
                { header: 'Applicant', dataKey: 'requestTypeName' },
                { header: 'Description', dataKey: 'documentDescription' }];

        if (this.reportType === 1)
            trialBalance.subscribe(items => items.forEach(element => {
                qty = qty + 1;
                debit = debit + element.debit;
                credit = credit + element.credit;
                debitBalance = debitBalance + element.debitBalance;
                creditBalance = creditBalance + element.creditBalance;
                tableData.push([
                    element.ownerName, element.ownerTypeName, this.transformDecimal(element.debit),
                    this.transformDecimal(element.credit), this.transformDecimal(element.debitBalance),
                    this.transformDecimal(element.creditBalance)
                ]);
            }));

        else {
            trialBalanceDetail.subscribe(items => items.forEach(element => {
                qty = qty + 1;
                debit = debit + element.debit;
                credit = credit + element.credit;
                remained = element.remained;
                if (this.trialBalanceDetailInfo.ownerIdList.length !== 1)
                    tableData.push([
                        element.ownerName, element.ownerTypeName, element.documentNumber, element.localChangeDate,
                        this.transformDecimal(element.debit),
                        this.transformDecimal(element.credit), this.transformDecimal(element.remained),
                        element.financialCategoryName, element.requestTypeName,
                        element.documentDescription
                    ]);
                else
                    tableData.push([
                        element.documentNumber, element.localChangeDate,
                        this.transformDecimal(element.debit),
                        this.transformDecimal(element.credit), this.transformDecimal(element.remained),
                        element.remainedDesc, element.paymentTypeName,
                        element.financialCategoryName, element.requestTypeName,
                        element.documentDescription
                    ]);
            }));
            trialBalanceDetail
                .pipe(
                    map(details => {
                        return details.reduce(
                            (acc, currentDetail) => {
                                if (currentDetail.updOrder > acc.max.updOrder) {
                                    acc.max = currentDetail;
                                }
                                if (currentDetail.updOrder < acc.min.updOrder) {
                                    acc.min = currentDetail;
                                }
                                return acc;
                            },
                            {
                                max: details[0],
                                min: details[0]
                            }
                        );
                    })
                )
                .subscribe(({ max, min }) => {
                    remained = max.remained;
                    if (min.remained < 0)
                        debit = debit + Math.abs(min.remained);
                    else
                        credit = credit + min.remained;
                });
        }


        if (this.reportType === 1)
            footer = [['DEBIT', '', '', '', '', this.transformDecimal(debit).toString().concat(' IRR')],
            ['CREDIT', '', '', '', '', this.transformDecimal(credit).toString().concat(' IRR')],
            ['DEBIT BALANCE', '', '', '', '', this.transformDecimal(debitBalance).toString().concat(' IRR')],
            ['CREDIT BALANCE', '', '', '', '', this.transformDecimal(creditBalance).toString().concat(' IRR')]];
        else {
            if (this.trialBalanceDetailInfo.ownerIdList.length !== 1)
                footer = [['ROWS', '', '', '', '', '', '', '', '', qty],
                ['DEBIT', '', '', '', '', '', '', '', '', this.transformDecimal(debit).toString().concat(' IRR')],
                ['CREDIT', '', '', '', '', '', '', '', '', this.transformDecimal(credit).toString().concat(' IRR')]];
            // ['REMAINED', '', '', '', '', '', '', '', '', this.transformDecimal(credit - debit).toString().concat(' IRR')];
            else
                footer = [['ROWS', '', '', '', '', '', '', '', '', qty],
                ['DEBIT', '', '', '', '', '', '', '', '', this.transformDecimal(debit).toString().concat(' IRR')],
                ['CREDIT', '', '', '', '', '', '', '', '', this.transformDecimal(credit).toString().concat(' IRR')],
                ['REMAINED', '', '', '', '', '', '', '', '', this.transformDecimal(remained).toString().concat(' IRR')]];

        }

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
    async download() {
        if (this.reportType == 1) {
            this.isLoading = true;
            const data = await this.service.getTrialBalancesForDownloadingFile(this.trialBalanceInfo);
            this.isLoading = false;
            this.downloadPdfFile(of(data), null);
            this._changeDetectorRef.markForCheck();
            this.cdr.detectChanges();
        }
        else if (this.reportType == 2) {
            this.isLoading = true;
            const data = await this.service.getTrialBalanceDetailsForDownloadingFile(this.trialBalanceDetailInfo);
            this.isLoading = false;
            this.downloadPdfFile(null, of(data));
            this._changeDetectorRef.markForCheck();
            this.cdr.detectChanges();
        }
    }

    transformDecimal(num) {
        return num === 0 ? 0 : this._decimalPipe.transform(num, '1.0-5');
    }
}


