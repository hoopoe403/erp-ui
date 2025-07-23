import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { fuseAnimations } from "@fuse/animations";
import { forkJoin, fromEvent, merge, Observable, Subject } from "rxjs";
import { Brand } from "../brand.type";
import { BrandService } from "../brand.service";
import { Paging } from "app/core/type/paging/paging.type";
import { debounceTime, distinctUntilChanged, map, switchMap, takeUntil } from "rxjs/operators";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { FormControl, FormGroup } from "@angular/forms";

@Component({
    selector : "brand-list",
    templateUrl : "./list.component.html",
    styles : [
        /* language=SCSS */
    `
      .brands-grid {
        grid-template-columns: 112px auto 40px;

        @screen sm {
          grid-template-columns: 112px auto 100px 70px;
        }

        @screen md {
          grid-template-columns: 112px 150px 370px 150px 70px;
        }

        @screen lg {
          grid-template-columns: 100px 200px 200px  auto 200px  100px 60px;
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

export class BrandListComponent implements OnInit{
 @ViewChild(MatPaginator) private _paginator: MatPaginator;
 @ViewChild(MatSort) private _sort: MatSort;
 @ViewChild('filter', { static: true }) filter: ElementRef;
 brandInfo: Brand;
 pagination: Paging;
 isLoading : boolean;
 frmAdvancedSearch = new FormGroup({
   code: new FormControl(),
   name: new FormControl(),
  //  status: new FormControl(),
   serial: new FormControl(),
  }); 
 searchInputControl: FormControl = new FormControl();
 selectedInfoRow: Brand = new Brand();
 brands: Array<Brand> = [];
 private _unsubscribeAll: Subject<any> = new Subject<any>(); 

 constructor(
  private service : BrandService,
  private cdr: ChangeDetectorRef,
  private _changeDetectorRef: ChangeDetectorRef){
    this.brandInfo = new Brand();
 }
 


 get brands$() : Observable<Brand[]> {
   return this.service.brands$;
 };



  ngOnInit(): void {
    this.isLoading = true;
    // this.service.pagination$
    // .pipe(takeUntil(this._unsubscribeAll))
    // .subscribe((pagination: Paging) => {
    //   // Update the pagination
    //   this.pagination = pagination;

    //   // Mark for check
    //   this._changeDetectorRef.markForCheck();
    // });
    fromEvent(this.filter.nativeElement, 'keyup')
      .pipe(
        takeUntil(this._unsubscribeAll),
        debounceTime(150),
        distinctUntilChanged()
      )
      .subscribe(() => {
        if (!this.brands)
          return;


        this.brands$.pipe(map(items => items.filter(x =>
          x.brandCode.toString().includes(this.filter.nativeElement.value) ||
          x.productCount.toString().includes(this.filter.nativeElement.value) ||
          x.brandName.toLowerCase().includes(this.filter.nativeElement.value) ||
          x.serialPrefix.toLowerCase().includes(this.filter.nativeElement.value) ||
          x.serialStartPoint.toLowerCase().includes(this.filter.nativeElement.value) ||
          x.organizationName.toLowerCase().includes(this.filter.nativeElement.value) ||
          x.status.toString().includes(this.filter.nativeElement.value)))).subscribe(elements => {
            this.brands = elements as Brand[];
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
        id: "",
        start: "desc",
        disableClear: true,
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
      merge(this._sort.sortChange, this._paginator.page)
        .pipe(
          switchMap(() => {
            this.isLoading = true;
            this.pagination.order = this._sort.direction;
            this.pagination.sort = this._sort.active;
            this.brandInfo.page = this.pagination;
            return this.service.getBrands(this.brandInfo);
          }),
          map(() => {
            this.isLoading = false;
          })
        )
        .subscribe();
      }
  }


  private setForkJoinValues(values: Array<any>): void {
    this.brands = values[0].data;
    this._changeDetectorRef.markForCheck();
    this.cdr.detectChanges();
    this.setPaginatorAndSort();
  }



  private loadData(){
    forkJoin(
      this.getBrandsOnInit()
    ).subscribe((res) =>{
      this.setForkJoinValues(res)
      this.isLoading = false;
      this.cdr.detectChanges();
    })
  }


  private getBrands(brandInfo : Brand){
    this.isLoading = true;
    this.service
      .getBrands(brandInfo)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((brands: any) =>{
        this.brands = brands.data;
        this.isLoading = false;
        this._changeDetectorRef.markForCheck();
        this.cdr.detectChanges();
      })
  }


  private getBrandsOnInit(): Observable<any> {
    this.pagination = new Paging();
    this.pagination.flag = true;
    this.pagination.length = 0;
    this.pagination.order = 'desc';
    this.pagination.pageNumber = 1;
    this.pagination.pageSize = 100;
    this.pagination.sort = "";
    this.brandInfo.page = this.pagination;
    return this.service.getBrandsOnInit(this.brandInfo)
  }

  handlePageEvent(event: PageEvent) {
    this.pagination.length = event.length;
    this.pagination.pageSize = event.pageSize;
    this.pagination.pageNumber = event.pageIndex + 1;
    this.pagination.flag = false;
    this.brandInfo.page = this.pagination;
    this.getBrands(this.brandInfo);
  }

  brandsSearch(){
    this.brandInfo.brandCode =
      this.frmAdvancedSearch.controls["code"].value;
    this.brandInfo.brandName =
      this.frmAdvancedSearch.controls["name"].value;
    this.brandInfo.serialPrefix = 
      this.frmAdvancedSearch.controls["serial"].value;
    this.pagination.flag = true;
    this.pagination.pageNumber = 1;
    this.pagination.length = 0;
    this.brandInfo.page = this.pagination;
    this.getBrands(this.brandInfo);
  }

  resetAdvancedSearch(){
    this.frmAdvancedSearch.controls["code"].setValue(null);
    this.frmAdvancedSearch.controls["name"].setValue(null);
    this.frmAdvancedSearch.controls["serial"].setValue(null);
  }

  trackByFn(index: number, item: any): any {
    return item.id || index;
  }
}