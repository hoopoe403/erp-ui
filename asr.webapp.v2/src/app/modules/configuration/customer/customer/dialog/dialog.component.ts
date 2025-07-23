import { ChangeDetectorRef, Component, ElementRef, Inject, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BudgetDetailDialogConfig } from './dialog.types';
import { CustomerService } from '../customer.service';
import { BudgetDetail } from '../customer.types';
import { FuseAlertService } from '@fuse/components/alert';
import { OpResult } from 'app/core/type/result/result.types';
import { forkJoin, fromEvent, merge, Observable, of, Subject, Subscription } from 'rxjs';
import { filter, map, switchMap, takeUntil, debounceTime, distinctUntilChanged, take } from 'rxjs/operators';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';

@Component({
    selector: 'fuse-confirmation-dialog',
    templateUrl: './dialog.component.html',
    encapsulation: ViewEncapsulation.None,
    styles: [
        /* language=SCSS */
        `
            .budgetDetails-grid {
                grid-template-columns:auto 100px  100px 70px;

                @screen sm {
                    grid-template-columns:auto 100px  100px 70px;
                }

                @screen md {
                    grid-template-columns: auto 100px  100px 70px;
                }

                @screen lg {
                    grid-template-columns: auto 150px 120px  100px 120px  100px  150px 90px 30px ;
                }
                @screen print{
                    grid-template-columns: 100px 370px 370px 70px;
                }
            }
        `
    ]
})
export class BudgetDetailDialogComponent implements OnInit {
    /**
     * Constructor
     */

    private _unsubscribeAll: Subject<any> = new Subject<any>();
    @ViewChild('filter', { static: true }) filter: ElementRef;
    budgetDetails: Array<BudgetDetail>;
    budgetDetails$: Array<BudgetDetail>;
    budgetId: number = 0;
    isDataLoading: boolean;
    _result: OpResult = new OpResult();
    confirmResult: boolean = false;
    searchInputControl: FormControl = new FormControl();
    constructor(private service: CustomerService,
        private _fuseAlertService: FuseAlertService,
        private cdr: ChangeDetectorRef,
        private _formBuilder: FormBuilder,
        @Inject(MAT_DIALOG_DATA) public data: BudgetDetailDialogConfig,
        public matDialogRef: MatDialogRef<BudgetDetailDialogComponent>
    ) {
        this.budgetDetails = [];
        this.budgetDetails$ = [];
        this.budgetId = data.budgetId;
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

                if (!this.budgetDetails)
                    return;

                this.budgetDetails$ = this.budgetDetails.filter(x => x.localChangeDate.includes(this.filter.nativeElement.value) ||
                    x.localChangeTime.includes(this.filter.nativeElement.value) ||
                    x.amount.toString().includes(this.filter.nativeElement.value)
                    || x.balance.toString().includes(this.filter.nativeElement.value) ||
                    x.Credit.toString().includes(this.filter.nativeElement.value) ||
                    x.requestTypeName.includes(this.filter.nativeElement.value) ||
                    x.statusDescription.includes(this.filter.nativeElement.value)
                )

            })

    }

    private setForkJoinValues(values: Array<any>): void {

        this.budgetDetails = values[0].data;
        this.budgetDetails$ = values[0].data;
    }
    private loadData() {
        this.isDataLoading = true;

        forkJoin(
            this.getBudgetDetail(this.budgetId),
        ).subscribe(res => {
            this.setForkJoinValues(res);
            this.isDataLoading = false;
            this.cdr.detectChanges();
        });
    }

    private getBudgetDetail(budgetId: number): Observable<any> {
        return this.service.getBudgetDetail(budgetId);
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

}
