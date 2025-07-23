import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, TemplateRef, ViewChild, ViewContainerRef, ViewEncapsulation } from "@angular/core";
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { Location } from "@angular/common";
import { FuseAlertService } from "@fuse/components/alert";
import { OpResult } from "app/core/type/result/result.types";
import { forkJoin, fromEvent, Observable, Subject, Subscription } from "rxjs";
import { debounceTime, distinctUntilChanged, map, takeUntil, switchMap, filter, take } from 'rxjs/operators';
import { ProductSubset } from "../../../reports/product-subset/product-subset.types";
import { Product } from "../../product/product.types";
import { ProductService } from "../product.service";
import { Paging } from "app/core/type/paging/paging.type";
import { GoodsMeasure, KeyValue } from "app/core/type/key-value/key-value.type";
import { Units } from "app/modules/configuration/measurement/unit/unit.types";
import { DialogService } from "../dialog/dialog.service";
import { OverlayRef, Overlay } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { fuseAnimations } from "../../../../../../@fuse/animations";
@Component({
  selector: "product-subsets",
  templateUrl: "./subset.component.html", styleUrls: ['../../../../../layout/common/right-click-menu/right-click.scss'],
  styles: [
    /* language=SCSS */
    `     
    ::ng-deep html, body {
      min-height: 100% !important;
      height: 100% !important;
      margin: 0;
  }
  ::ng-deep .mat-tab-body-wrapper {
     height: 100%;
      flex-grow: 1;
  }
  ::ng-deep .tab-container {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  ::ng-deep .mat-tab-body {
    height: 100%;
      display: flex !important;
      flex-direction: column;
  }
  ::ng-deep .mat-tab-label-container{
      padding:0px!important;
  }
  ::ng-deep .mat-tab-body-content {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      padding-left:0px!important;
      padding-right:0px!important;
  }
        .product-subsets-grid {
            grid-template-columns:50px 150px auto 200px;

            @screen sm {
                grid-template-columns:112px auto 100px 70px;
            }

            @screen md {
                grid-template-columns: 112px auto 150px 150px 370px 150px 70px;
            }

            @screen lg {
                grid-template-columns:150px auto 250px 100px 200px;
            }
            @screen print{
                grid-template-columns: 112px 370px 370px 70px;
            }
        }
    
    `
  ]
})
export class ProductSubsetComponent implements OnInit, OnDestroy {

  @ViewChild('subsetFilter', { static: true }) subsetFilter: ElementRef;
  @ViewChild('userMenu') userMenu: TemplateRef<any>;
  showUpScroll: boolean;
  showDownScroll: boolean;
  showScrollHeight = 300;
  hideScrollHeight = 10;
  _result: OpResult = new OpResult();
  overlayRef: OverlayRef | null;
  titleInfo: string;
  pageType: string;
  isLoading = false;
  disableImportBotton = false;
  selectedSubsetRow: GoodsMeasure;
  productSubsets$: Array<GoodsMeasure>;
  productSubsetInfo: ProductSubset;
  frmProductSubset: FormGroup;
  massUnitData: Array<Units>;
  lengthUnitData: Array<Units>;
  areaUnitData: Array<Units>;
  result = new OpResult();
  private _unsubscribeAll: Subject<any>;
  brands: Array<KeyValue>;
  sub: Subscription;
  @ViewChild("scrollContainer") scrollContainer: ElementRef<HTMLDivElement>;
  constructor(
    public viewContainerRef: ViewContainerRef,
    public overlay: Overlay,
    private _formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private service: ProductService,
    private cdr: ChangeDetectorRef,
    private fuseAlertService: FuseAlertService,
    private _dialogService: DialogService,
  ) {
    this.productSubsetInfo = new ProductSubset();
    this.productSubsetInfo.page = new Paging();
    this.productInfo$.goodsList = new Array<GoodsMeasure>();
    this.productSubsets$ = new Array<GoodsMeasure>();
    this.selectedSubsetRow = new GoodsMeasure();
    this._unsubscribeAll = new Subject();
  }
  get productInfo$(): Product {
    return this.service.getProductInfo();
  }
  ngOnInit(): void {
    this.disableImportBotton = true;
    this.frmProductSubset = this.createFormObj();
    const id = Number(this.route.snapshot.paramMap.get("id"));

    if (id > 0) {
      this.pageType = "edit";
      this.getById(id);
    } else {
      this.pageType = "new";
    }
  }
  ngAfterViewInit() {
    fromEvent(this.subsetFilter.nativeElement, 'keyup')
      .pipe(
        takeUntil(this._unsubscribeAll),
        debounceTime(150),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.isLoading = true;
        this.cdr.detectChanges();
        if (!this.productSubsets$) {
          return;
        }
        let searchText = this.subsetFilter.nativeElement.value.toLowerCase();
        this.productSubsets$ = this.productInfo$.goodsList.filter(item =>
          item.code.toLowerCase().includes(searchText)
          || item.name.toLocaleLowerCase().includes(searchText)
          || item.categoryName.toLocaleLowerCase().includes(searchText)
          || item.measure.toString().toLocaleLowerCase().includes(searchText));
        this.isLoading = false;
        this.cdr.detectChanges();
      });


  }
  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  trackByFn(index: number, item: any): any {
    return item.id || index;
  }

  private getById(id: number): void {
    this.isLoading = true;
    this.cdr.detectChanges();
    this.productSubsetInfo.productId = id;
    this.productSubsetInfo.page.sort = '';
    this.productSubsetInfo.page.order = 'asc';
    forkJoin(
      this.getProduct(id),
      this.getUnits(),
      this.getBrands(),
    ).subscribe((res) => {
      this.setForkJoinValuesInEditMode(res);
      this.isLoading = false;
      this.cdr.detectChanges();
    });
  }

  private setForkJoinValuesInEditMode(values: any[]) {
    this.service.setProductInfo(values[0].data);
    this.productSubsets$ = [...this.productInfo$.goodsList];
    this.productSubsets$.forEach(item => item.source = 'Current subset');
    this.productSubsets$.forEach(item => item.sourceColor = 'bg-blue-500');
    this.massUnitData = values[1].data.filter(x => x.measurementMetricId === 1000692);
    this.lengthUnitData = values[1].data.filter(x => x.measurementMetricId === 1000694);
    this.areaUnitData = values[1].data.filter(x => x.measurementMetricId === 1000693);
    this.brands = values[2].data;
    this.setSelectedControls(this.productInfo$.goodsList);
    this.titleInfo = this.productInfo$.fullName;
    this.loadProducts();
  }

  private getProduct(id: number): Observable<any> {
    return this.service.getProduct(id.toString());
  }
  private getProductSubsets(productSubsetInfo: ProductSubset): Observable<any> {
    return this.service.getProductSubsets(productSubsetInfo);
  }
  private getUnits(): Observable<any> {
    return this.service.getUnits();
  }


  public save(): void {
    this.dismissAlert('successMessage');
    this.dismissAlert('errorMessage');
    this.service.setProductSubsets(this.productInfo$).subscribe(res => {
      this.isLoading = false;
      this._result.succeed = res.succeed;
      this._result.message = res.message;
      if (this._result.succeed)
        this.showAlert('successMessage');
      else
        this.showAlert('errorMessage');
      this.cdr.detectChanges();
    });
  }



  private createFormObj(): FormGroup {
    return this.fb.group({
    });
  }
  private getProducts(brandId: number): Observable<any> {
    let obj: Product = new Product();
    obj.brandId = brandId;
    return this.service.getProductTree(obj);
  }
  private getProductsTree(brands: Array<KeyValue>): Observable<any> {

    const observables = brands.map(item => this.getProducts(item.key));
    return forkJoin(observables);

  }
  private getBrands(): Observable<any> {
    return this.service.getBrands();
  }
  private loadProducts() {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.cdr.detectChanges();
    this.getProductsTree(this.brands).pipe(takeUntil(this._unsubscribeAll))
      .subscribe((products: any) => {
        this.isLoading = false;
        this.service.setProductList(products.reduce((acc, cur) => {
          if (cur.data.length > 0) {
            return acc.concat(cur.data);
          } else {
            return acc;
          }
        }, []));
        this.disableImportBotton = false;
        this.cdr.detectChanges();
      });
  }
  private showAlert(name: string): void {
    this.fuseAlertService.show(name);
  }

  private dismissAlert(name: string): void {
    this.fuseAlertService.dismiss(name);
  }

  public myError(controlName: string, errorName: string) {
    return this.frmProductSubset.controls[controlName].hasError(errorName);
  }
  applyFilterOnProductSubsets(filterValue: string) {
    let value: string = filterValue.trim().toLowerCase();
    this.productSubsets$ = this.productInfo$.goodsList.filter(x => x.categoryName.toLowerCase().includes(value) ||
      x.code.toLowerCase().includes(value) ||
      x.name.toLowerCase().includes(value));
  }
  toggleAllGoods(): void {
    if (this.productInfo$.goodsList.length == this.productSubsets$.length)
      this.productInfo$.goodsList = [];
    else {
      this.productInfo$.goodsList = [];
      for (let index = 0; index < this.productSubsets$.length; index++) {
        //this.productInfo.goodsList.push({});
      }
    }
  }
  toggleGoods(goodsId: number): void {
    const indx = this.productInfo$.goodsList.findIndex(x => x.key === goodsId);
    if (this.productInfo$.goodsList[indx].sourceColor == 'bg-red-600') {
      let soruce: string = this.productInfo$.goodsList[indx].source;
      this.productSubsets$[indx].source = soruce;
      this.productSubsets$[indx].sourceColor = (soruce == 'Imported' ? 'bg-green-600' : 'bg-blue-500');
      this.productInfo$.goodsList[indx].sourceColor = (soruce == 'Imported' ? 'bg-green-600' : 'bg-blue-500');
    }
    else {
      this.productSubsets$[indx].source = 'Removed';
      this.productSubsets$[indx].sourceColor = 'bg-red-600';
      this.productInfo$.goodsList[indx].sourceColor = 'bg-red-600';
    }
    this.cdr.detectChanges();

  }
  checkGoodsIsSelected(goodsId: number): boolean {
    return this.productInfo$.goodsList.findIndex(x => x.key == goodsId) > -1;
  }
  private setSelectedControls(goodsMeasureList: Array<GoodsMeasure>) {
    goodsMeasureList.forEach(element => {
      this.toggleSlectedGoodsControl(element);
      //this.setGoodsMixtureValue(element);
    });
  }

  private toggleSlectedGoodsControl(goodsMeasure: GoodsMeasure) {
    let control = this.frmProductSubset.controls[goodsMeasure.key.toString()];
    if (control)
      this.removeSelectedGoodsContols(goodsMeasure);
    else {
      this.addSelectedGoodsContols(goodsMeasure);
    }
  }
  private removeSelectedGoodsContols(goodsMeasure: GoodsMeasure) {
    if (goodsMeasure.itemId == 1000691)
      this.frmProductSubset.removeControl(goodsMeasure.key.toString());
    else if (goodsMeasure.itemId === 1000692) {
      this.frmProductSubset.removeControl('mass'.concat(goodsMeasure.key.toString()));
      this.frmProductSubset.removeControl('massUnit'.concat(goodsMeasure.key.toString()));
    }
    else if (goodsMeasure.itemId === 1000693) {
      this.frmProductSubset.removeControl('length'.concat(goodsMeasure.key.toString()));
      this.frmProductSubset.removeControl('width'.concat(goodsMeasure.key.toString()));
      this.frmProductSubset.removeControl('areaUnit'.concat(goodsMeasure.key.toString()));
    } else if (goodsMeasure.itemId === 1000694) {
      this.frmProductSubset.removeControl('length'.concat(goodsMeasure.key.toString()));
      this.frmProductSubset.removeControl('lengthUnit'.concat(goodsMeasure.key.toString()));
    }

    this.frmProductSubset.removeControl('conformity'.concat(goodsMeasure.key.toString()));
  }

  private addSelectedGoodsContols(goodsMeasure: GoodsMeasure) {
    if (goodsMeasure.itemId === 1000691)
      this.frmProductSubset.addControl(goodsMeasure.key.toString(), new FormControl('', Validators.required));
    else if (goodsMeasure.itemId === 1000692) {
      this.frmProductSubset.addControl('mass'.concat(goodsMeasure.key.toString()), new FormControl('', Validators.required));
      this.frmProductSubset.addControl('massUnit'.concat(goodsMeasure.key.toString()), new FormControl('', Validators.required));
    }
    else if (goodsMeasure.itemId === 1000693) {
      this.frmProductSubset.addControl('length'.concat(goodsMeasure.key.toString()), new FormControl('', Validators.required));
      this.frmProductSubset.addControl('width'.concat(goodsMeasure.key.toString()), new FormControl('', Validators.required));
      this.frmProductSubset.addControl('areaUnit'.concat(goodsMeasure.key.toString()), new FormControl('', Validators.required))
    }
    else if (goodsMeasure.itemId === 1000694) {
      this.frmProductSubset.addControl('length'.concat(goodsMeasure.key.toString()), new FormControl('', Validators.required));
      this.frmProductSubset.addControl('lengthUnit'.concat(goodsMeasure.key.toString()), new FormControl('', Validators.required))
    }
    this.frmProductSubset.addControl('conformity'.concat(goodsMeasure.key.toString()), new FormControl('', Validators.required));
  }
  openImportDialog(importType: string) {
    let title: string;
    title = importType == '1' ? 'Import From Product Subset' : 'Goods List';
    let configForm: FormGroup = this._formBuilder.group({
      importType: importType,
      title: title,
      dismissible: this._formBuilder.group({
        show: true,
        disabled: false
      })
    });
    this.close();
    const dialogRef = this._dialogService.open(configForm.value);
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (importType == '1')
          this.importSelectedProductSubsets();
        else
          this.importSelectedGoods();

      }

    });
  }
  private importSelectedProductSubsets(): void {
    let product: ProductSubset = new ProductSubset();
    let goodsList: Array<GoodsMeasure> = new Array<GoodsMeasure>();
    product.page = new Paging()
    product.page.sort = 'productId';
    product.page.order = 'asc';
    product.productIdList = [...this.service.getImportedProductIdList().map(x => x)];
    if (product.productIdList.length > 0) {
      this.isLoading = true;
      this.cdr.detectChanges();
      this.getProductSubsets(product).subscribe((res) => {
        let existingGoodsIds = new Set(this.productInfo$.goodsList.map(item => item.key));
        let result = res.data.filter(x => !existingGoodsIds.has(x.goodsId));
        result.forEach(element => {
          goodsList.push({
            key: element.goodsId,
            itemId: element.measurementMetricId,
            name: element.goodsName,
            code: element.goodsCode,
            categoryName: element.goodsCategoryName,
            measure: element.measure,
            unitId: element.unitId,
            conformityId: element.conformityId,
            source: 'Imported',
            sourceColor: 'bg-green-600'
          });
        });
        this.productSubsets$ = this.productSubsets$.concat(goodsList);
        this.productInfo$.goodsList = this.productInfo$.goodsList.concat(goodsList);
        this.setSelectedControls(goodsList);
        this.isLoading = false;
        this.cdr.detectChanges();
      });
    }
  }
  private importSelectedGoods(): void {
    let goodsList: Array<GoodsMeasure> = new Array<GoodsMeasure>();
    let existingGoodsIds = new Set(this.productInfo$.goodsList.map(item => item.key));
    let result = this.service.getImportedGoodsList().filter(x => !existingGoodsIds.has(x.goodsId));
    if (result.length > 0) {
      result.forEach(element => {
        goodsList.push({
          categoryName: element.categoryName, code: element.goodsCode, conformityId: 0, itemId: element.measurementMetricId,
          key: element.goodsId, measure: 0, name: element.goodsName, unitId: 0, source: 'Imported', sourceColor: 'bg-green-600'
        });
      });
      this.productSubsets$ = this.productSubsets$.concat(goodsList);
      this.productInfo$.goodsList = this.productInfo$.goodsList.concat(goodsList);
      this.setSelectedControls(goodsList);
      this.isLoading = false;
      this.cdr.detectChanges();
    }


  }
  close() {
    this.sub && this.sub.unsubscribe();
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }
  @HostListener('scroll', ['$event'])
  onWindowScroll() {
    let div = document.getElementById("scrollDiv");
    if ((div.offsetTop > this.showScrollHeight || div.scrollTop > this.showScrollHeight)) {
      this.showUpScroll = true;
    }
    else if (this.showUpScroll && (div.offsetTop < this.hideScrollHeight || div.scrollTop < this.hideScrollHeight)) {
      this.showUpScroll = false;
    }
    if (div.scrollTop + 1000 < div.scrollHeight)
      this.showDownScroll = true;
    else

      this.showDownScroll = false;
  }
  scrollToTop() {
    (function smoothscroll() {
      let div = document.getElementById("scrollDiv");
      var currentScroll = div.scrollTop;
      if (currentScroll > 0) {
        window.requestAnimationFrame(smoothscroll);
        div.scrollTo(0, currentScroll - (currentScroll / 5));
      }
    })();

    this.showDownScroll = false;
  }
  scrollToDown() {
    //  (function smoothscroll() {
    //window.requestAnimationFrame(smoothscroll);
    this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;

    //  })();
  }
  clearList() {
    this.productSubsets$ = [];
    this.productInfo$.goodsList = [];
    Object.keys(this.frmProductSubset.controls).forEach(key => {
      this.frmProductSubset.removeControl(key);
    });
    this.cdr.detectChanges();
  }
  loadCurrentSubset() {
    this.isLoading = true;
    this.cdr.detectChanges();
    this.getProduct(this.productInfo$.productId).subscribe((res) => {
      this.service.setProductInfo(res.data);
      this.productSubsets$ = [...this.productInfo$.goodsList];
      this.productSubsets$.forEach(item => item.source = 'Current subset');
      this.productSubsets$.forEach(item => item.sourceColor = 'bg-blue-500');
      this.isLoading = false;
      this.cdr.detectChanges();
    });;
  }
  open({ x, y }: MouseEvent, customer) {
    this.close();
    const positionStrategy = this.overlay.position()
      .flexibleConnectedTo({ x, y })
      .withPositions([
        {
          originX: 'end',
          originY: 'bottom',
          overlayX: 'end',
          overlayY: 'top',
        }
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.close()
    });

    this.overlayRef.attach(new TemplatePortal(this.userMenu, this.viewContainerRef, {
      $implicit: customer
    }));


    this.sub = fromEvent<MouseEvent>(document, 'click')
      .pipe(
        filter(event => {
          const clickTarget = event.target as HTMLElement;
          return !!this.overlayRef && !this.overlayRef.overlayElement.contains(clickTarget);
        }),
        take(1)
      ).subscribe(() => this.close())
  }
  removeSubset(goodsId: number): void {
    const indx = this.productSubsets$.findIndex(x => x.key == goodsId);
    this.productSubsets$.splice(indx, 1);
    const indx2 = this.productInfo$.goodsList.findIndex(x => x.key == goodsId);
    this.removeSelectedGoodsContols(this.productInfo$.goodsList[indx2]);
    this.productInfo$.goodsList.splice(indx2, 1);
    this.close();
    this.cdr.detectChanges();
  }
}

function nationalIDValidator(
  c: AbstractControl
): { [key: string]: boolean } | null {
  const array = c.value.split("");
  let sum = 0;
  for (let i = 0; i < array.length; i++) {
    sum += Number(array[i]) * (10 - i);
  }

  if (sum % 11 != 0 || array.length != 10) {
    return { invalidId: true };
  }
  return null;
}
