import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { Subject, Observable, forkJoin, fromEvent } from 'rxjs';
import { fuseAnimations } from "../../../../../../@fuse/animations";
import { CustomerTypeService } from "../customer-type.service";
import { CustomerType } from "../customer-type.types";
import { Paging } from 'app/core/type/paging/paging.type';
import { FormControl, FormGroup } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
import { debounceTime, distinctUntilChanged, map, takeUntil } from 'rxjs/operators';

@Component({
    selector: 'customerTypes-list',
    templateUrl: './list.component.html',
    styles: [
        /* language=SCSS */
        `
            .customerTypes-grid {
                grid-template-columns:100px auto 40px;

                @screen sm {
                    grid-template-columns:100px auto 100px 70px;
                }

                @screen md {
                    grid-template-columns: 100px auto 150px 370px 150px 70px;
                }

                @screen lg {
                    grid-template-columns: 280px auto  280px 280px 70px;
                }
                @screen print{
                    grid-template-columns: 100px 370px 370px 70px;
                }
            }
        `
    ],
    animations: fuseAnimations,
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerTypeListComponent implements OnInit, OnDestroy {
    protected _onDestroy = new Subject<void>();
    pagination: Paging;
    selection = new SelectionModel<any>(true, []);
    customerTypeInfo: CustomerType;
    statuses = [];
    menuArray = [];
    selectedCat: number = 0;
    defaultStatuses = [];
    frmAdvancedSearch = new FormGroup({
        status: new FormControl(),
        code: new FormControl(),
        name: new FormControl(),
    });



    searchInputControl: FormControl = new FormControl();

    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
    @ViewChild('filter', { static: true }) filter: ElementRef;
    // Private
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    isLoading: boolean;


    constructor(private service: CustomerTypeService,
        private cdr: ChangeDetectorRef,
        private _changeDetectorRef: ChangeDetectorRef) {
        this.customerTypeInfo = new CustomerType();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------
    isOverlayOpen: boolean = true;
    selectedInfoRow: CustomerType = new CustomerType();

    customerTypes: Array<CustomerType> = [];
    get customerTypes$(): Observable<CustomerType[]> {
        return this.service.customerTypes$;
    }
    /**
     * On init
     */
    ngOnInit(): void {
        this.isLoading = true;

        fromEvent(this.filter.nativeElement, 'keyup')
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(150),
                distinctUntilChanged()
            )
            .subscribe(() => {
                if (!this.customerTypes)
                    return;


                this.customerTypes$.pipe(map(items => items.filter(x =>
                    x.customerTypeCode.toString().includes(this.filter.nativeElement.value) ||
                    x.customerTypeName.toString().toLowerCase().includes(this.filter.nativeElement.value) ||
                    x.status.toString().includes(this.filter.nativeElement.value)))).subscribe(elements => {
                        this.customerTypes = elements as CustomerType[];
                        this._changeDetectorRef.markForCheck();
                        this.cdr.detectChanges();
                    });
            });
        this.loadData();
    }


    /**
     * On destroy
     */
    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
        this.service.disposeCustomerTypes$();

    }
    private setForkJoinValues(values: Array<any>): void {
        this.customerTypes = values[0].data;
        this._changeDetectorRef.markForCheck();
        this.cdr.detectChanges();
    }
    private loadData(): void {
        forkJoin(
            this.getCustomerTypesOnInit(),
        ).subscribe(res => {
            this.setForkJoinValues(res);
            this.isLoading = false;
            this.cdr.detectChanges();
        });
    }


    private getCustomerTypesOnInit(): Observable<any> {
        return this.service.getCustomerTypeInOnInit(this.customerTypeInfo);
    }

    private getCustomerTypes(customerTypeInfo: CustomerType) {
        this.isLoading = true;
        this.service
            .getCustomerTypes(customerTypeInfo)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((customerTypes: any) => {
                this.customerTypes = customerTypes.data;
                this.isLoading = false;
                this._changeDetectorRef.markForCheck();
                this.cdr.detectChanges();
            });
    }

    customerTypeSearch() {
        this.customerTypeInfo.customerTypeCode =
            this.frmAdvancedSearch.controls["code"].value;
        this.customerTypeInfo.customerTypeName =
            this.frmAdvancedSearch.controls["name"].value;
        this.customerTypeInfo.status =
            this.frmAdvancedSearch.controls["status"].value;
        this.getCustomerTypes(this.customerTypeInfo);
    }
    resetAdvancedSearch() {
        this.frmAdvancedSearch.controls["code"].setValue(null);
        this.frmAdvancedSearch.controls["name"].setValue(null);
        this.frmAdvancedSearch.controls["status"].setValue(null);
    }

    trackByFn(index: number, item: any): any {
        return item.id || index;
    }

}