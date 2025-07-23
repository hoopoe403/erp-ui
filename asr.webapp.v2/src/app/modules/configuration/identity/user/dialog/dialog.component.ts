import { ChangeDetectorRef, Component, ElementRef, Inject, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ColumnDialogConfig } from './dialog.types';
import { UserService } from '../user.service';
import { Column, UserColumn } from 'app/core/type/column/user-column.type';
import { FuseAlertService } from '@fuse/components/alert';
import { OpResult } from 'app/core/type/result/result.types';
import { forkJoin, fromEvent, Observable, Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormBuilder, FormControl } from '@angular/forms';
import { KeyValue } from 'app/core/type/key-value/key-value.type';

@Component({
    selector: 'fuse-confirmation-dialog',
    templateUrl: './dialog.component.html',
    encapsulation: ViewEncapsulation.None,
    styles: [
        /* language=SCSS */
        `
            .columns-grid {
                grid-template-columns:50px auto 50px 50px 200px  200px ;

                @screen sm {
                    grid-template-columns:auto 100px  100px 70px;
                }

                @screen md {
                    grid-template-columns: auto 100px  100px 70px;
                }

                @screen lg {
                    grid-template-columns:50px auto 50px 50px 200px  200px ;
                }
                @screen print{
                    grid-template-columns: 100px auto 50px 50px 200px 200px;
                }
            }
        `
    ]
})
export class ColumnDialogComponent implements OnInit {
    /**
     * Constructor
     */

    private _unsubscribeAll: Subject<any> = new Subject<any>();
    @ViewChild('filter', { static: true }) filter: ElementRef;
    columns: Array<Column>;
    columns$: Array<Column>;
    isDataLoading: boolean;
    _result: OpResult = new OpResult();
    confirmResult: boolean = false;
    searchInputControl: FormControl = new FormControl();
    private obj: UserColumn = new UserColumn();
    constructor(private service: UserService,
        private _fuseAlertService: FuseAlertService,
        private cdr: ChangeDetectorRef,
        private _formBuilder: FormBuilder,
        @Inject(MAT_DIALOG_DATA) public data: ColumnDialogConfig,
        public matDialogRef: MatDialogRef<ColumnDialogComponent>
    ) {
        this.columns = [];
        this.columns$ = [];
        this.obj.viewId = data.viewId;
        this.obj.columnIdList = data.columnIdList;
        //this.obj.userId = data.userId;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        this.loadData();
        fromEvent(this.filter.nativeElement, 'keyup')
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(150),
                distinctUntilChanged()
            )
            .subscribe(() => {

                if (!this.columns)
                    return;
                let value: string = this.filter.nativeElement.value.toLowerCase();
                this.columns$ = this.columns.filter(x => x.applicationName.includes(value) ||
                    x.excelHeader?.toLowerCase().includes(value) ||
                    x.pdfHeader?.toLowerCase().includes(value)
                )
            })

    }
    private checkUserColumnAccess() {
        this.columns.forEach(element => {
            const indx = this.obj.columnIdList.findIndex(x => x == element.columnId);
            if (indx != -1)
                element.checked = true;
            else
                element.checked = false;
        });
    }
    private setForkJoinValues(values: Array<any>): void {
        this.columns = this.columns$ = values[0].data;
        this.checkUserColumnAccess();
    }
    private loadData() {
        this.isDataLoading = true;
        this.cdr.detectChanges();
        forkJoin(
            this.getColumns(),
        ).subscribe(res => {
            this.setForkJoinValues(res);
            this.isDataLoading = false;
            this.cdr.detectChanges();
        });
    }

    private getColumns(): Observable<any> {

        return this.service.getViewColumns(this.obj);
    }

    toggleAllColumns(): void {
        let value: boolean;
        if (this.columns.filter(x => x.checked == true).length < this.columns.length)
            value = true;
        else
            value = false;
        for (let index = 0; index < this.columns.length; index++)
            this.columns[index].checked = value;

    }
    checkAllColumnsAreSelected(): boolean {
        return this.columns.filter(x => x.checked == true || x.changeable == 0).length == this.columns.length;
    }
    checkAllColumnsIndeterminate(): boolean {
        const listLength = this.columns.filter(x => x.checked == true || x.changeable == 0).length
        return listLength > 0 && listLength < this.columns.length;
    }
    toggleColumn(columnId: number): void {
        const indx = this.columns.findIndex(x => x.columnId == columnId);
        this.columns[indx].checked = !this.columns[indx].checked;
    }

    confirm() {
        let userColumn: Array<KeyValue> = new Array<KeyValue>();
        this.columns.filter(x => x.checked).forEach(element => {
            userColumn.push({ key: element.columnId, value: element.applicationName });
        });
        this.matDialogRef.close(userColumn);
    }



    closeDialog() {

        this.matDialogRef.close(true);
    }
    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

}
