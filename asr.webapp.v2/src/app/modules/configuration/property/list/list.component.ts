import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from "@angular/core";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { SelectionModel } from "@angular/cdk/collections";
import { Subject, merge, Observable, forkJoin, fromEvent, of } from "rxjs";
import {
  debounceTime,
  switchMap,
  map,
  distinctUntilChanged,
} from "rxjs/operators";
import { takeUntil } from "rxjs/operators";
import { fuseAnimations } from "../../../../../@fuse/animations";
import { PropertyService } from "../property.service";
import { Paging } from "app/core/type/paging/paging.type";
import { FormControl, FormGroup } from "@angular/forms";
import { MatMenuTrigger } from "@angular/material/menu";
import { Property } from "../property.types";
import jsPDF from "jspdf";
import { formatDate } from "@angular/common";
import { ExcelHeader } from "app/shared/excel/excel.types";
import { ExcelService } from "app/shared/excel/excel.service";
import { Units } from "../../measurement/unit/unit.types";


@Component({
  selector: "property-list",
  templateUrl: "./list.component.html",
  styles: [
    /* language=SCSS */
    `
      .properties-grid {
        grid-template-columns: 112px auto 40px;

        @screen sm {
          grid-template-columns: 112px auto 100px 70px;
        }

        @screen md {
          grid-template-columns: 50px auto 100px 100px 40px 50px 40px;
        }

        @screen lg {
          grid-template-columns: 100px auto 200px 200px 100px 100px 50px;
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
export class PropertyListComponent implements OnInit, OnDestroy {
  protected _onDestroy = new Subject<void>();
  @ViewChild(MatPaginator) private _paginator: MatPaginator;
  @ViewChild(MatSort) private _sort: MatSort;
  pagination: Paging;
  selection = new SelectionModel<any>(true, []);
  propertyInfo: Property;
  unitData : Array<Units>;
  statuses = [];
  defaultStatuses = [];
  frmAdvancedSearch = new FormGroup({
    code : new FormControl(),
    name : new FormControl(),
    unit : new FormControl(),
    control : new FormControl(),
    status : new FormControl()
  })
 

  searchInputControl: FormControl = new FormControl();

  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
  @ViewChild('filter', { static: true }) filter: ElementRef;
  // Private
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  isLoading: boolean;

  constructor(
    private service: PropertyService,
    private cdr: ChangeDetectorRef,
    private excelService: ExcelService,
    private _changeDetectorRef: ChangeDetectorRef
  ) {
    //this._unsubscribeAll = new Subject();

    this.propertyInfo = new Property();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------
  
  selectedInfoRow : Property = new Property;
  properties: Array<Property> = [];

   
   get properties$(): Observable<Property[]> {
        return this.service.properties$;
    }
  /**
   * On init
   */
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

    fromEvent(this.filter.nativeElement, 'keyup')
      .pipe(
        takeUntil(this._unsubscribeAll),
        debounceTime(150),
        distinctUntilChanged()
      )
      .subscribe(() => {
        if (!this.properties) 
          return;
        

        this.service.properties$.pipe(map(items => items.filter(x =>
                 x.propertyCode.toString().includes(this.filter.nativeElement.value)||
                 x.propertyName.toLowerCase().includes(this.filter.nativeElement.value)||
                 x.unitName.toLowerCase().includes(this.filter.nativeElement.value)))).subscribe(elements => {
            this.properties = elements as Property[];
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
            this.propertyInfo.page = this.pagination;
            return this.service.getProperties(this.propertyInfo);
          }),
          map(() => {
            this.isLoading = false;
            this._changeDetectorRef.markForCheck();
            this._changeDetectorRef.detectChanges();
          })
        )
        .subscribe();
    }
  }

  /**
   * On destroy
   */
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
    this.service.disposeProperties$();
    this.service.disponsePaginator$();
  }
  private setForkJoinValues(values: Array<any>): void {
    this.properties = values[0].data.properties;
    this.unitData = values[1].data;
    this.statuses = values[2].data;
    this.defaultStatuses = [];
    this.statuses.forEach((element) => {
      if (element.isDefault === 1) this.defaultStatuses.push(element.statusId);
    });
    this.frmAdvancedSearch.controls["status"].setValue(this.defaultStatuses);
    this.propertyInfo.statusIdList = this.defaultStatuses;
    this._changeDetectorRef.markForCheck();
    this.cdr.detectChanges();
    this.setPaginatorAndSort();
  }
  private loadData(): void {
    forkJoin(
      this.getPropertiesOnInit(),
      this.getUnits(),
      this.getStatuses()
      ).subscribe((res) => {
      this.setForkJoinValues(res);
      this.isLoading = false;
      this.cdr.detectChanges();
    });
  }

  

  private getStatuses(): Observable<any> {
    return this.service.getStatuses();
  } 

  private getUnits(): Observable<any>{
    return this.service.getUnits();
  }

  setStatusValue(event: {
    isUserInput: any;
    source: { value: any; selected: any };
  }) {
    if (event.isUserInput) {
      if (event.source.value != 0 && event.source.selected) {
        this.propertyInfo.statusIdList.push(event.source.value);
      } else if (event.source.value != 0 && !event.source.selected) {
        const index: number = this.propertyInfo.statusIdList.indexOf(
          event.source.value
        );
        if (index !== -1) this.propertyInfo.statusIdList.splice(index, 1);
        this.frmAdvancedSearch.controls["status"].setValue(
          this.propertyInfo.statusIdList
        );
      }
    }
  }

 


  private getProperties(propertyInfo: Property) {
    this.isLoading = true;
    this.service
      .getProperties(propertyInfo)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((properties: any) => {
        this.properties = properties.data.properties;
        this._changeDetectorRef.markForCheck();
        this.cdr.detectChanges();
        this.isLoading = false;
      });
  }

  private getPropertiesOnInit(): Observable<any> {
    this.pagination = new Paging();
    this.pagination.flag = true;
    this.pagination.length = 0;
    this.pagination.order = "desc";
    this.pagination.pageNumber = 1;
    this.pagination.pageSize = 400;
    this.pagination.sort = "";
    this.propertyInfo.page = this.pagination;
    return this.service.getPropertiesOnInit(this.propertyInfo);
  }
  public propertySearch() {
    this.pagination.flag = true;
    this.pagination.pageNumber = 1;
    this.pagination.length = 0;

    this.propertyInfo.propertyCode = 
     this.frmAdvancedSearch.controls["code"].value;
    this.propertyInfo.propertyName =
     this.frmAdvancedSearch.controls["name"].value;
    this.propertyInfo.unitId =
     this.frmAdvancedSearch.controls["unit"].value;
    this.propertyInfo.controlTypeId = 
     this.frmAdvancedSearch.controls["control"].value;
    /* this.propertyInfo.status =
     this.frmAdvancedSearch.controls["status"].value;  */
     /* this.getFormInfo(); */
        
    this.propertyInfo.page = this.pagination;
    this.getProperties(this.propertyInfo);
  }

  

  public resetAdvancedSearch() {
    this.frmAdvancedSearch.controls["code"].setValue(null);
    this.frmAdvancedSearch.controls["name"].setValue("");
    this.frmAdvancedSearch.controls["unit"].setValue("");
    this.frmAdvancedSearch.controls["control"].setValue("");
    this.frmAdvancedSearch.controls["status"].setValue(this.defaultStatuses)
  }

  handlePageEvent(event: PageEvent) {
    this.pagination.length = event.length;
    this.pagination.pageSize = event.pageSize;
    this.pagination.pageNumber = event.pageIndex + 1;
    this.pagination.flag = false;
  }
  trackByFn(index: number, item: any): any {
    return item.id || index;
  }

  download(){
    var pdf = new jsPDF('l');
    pdf.setFontSize(20);
    pdf.text('Document' , 14 , 8);
    pdf.setFontSize(12);
    pdf.setTextColor(99);
    let header = [];
    let tableData = [];
    let footer = [];
    let qty : number = 0 ;
    let date = formatDate(new Date(), 'yyyyMMdd_hhmmss' , 'en');
    let fileName:string = 'property_'.concat(date.concat('.pdf'));
    header = [{ header: "Code" },
        { header: "Name" },
        { header: "Unit" },
        { header: "Control" },
        { header: "Values" },
        { header: "Status" }
        ];
    this.properties$.subscribe(items => items.forEach(element =>{
      qty = qty + 1;
      tableData.push([
        element.propertyCode , element.propertyName , element.unitName,
        element.controlTypeName , element.valueCount ,element.statusDescription
      ])
    }))
    footer = [['Qty', '', '', '', '',qty]];
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

  exportTable(){
    let columns : Array<ExcelHeader> = new Array<ExcelHeader>();
    let obj : Array<Property> = new Array<Property>();
    let qty : number = 0;
    let date = formatDate(new Date() , 'yyyyMMdd_hhmmss' , 'en');
    let fileName: string = 'property_'.concat(date.toString());
    columns.push({basedColumnName:'propertyCode' , excelColumnName:'Code'});
    columns.push({basedColumnName:'propertyName' , excelColumnName:'Name'});
    columns.push({basedColumnName:'unitName' , excelColumnName:'Unit'});
    columns.push({basedColumnName:'controlTypeName' , excelColumnName:'Control'});
    columns.push({basedColumnName:'valueCount' , excelColumnName:'Values'});
    /* columns.push({basedColumnName:'statusDescription' , excelColumnName:'Status'}); */
    
    this.properties$.subscribe(items => items.forEach(element =>{
      qty = qty + 1;
      obj.push(element)
    }));

    let footerData = [];
    footerData.push(['','','','','QTY',qty]);

    this.excelService.exportAsExcelFile('property' , '',columns , obj , footerData, fileName,'Sheet1');
    
    obj = [];

  }
}
