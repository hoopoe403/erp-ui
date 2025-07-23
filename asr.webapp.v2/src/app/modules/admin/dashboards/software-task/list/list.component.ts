import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Subject, merge, Observable, forkJoin, fromEvent, of, async, } from 'rxjs';
import { debounceTime, switchMap, map, distinctUntilChanged } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';
import { fuseAnimations } from "../../../../../../@fuse/animations";
import { SoftwareTaskService } from "../software-task.service";
import { SoftwareTask } from "../software-task.types";
import { Paging } from 'app/core/type/paging/paging.type';
import { FormControl, FormGroup } from '@angular/forms';
import jsPDF from 'jspdf';
import { DecimalPipe, formatDate } from '@angular/common';
import { ExcelHeader } from 'app/shared/excel/excel.types';
import { ExcelService } from 'app/shared/excel/excel.service';
import { KeyValue } from 'app/core/type/key-value/key-value.type';

@Component({
    selector: 'software-task-list',
    templateUrl: './list.component.html',
    styles: [
        /* language=SCSS */
        `
            .tasks-grid {
                grid-template-columns:auto 100px 100px 100px 150px;

                @screen sm {
                    grid-template-columns:auto 100px 100px 100px 150px;
                }

                @screen md {
                    grid-template-columns:auto 100px 100px 100px 150px;
                }

                @screen lg {
                    grid-template-columns:auto 100px  150px 130px  100px ;
                }
                @screen print{
                    grid-template-columns:auto 100px  150px 130px  150px;
                }
            }
     
        `
    ],
    animations: fuseAnimations,
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SoftwareTaskListComponent implements OnInit, OnDestroy {
    protected _onDestroy = new Subject<void>();
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;
    allMenusSelected = false;
    allSubsystemSelected = false;
    subsystems: any = [];
    menus: any = [];
    statuses = [];
    defaultStatuses = [];
    priorities: Array<KeyValue>;
    showTasksProgressBar: boolean;
    pagination: Paging;
    taskInfo: SoftwareTask;
    frmAdvancedSearch = new FormGroup({
        title: new FormControl(),
        status: new FormControl(),
        priority: new FormControl(),
        costFrom: new FormControl(),
        costTo: new FormControl()
    });


    searchInputControl: FormControl = new FormControl();

    @ViewChild('filter', { static: true }) filter: ElementRef;

    // Private
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    isLoading: boolean;

    constructor(private service: SoftwareTaskService,
        private excelService: ExcelService,
        private cdr: ChangeDetectorRef,
        private _decimalPipe: DecimalPipe,
        private _changeDetectorRef: ChangeDetectorRef) {
        //this._unsubscribeAll = new Subject();
        this.taskInfo = new SoftwareTask();
        this.taskInfo.menuIdList = [];
        this.taskInfo.subSystemIdList = [];
        this.taskInfo.priorityIdList = [];
        this.priorities = new Array<KeyValue>();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------
    isOverlayOpen: boolean = true;
    selectedInfoRow: SoftwareTask = new SoftwareTask();

    /**
     * On init
     */




    softwareTasks$: Observable<SoftwareTask[]>;
    ngOnInit(): void {
        this.isLoading = true;
        this.priorities.push({ key: 0, value: 'Low' });
        this.priorities.push({ key: 1, value: 'Normal' });
        this.priorities.push({ key: 2, value: 'High' });
        this.service.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: Paging) => {

                // Update the pagination
                this.pagination = pagination;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        this.initialPagination();
        fromEvent(this.filter.nativeElement, 'keyup')
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(150),
                distinctUntilChanged()
            )
            .subscribe(() => {

                if (!this.softwareTasks$)
                    return;

                this.service.softwareTasks$.pipe(map(items => items.filter(x =>
                    x.priority.toString().includes(this.filter.nativeElement.value) ||
                    x.title.toLowerCase().includes(this.filter.nativeElement.value) ||
                    x.cost.toString().includes(this.filter.nativeElement.value) ||
                    x.statusDescription.includes(this.filter.nativeElement.value)))).subscribe(elements => {
                        this.softwareTasks$ = of(elements as SoftwareTask[]);
                        this._changeDetectorRef.markForCheck();
                        this._changeDetectorRef.detectChanges();
                    });

            });

        this.loadData();



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
                    this.pagination.length = this._paginator.length;
                    this.pagination.pageSize = this._paginator.pageSize;
                    this.pagination.pageNumber = this._paginator.pageIndex + 1;
                    this.pagination.flag = false;
                    this.pagination.order = this._sort.direction == null ? 'desc' : this._sort.direction;
                    this.pagination.sort = this._sort.active == null ? '' : this._sort.active;
                    this.taskInfo.page = this.pagination;
                    return this.service.getSoftwareTasks(this.taskInfo);
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
        this.service.disposeSoftwareTasks$();
        this.service.disponsePaginator$();

    }
    private setForkJoinValues(values: Array<any>): void {
        this.statuses = values[0].data;
        this.menus = values[1].data;
        this.subsystems = values[2].data;
        this.defaultStatuses = [];
        this.statuses.forEach(element => {
            if (element.isDefault === 1)
                this.defaultStatuses.push(element.statusId);
        });
        this.frmAdvancedSearch.controls["status"].setValue(this.defaultStatuses);
        this.taskInfo.statusIdList = this.defaultStatuses;
        this._changeDetectorRef.markForCheck();
        this.cdr.detectChanges();
        this.softwareTasks$ = this.service.softwareTasks$;
        this._changeDetectorRef.markForCheck();
        this.cdr.detectChanges();
        this.setPaginatorAndSort();

    }
    private loadData(): void {
        forkJoin(
            this.getStatuses(),
            this.getDrpMenus(),
            this.getDrpSubsystems(),
            this.getSoftwareTasksOnInit(),

        ).subscribe(res => {
            this.setForkJoinValues(res);
            this.isLoading = false;
            this.cdr.detectChanges();
        });
    }

    private getStatuses(): Observable<any> {
        return this.service.getStatuses();
    }
    private getDrpSubsystems(): Observable<any> {
        return this.service.getSubsystems();
    }

    private getDrpMenus(): Observable<any> {
        return this.service.getFinalMenus();
    }




    setStatusValue(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {
        if (event.isUserInput)
            if (event.source.selected) {
                this.taskInfo.statusIdList.push(event.source.value);
            }
            else {
                const indx = this.taskInfo.statusIdList.findIndex(x => x == event.source.value);
                this.taskInfo.statusIdList.splice(indx, 1);
            }

    }


    setPriorityValue(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {
        if (event.isUserInput)
            if (event.source.selected) {
                this.taskInfo.priorityIdList.push(event.source.value);
            }
            else {
                const indx = this.taskInfo.priorityIdList.findIndex(x => x == event.source.value);
                this.taskInfo.priorityIdList.splice(indx, 1);
            }

    }

    private getSoftwareTasks(taskInfo: SoftwareTask) {
        this.isLoading = true;
        this.service.getSoftwareTasks(taskInfo)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((sofwtareTasks: any) => {
                this.softwareTasks$ = this.service.softwareTasks$;
                this.isLoading = false;
                this._changeDetectorRef.markForCheck();
                this.cdr.detectChanges();
            });
    }

    private getSoftwareTasksOnInit(): Observable<any> {
        this.pagination = new Paging();
        this.pagination.flag = true;
        this.pagination.length = 0;
        this.pagination.order = 'desc';
        this.pagination.pageNumber = 1;
        this.pagination.pageSize = 100;
        this.pagination.sort = '';
        this.taskInfo.page = this.pagination;
        return this.service.getSoftwareTasksOnInit(this.taskInfo);
    }
    public search() {

        this.pagination.flag = true;
        this.pagination.pageNumber = 1;
        this.pagination.length = 0;
        this.taskInfo.title = this.frmAdvancedSearch.controls["title"].value;
        this.taskInfo.costFrom = this.frmAdvancedSearch.controls["costFrom"].value;
        this.taskInfo.costTo = this.frmAdvancedSearch.controls["costTo"].value;
        this.taskInfo.page = this.pagination;
        this.getSoftwareTasks(this.taskInfo);


    }





    download() {
        var pdf = new jsPDF('l');
        pdf.setFontSize(20);
        pdf.text('Task', 14, 8);
        pdf.setFontSize(12);
        pdf.setTextColor(99);
        let header = [];
        let tableData = [];
        let footer = [];
        let qty: number = 0;
        let totalprice: number = 0;
        let date = formatDate(new Date(), 'yyyyMMdd_hhmmss', 'en');
        let fileName: string = 'softwareTasks_'.concat(date.concat('.pdf'));


        header = [{ header: 'Title', dataKey: 'title' },
        { header: 'Priority', dataKey: 'priority' },
        { header: 'Cost', dataKey: 'cost' },
        { header: 'Status', dataKey: 'statusDescription' },];


        this.softwareTasks$.subscribe(items => items.forEach(element => {
            qty = qty + 1;
            totalprice = totalprice + element.cost
            tableData.push([
                element.title, element.priority, this.transformDecimal(element.cost), element.statusDescription,

            ])
        }))


        footer = [['QTY', '', '', qty],
        ['Total Price', '', '', this.transformDecimal(totalprice).toString().concat(' IRR')]];


        (pdf as any).autoTable({
            columns: header,
            columnStyles: { name: { cellWidth: 50 } },
            body: tableData,
            foot: footer,
            footStyles: { fillColor: [223, 223, 223], textColor: [0, 0, 0] },
            theme: 'grid',
            showFoot: 'lastPage'
        });
        /*  Open PDF document in browser's new tab */
        pdf.output('dataurlnewwindow')

        /*  Download PDF doc   */
        pdf.save(fileName);
    }

    exportTable() {
        let columns: Array<ExcelHeader> = new Array<ExcelHeader>();
        let obj: Array<SoftwareTask> = new Array<SoftwareTask>();
        let qty: number = 0;
        let date = formatDate(new Date(), 'yyyyMMdd_hhmmss', 'en');
        let fileName: string = 'softwareTasks_'.concat(date.toString());
        let totalprice: number = 0;
        columns.push({ basedColumnName: 'title', excelColumnName: 'Title' });
        columns.push({ basedColumnName: 'priority', excelColumnName: 'Priority' });
        columns.push({ basedColumnName: 'cost', excelColumnName: 'Cost' });
        columns.push({ basedColumnName: 'statusDescription', excelColumnName: 'Status' });


        this.softwareTasks$.subscribe(items => items.forEach(element => {
            qty = qty + 1;
            totalprice = totalprice + element.cost;
            obj.push(element)
        }));



        let footerData = [];
        footerData.push(['', '', 'QTY', qty]);
        footerData.push(['', '', 'TOTAL COST', totalprice]);
        this.excelService.exportAsExcelFile('Sofwtare Tasks', '', columns, obj, footerData, fileName, 'Sheet1');



        obj = [];
    }




    public resetAdvancedSearch() {
        this.frmAdvancedSearch.controls["status"].setValue(this.defaultStatuses);
        this.taskInfo.statusIdList = this.defaultStatuses;
        this.frmAdvancedSearch.controls["title"].setValue(null);
        this.frmAdvancedSearch.controls["priority"].setValue([]);
        this.taskInfo.priorityIdList = [];
        this.frmAdvancedSearch.controls["costFrom"].setValue(null);
        this.frmAdvancedSearch.controls["costTo"].setValue(null);
    }

    trackByFn(index: number, item: any): any {
        return item.id || index;
    }



    transformDecimal(num) {
        return num == 0 ? 0 : this._decimalPipe.transform(num, '1.0-5');
    }



}




