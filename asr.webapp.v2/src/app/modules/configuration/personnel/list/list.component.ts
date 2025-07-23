import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ViewChild,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  OnDestroy,
} from "@angular/core";
import { PersonnelService } from "../personnel.service";
import { Paging } from "app/core/type/paging/paging.type";
import { Personnel } from "../personnel.types";
import { forkJoin, Observable, Subject } from "rxjs";
import { takeUntil, debounceTime, distinctUntilChanged } from "rxjs/operators";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { fuseAnimations } from "@fuse/animations";
import { FormGroup, FormControl } from "@angular/forms";

@Component({
  selector: "app-personnel-list",
  templateUrl: "./list.component.html",
  styles: [
    `
      .categories-grid {
        grid-template-columns: 112px auto 40px;

        @screen sm {
          grid-template-columns: 112px auto 100px 70px;
        }

        @screen md {
          grid-template-columns: 112px auto 150px 370px 150px 70px;
        }

        @screen lg {
          grid-template-columns: 150px auto 150px 300px 70px 70px;
        }
        @screen print {
          grid-template-columns: 112px 370px 370px 70px;
        }
      }
    `,
  ],
  animations: fuseAnimations,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonnelListComponent implements OnInit, OnDestroy {
  isLoading: boolean;
  @ViewChild(MatPaginator) private _paginator: MatPaginator;
  pagination: Paging;
  personnel: Personnel;
  searchInputControl = new FormControl();
  selectedInfoRow = new Personnel();

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  formAdvanceSearch = new FormGroup({
    code: new FormControl(),
    firstName: new FormControl(),
    lastName: new FormControl(),
    gender: new FormControl(),
    status: new FormControl([1000001]),
  });

  constructor(
    private service: PersonnelService,
    private cdr: ChangeDetectorRef,
    private _changeDetectorRef: ChangeDetectorRef
  ) {
    this.personnel = new Personnel();
  }

  personnels: Personnel[] = [];

  get personnels$(): Observable<Personnel[]> {
    return this.service.personnels$;
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.service.pagination$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((pagination: Paging) => {
        // Update the pagination
        this.pagination = pagination;

        // Mark for check
        this.cdr.markForCheck();
      });

    this.searchInputControl.valueChanges
      .pipe(
        takeUntil(this._unsubscribeAll),
        debounceTime(150),
        distinctUntilChanged()
      )
      .subscribe(() => {
        let value: string = this.searchInputControl.value.toLowerCase();

        this.personnels$.subscribe((items) => {
          this.personnels = items.filter(
            (x) =>
              x.personnelName.toLowerCase().includes(value) ||
              x.personnelFamily.toLowerCase().includes(value) ||
              x.personnelNo.toLowerCase().includes(value)
          );
          this.cdr.detectChanges();
        });
      });

    // this.getpersonnelsOnInit().subscribe();
    this.loadData();
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
    this.service.disposepersonnels$();
    this.service.disponsePaginator$();
  }

  private loadData(): void {
    forkJoin(this.getpersonnelsOnInit()).subscribe((res) => {
      this.setForkJoinValues(res);
      this.isLoading = false;
      this.cdr.detectChanges();
    });
  }

  private setForkJoinValues(values: any[]): void {
    this.personnels = values[0].data.personnel;
    this._changeDetectorRef.markForCheck();
    this.cdr.detectChanges();
    // this.setPaginatorAndSort();
  }

  private getpersonnelsOnInit(): Observable<any> {
    this.pagination = new Paging();
    this.pagination.flag = true;
    this.pagination.length = 0;
    this.pagination.order = "desc";
    this.pagination.pageNumber = 1;
    this.pagination.pageSize = 400;
    this.pagination.sort = "";
    this.personnel.page = this.pagination;
    return this.service.getPersonnelOnInit(this.personnel);
  }

  private getpersonnels(personnel: Personnel) {
    this.isLoading = true;
    this.service
      .getpersonnels(personnel)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((personnels: any) => {
        this.personnels = personnels.data.personnel;
        this.isLoading = false;
        this._changeDetectorRef.markForCheck();
        this.cdr.detectChanges();
      });
  }

  handlePageEvent(event: PageEvent) {
    this.pagination.length = event.length;
    this.pagination.pageSize = event.pageSize;
    this.pagination.pageNumber = event.pageIndex + 1;
    this.pagination.flag = false;
    this.personnel.page = this.pagination;
    this.getpersonnels(this.personnel);
  }

  public personnelSearch(): void {
    this.personnel.personnelNo = this.formAdvanceSearch.controls["code"].value;
    this.personnel.personnelName =
      this.formAdvanceSearch.controls["firstName"].value;
    this.personnel.personnelFamily =
      this.formAdvanceSearch.controls["lastName"].value;
    this.personnel.genderId = this.formAdvanceSearch.controls["gender"].value;
    this.personnel.status = this.formAdvanceSearch.controls["status"].value[0];
    this.pagination.flag = true;
    this.pagination.pageNumber = 1;
    this.pagination.length = 0;
    this.personnel.page = this.pagination;
    this.getpersonnels(this.personnel);
  }

  public resetAdvancedSearch(): void {
    this.formAdvanceSearch.controls["code"].setValue(null);
    this.formAdvanceSearch.controls["firstName"].setValue(null);
    this.formAdvanceSearch.controls["lastName"].setValue(null);
    this.formAdvanceSearch.controls["gender"].setValue(null);
    this.formAdvanceSearch.controls["status"].setValue(null);
  }

  trackByFn(index: number, item: any): any {
    return item.id || index;
  }
  setStatusValue(event: {
    isUserInput: any;
    source: { value: any; selected: any };
  }) {

    if (event.isUserInput) {
      if (event.source.value != 0 && event.source.selected) {
        this.personnel.statusIdList.push(event.source.value);

      }
      else if (event.source.value != 0 && !event.source.selected) {
        const index: number = this.personnel.statusIdList.indexOf(event.source.value);
        if (index !== -1)
          this.personnel.statusIdList.splice(index, 1);
        this.formAdvanceSearch.controls["status"].setValue(this.personnel.statusIdList);
      }
    }
  }
}
