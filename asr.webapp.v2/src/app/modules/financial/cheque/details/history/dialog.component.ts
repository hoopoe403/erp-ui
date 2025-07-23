import { ChangeDetectorRef, Component, ElementRef, Inject, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ChequeTransactionDialogConfig } from '../dialog.types';
import { ChequeService } from '../../cheque.service';
import { ChequeTransaction } from '../../cheque.types';
import { FuseAlertService } from '@fuse/components/alert';
import { OpResult } from 'app/core/type/result/result.types';
import { forkJoin, fromEvent, merge, Observable, of, Subject, Subscription } from 'rxjs';
import { filter, map, switchMap, takeUntil, debounceTime, distinctUntilChanged, take } from 'rxjs/operators';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ChequeInfoDialogService } from '../dialog.service';

@Component({
    selector: 'fuse-confirmation-dialog',
    templateUrl: './dialog.component.html',
    encapsulation: ViewEncapsulation.None,
    styles: [
        /* language=SCSS */
        `
            .chequeTransaction-grid {
                grid-template-columns:auto 100px  100px 70px;

                @screen sm {
                    grid-template-columns:auto 100px  100px 70px;
                }

                @screen md {
                    grid-template-columns: auto 100px  100px 70px;
                }

                @screen lg {
                    grid-template-columns: 180px auto 120px  250px 120px 80px;
                }
                @screen print{
                    grid-template-columns: 100px 370px 370px 70px;
                }
            }
        `
    ]
})
export class ChequeTransactionDialogComponent implements OnInit {
    /**
     * Constructor
     */

    private _unsubscribeAll: Subject<any> = new Subject<any>();
    @ViewChild('filter', { static: true }) filter: ElementRef;
    chequeTransactions: Array<ChequeTransaction>;
    chequeTransactions$: Array<ChequeTransaction>;
    chequeId: number = 0;
    isDataLoading: boolean;
    _result: OpResult = new OpResult();
    confirmResult: boolean = false;
    searchInputControl: FormControl = new FormControl();
    constructor(private service: ChequeService,
        private _fuseAlertService: FuseAlertService,
        private cdr: ChangeDetectorRef,
        private _formBuilder: FormBuilder, private _ChequeInfoDialogService: ChequeInfoDialogService,
        @Inject(MAT_DIALOG_DATA) public data: ChequeTransactionDialogConfig,
        public matDialogRef: MatDialogRef<ChequeTransactionDialogComponent>
    ) {
        this.chequeTransactions = [];
        this.chequeTransactions$ = [];
        this.chequeId = data.chequeId;
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

                if (!this.chequeTransactions)
                    return;
                let query: string = this.filter.nativeElement.value.toLowerCase();
                this.chequeTransactions$ = this.chequeTransactions.filter(x => x.localChangeDate.includes(query) ||
                    x.localChangeTime.includes(query) ||
                    x.payerName.toLowerCase().includes(query) ||
                    x.payerTypeName.toLowerCase().includes(query) ||
                    x.recipientName.toLowerCase().includes(query) ||
                    x.recipientTypeName.toLowerCase().includes(query) ||
                    x.statusDescription.toLowerCase().includes(query)
                )

            })

    }

    private setForkJoinValues(values: Array<any>): void {

        this.chequeTransactions = values[0].data;
        this.chequeTransactions$ = values[0].data;
    }
    private loadData() {
        this.isDataLoading = true;

        forkJoin(
            this.getChequeTransaction(this.chequeId),
        ).subscribe(res => {
            this.setForkJoinValues(res);
            this.isDataLoading = false;
            this.cdr.detectChanges();
        });
    }

    private getChequeTransaction(chequeId: number): Observable<any> {
        let obj: ChequeTransaction = new ChequeTransaction();
        obj.chequeId = chequeId;
        return this.service.getChequeTransaction(obj);
    }




    private showAlert(name: string): void {
        this._fuseAlertService.show(name);
    }


    private dismissAlert(name: string): void {
        this._fuseAlertService.dismiss(name);
    }
    closeDialog() {
        this.matDialogRef.close(this.confirmResult);
    }
    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------
    openChequeInfoDialog() {
        let title: string;
        title = 'Cheque Information';
        let configForm: FormGroup = this._formBuilder.group({
            chequeId: this.chequeId,
            title: title,
            dismissible: this._formBuilder.group({
                show: true,
                disabled: false
            })
        });
        const dialogRef = this._ChequeInfoDialogService.open(configForm.value);
        dialogRef.afterClosed().subscribe((result) => {


        });
    }
}
