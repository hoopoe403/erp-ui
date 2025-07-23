import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { fuseAnimations } from "../../../../../@fuse/animations";
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from "@angular/forms";
import { animate, state, style, transition, trigger } from "@angular/animations";
import { FactoryOrderService } from "../factory-order.service";
import { FuseAlertService } from '@fuse/components/alert';
import { FactoryOrder, FactoryOrderGoods } from '../factory-order.types';
import { OpResult } from 'app/core/type/result/result.types';
import { ActivatedRoute } from '@angular/router';
import { MatMenuTrigger } from '@angular/material/menu';
import { OverlayRef } from '@angular/cdk/overlay';
import { Goods, GoodsService } from 'app/modules/inventory/goods/goods/goods.types';
import { Paging } from 'app/core/type/paging/paging.type';
import { HierarchicalKeyValue, KeyValue } from 'app/core/type/key-value/key-value.type';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Subject, merge, Observable, forkJoin, fromEvent, of, async, Subscription } from 'rxjs';
import { debounceTime, switchMap, map, distinctUntilChanged, takeUntil, startWith } from 'rxjs/operators';
import { Units } from 'app/modules/configuration/measurement/unit/unit.types';
import { Owner, OwnerType } from 'app/modules/configuration/owner/owner.types';
@Component({
    selector: 'user-details',
    templateUrl: './details.component.html',
    animations: [fuseAnimations, trigger('detailExpand', [
        state('collapsed', style({ height: '0px', minHeight: '0' })),
        state('expanded', style({ height: '*' })),
        transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
    ],
    styles: [
        `        
        .is-invalid {
            border-left: solid 6px red;
          }
        .material-icons {
            display: inline-flex;
            vertical-align: middle;
         }
         .text-danger {
            color: #dc3545!important;
        }
        .text-success {
            color: #28a745!important;
        }
        .col {
            flex-basis: 0;
            flex-grow: 1;
            max-width: 100%;
        }
        html, body {
            min-height: 100% !important;
            height: 100% !important;
            margin: 0;
        }
        .mat-tab-body-wrapper {
            flex-grow: 1;
        }
        
        .mat-tab-body {
            display: flex !important;
            flex-direction: column;
        }
        
        .mat-tab-body-content {
            display: flex;
            flex-direction: column;
            flex-grow: 1;
        }
        .goods-grid {
            grid-template-columns:  75px 300px auto;

            @screen sm {
                grid-template-columns: 48px auto 112px 72px;
            }

            @screen md {
                grid-template-columns:  50px 30px auto  50px 50px ;
            }

            @screen lg {
                grid-template-columns: 75px 300px auto;
            }
        }
        .goods-preview-grid {
            grid-template-columns:  150px auto 300px 200px 200px;

            @screen sm {
                grid-template-columns:  150px auto 150px 200px 200px;
            }

            @screen md {
                grid-template-columns:   150px auto 150px 200px 200px;
            }

            @screen lg {
                grid-template-columns:  150px auto 300px 200px 200px;
            }
        }
        `
    ],
    encapsulation: ViewEncapsulation.None
})

export class FactoryOrderDetailsComponent implements OnInit, OnDestroy {
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;
    sub: Subscription;
    overlayRef: OverlayRef | null;
    supplierFilteredOptions: Observable<Owner[]>;
    supplierControl = new FormControl();
    public titleInfo: string;
    public factoryOrderInfo: FactoryOrder = new FactoryOrder();
    public filteredGoods: Array<Goods>;
    public goods: Array<Goods>;
    public _result: OpResult = new OpResult();
    public pageType: string;
    public isLoading: boolean = false;
    public frmFactoryOrder: FormGroup;
    private id: number;
    private goodsInfo: Goods = new Goods();
    goodsServices: Array<GoodsService>;
    purchasers: Array<KeyValue> = new Array<KeyValue>();
    pagination: Paging;
    selectedCat: number = 0;
    supplierTypes: Array<KeyValue>;
    private _unsubscribeAll: Subject<any>;
    goodsCatArray: any = [];
    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
    @ViewChild('goodsFilter', { static: true }) goodsFilter: ElementRef;
    massUnitData: Array<Units>;
    lengthUnitData: Array<Units>;
    areaUnitData: Array<Units>;
    frmSelectedGoods = new FormGroup({});
    suppliers: Array<Owner>;
    frmAdvancedSearch = new FormGroup({
        code: new FormControl(),
        name: new FormControl(),
    });
    constructor(
        private service: FactoryOrderService,
        private _formBuilder: FormBuilder,
        private cdr: ChangeDetectorRef,
        private route: ActivatedRoute,
        private _fuseAlertService: FuseAlertService,
        private _changeDetectorRef: ChangeDetectorRef
    ) {
        this._unsubscribeAll = new Subject();
        this.goods = [];
        this.factoryOrderInfo.goodsList = [];
        this.suppliers = new Array<Owner>();
        // Set the default

    }

    /**
     * On init
     */
    ngOnInit(): void {

        this.frmFactoryOrder = this.createFormObject();
        this.isLoading = true;
        this.bindFilters();
        this.initialGoodsServiceArray();
        this.initialSupplierTypes();
        this.supplierFilteredOptions = this.supplierControl.valueChanges.pipe(
            startWith(''),
            map(value => this._supplierFilter(value))
        );
        this.id = Number(this.route.snapshot.paramMap.get('id'));
        if (this.id > 0) {
            this.pageType = 'edit';
            this.getById(this.id);

        }
        else {
            this.titleInfo = 'Register New Order';
            this.pageType = 'new';
            this.loadData();
        }
        this.initialPagination();
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }
    private loadData() {

        forkJoin(
            this.getPurchasers(),
            this.getGoodsOnInit(),
            this.getGoodsCats(),
            this.getUnits()
        ).subscribe(res => {
            this.setForkJoinValues(res);
            this.isLoading = false;
            this.cdr.detectChanges();
        });

    }
    private getById(id: number) {
        this.isLoading = true;

        forkJoin(
            this.getFactoryOrder(id),
            this.getPurchasers(),
            this.getGoodsOnInit(),
            this.getGoodsCats(),
            this.getUnits()
        ).subscribe(res => {
            this.setForkJoinValuesInEditMode(res);
            this.isLoading = false;
            this.setFormValues();
            this.cdr.detectChanges();
        });

    }
    private initialSupplierTypes() {
        this.supplierTypes = new Array<KeyValue>();
        this.supplierTypes.push({ key: 1000611, value: 'Organization' });
        this.supplierTypes.push({ key: 1000613, value: 'Contractor' });
    }
    private initialGoodsServiceArray() {
        this.goodsServices = new Array<GoodsService>();
        let noneItem: GoodsService = new GoodsService();
        noneItem.goodsId = 0;
        noneItem.serviceId = 0;
        noneItem.serviceCode = '0';
        noneItem.serviceName = 'none';
        this.goodsServices.push(noneItem);
    }

    private removeGoodsServices(goodsId: number) {
        this.goodsServices = this.goodsServices.filter(x => x.goodsId !== goodsId);
    }
    private getGoodsServices(goodsId: number): void {
        let obj: GoodsService = new GoodsService();
        obj.goodsId = goodsId;
        this.service.getGoodsServices(obj).subscribe(res => {
            res.data.forEach(element => {
                this.goodsServices.push(element);
            });
            this.isLoading = false;
        });
    }
    private getFactoryOrder(id: number): Observable<any> {
        return this.service.getFactoryOrder(id);
    }

    private getPurchasers(): Observable<any> {
        return this.service.getPurchasers();
    }
    private getUnits(): Observable<any> {
        return this.service.getUnits();
    }
    private separateUnits(units: any) {
        this.massUnitData = units.filter(x => x.measurementMetricId === 1000692);
        this.lengthUnitData = units.filter(x => x.measurementMetricId === 1000694);
        this.areaUnitData = units.filter(x => x.measurementMetricId === 1000693);
    }
    public setSelectedCat(selectedId: number) {
        this.selectedCat = selectedId;
        if (selectedId > 0) {
            this.trigger.closeMenu();
        }
    }
    private getGoodsCats(): Observable<any> {
        return this.service.getGoodsCats();
    }
    private setForkJoinValues(values: Array<any>): void {
        this.purchasers = values[0].data;
        this.goods = this.filteredGoods = values[1].data.goods;
        this.pagination = { ...values[1].data.page };
        this.pagination.pageNumber = this.pagination.pageNumber - 1;
        this.goodsCatArray = values[2].data;
        this.separateUnits(values[3].data);
        this.setPaginatorAndSort();
        this.addSelectanItemToCatMenu();
    }

    private setForkJoinValuesInEditMode(values: Array<any>): void {
        this.factoryOrderInfo = values[0].data;
        this.purchasers = values[1].data;
        this.goods = this.filteredGoods = values[2].data.goods;
        this.pagination = values[2].data.page;
        this.pagination = { ...values[2].data.page };
        this.pagination.pageNumber = this.pagination.pageNumber - 1;
        this.goodsCatArray = values[3].data;
        this.separateUnits(values[4].data);
        this.setPaginatorAndSort();
        this.addSelectanItemToCatMenu();
        this.factoryOrderInfo.goodsList.forEach(element => {
            this.toggleSlectedGoodsControls(element.goodsId.toString(), element.measurementMetricId, 'add');
            this.getGoodsServices(element.goodsId);

        });
        this.titleInfo = this.factoryOrderInfo.factoryOrderCode.concat('-').concat(this.factoryOrderInfo.purchaserName);

    }

    private createFormObject(): FormGroup {

        return this._formBuilder.group({
            orderNumber: [{ value: this.factoryOrderInfo.orderNumber, disabled: true }, Validators.required],
            contractorOrderNumber: [{ value: '', disabled: true }, Validators.required],
            purchaser: [{ value: this.factoryOrderInfo.purchaserId, disabled: false }, Validators.required],
            supplierType: [{ value: this.factoryOrderInfo.supplierTypeId, disabled: false }, Validators.required],
            supplier: [{ value: this.factoryOrderInfo.supplierId, disabled: false }, Validators.required],
            estimatedDeliveryDate: [{ value: this.factoryOrderInfo.estimatedDeliveryDate, disabled: false }],
            referenceNumber: [{ value: this.factoryOrderInfo.referenceNumber, disabled: false }],
            description: '',

        }
        );
    }
    private getGoods(goodsInfo: Goods) {
        this.isLoading = true;
        this.service.getActiveGoods(goodsInfo)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((goods: any) => {
                this.goods = this.filteredGoods = goods.data.goods;
                this.pagination = { ...goods.data.page };
                this.pagination.pageNumber = this.pagination.pageNumber - 1;
                this.isLoading = false;
                this._changeDetectorRef.markForCheck();
                this.cdr.detectChanges();
            });
    }
    public goodsSearch() {
        this.pagination.flag = true;
        this.pagination.pageNumber = 1;
        this.pagination.length = 0;
        this.goodsInfo.goodsCode = this.frmAdvancedSearch.controls["code"].value;
        this.goodsInfo.goodsName = this.frmAdvancedSearch.controls["name"].value;
        this.goodsInfo.page = this.pagination;
        this.getGoods(this.goodsInfo);


    }
    private getGoodsOnInit(): Observable<any> {
        this.pagination = new Paging();
        this.pagination.flag = true;
        this.pagination.length = 0;
        this.pagination.order = 'desc';
        this.pagination.pageNumber = 0;
        this.pagination.pageSize = 100;
        this.pagination.sort = '';
        this.goodsInfo.page = { ...this.pagination };
        this.goodsInfo.page.pageNumber = this.goodsInfo.page.pageNumber + 1;
        return this.service.getActiveGoods(this.goodsInfo);
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
                    this.cdr.detectChanges();
                    this.pagination.length = this._paginator.length;
                    this.pagination.pageSize = this._paginator.pageSize;
                    this.pagination.pageNumber = this._paginator.pageIndex + 1;
                    this.pagination.flag = false;
                    this.pagination.order = this._sort.direction == null ? 'desc' : this._sort.direction;
                    this.pagination.sort = this._sort.active == null ? '' : this._sort.active;
                    this.goodsInfo.page = this.pagination;
                    return this.service.getActiveGoods(this.goodsInfo);
                }),
                map((res) => {
                    this.goods = this.filteredGoods = res.data.goods;
                    this.pagination = { ...res.data.page };
                    this.pagination.pageNumber = this.pagination.pageNumber - 1;
                    this.isLoading = false;
                    this.cdr.detectChanges();
                })
            ).subscribe();
        }
    }
    private addSelectanItemToCatMenu() {
        let obj = new HierarchicalKeyValue();
        obj.id = 0;
        obj.item = "All Categories";
        obj.parentId = -1;
        obj.children = [];
        for (var i = 0; i < this.goodsCatArray.length; i++) {
            obj.children.push(this.goodsCatArray[i]);
        }
        this.goodsCatArray = [];
        this.goodsCatArray.push(obj);
    }
    private showAlert(name: string): void {
        this._fuseAlertService.show(name);
    }

    private dismissAlert(name: string): void {
        this._fuseAlertService.dismiss(name);
    }
    private getSupplierId() {
        let supplierResult: boolean;
        let supplierId: number;
        if (this.supplierControl.value === null) {
            supplierResult = true;
            supplierId = -1;
        }
        else {
            const indx = this.suppliers.findIndex(x => x.ownerName.toLowerCase().replace(/\s/g, "")
                === this.supplierControl.value.toLowerCase().replace(/\s/g, ""));
            if (indx === -1) {
                supplierResult = true;
                supplierId = -1;
            }
            else {
                supplierResult = true;
                supplierId = this.suppliers[indx].ownerId;
            }
        }
        return { supplierResult, supplierId };
    }

    private getGoodsValues(): boolean {
        let result: boolean = true;
        this.factoryOrderInfo.goodsList.forEach(element => {
            if (element.measurementMetricId != 1000691) {
                element.unitId = this.frmSelectedGoods.controls['unit'.concat(element.goodsId.toString())].value;
                if (element.unitId == 0 || element.unitId == null)
                    result = false;
            }
            element.measure = this.frmSelectedGoods.controls['inp'.concat(element.goodsId.toString())].value;
            if (element.measure == null || element.measure == 0)
                result = false;
            element.serviceId = this.frmSelectedGoods.controls['service'.concat(element.goodsId.toString())].value;
            if (element.serviceId == null)
                result = false;
            element.unitPrice = this.frmSelectedGoods.controls['price'.concat(element.goodsId.toString())].value;
            if (element.unitPrice == null)
                result = false;
            if (!result)
                return result;
        });
        return result;
    }
    private setFormValues() {

        this.frmFactoryOrder.controls["orderNumber"].setValue(this.factoryOrderInfo.orderNumber);
        this.frmFactoryOrder.controls["contractorOrderNumber"].setValue(this.factoryOrderInfo.factoryOrderCode);
        this.frmFactoryOrder.controls["purchaser"].setValue(this.factoryOrderInfo.purchaserId);
        this.frmFactoryOrder.controls["supplierType"].setValue(this.factoryOrderInfo.supplierTypeId);
        this.frmFactoryOrder.controls["referenceNumber"].setValue(this.factoryOrderInfo.referenceNumber);
        this.frmFactoryOrder.controls["estimatedDeliveryDate"].setValue(this.factoryOrderInfo.estimatedDeliveryDate);
        this.frmFactoryOrder.controls["description"].setValue(this.factoryOrderInfo.orderDescription);
        this.factoryOrderInfo.goodsList.forEach(element => {
            if (element.measurementMetricId != 1000691)
                this.frmSelectedGoods.controls['unit'.concat(element.goodsId.toString())].setValue(element.unitId);
            this.frmSelectedGoods.controls['inp'.concat(element.goodsId.toString())].setValue(element.measure);
            this.frmSelectedGoods.controls['service'.concat(element.goodsId.toString())].setValue(element.serviceId);
            this.frmSelectedGoods.controls['price'.concat(element.goodsId.toString())].setValue(element.unitPrice);

        });
        this.supplierControl.setValue(this.factoryOrderInfo.supplierName);
        let supplierEvent: {
            isUserInput: any;
            source: { value: any; selected: any };
        } = { isUserInput: true, source: { value: this.factoryOrderInfo.supplierName, selected: true } };
        this.setSupplier(supplierEvent);

    }
    private getFormInfo(): boolean {
        let finalResult: boolean = true;
        this.factoryOrderInfo.goodsReceiptList = [];
        this.factoryOrderInfo.goodsReceiptListFlat = [];
        this.factoryOrderInfo.purchaserId = this.frmFactoryOrder.controls['purchaser'].value;
        this.factoryOrderInfo.supplierTypeId = this.frmFactoryOrder.controls['supplierType'].value;
        this.factoryOrderInfo.estimatedDeliveryDate = this.frmFactoryOrder.controls['estimatedDeliveryDate'].value;
        this.factoryOrderInfo.referenceNumber = this.frmFactoryOrder.controls['referenceNumber'].value;
        this.factoryOrderInfo.orderDescription = this.frmFactoryOrder.controls['description'].value;
        let { supplierResult, supplierId } = this.getSupplierId();
        if (!supplierResult || supplierId === 0) {
            this._result.succeed = false;
            this._result.message = 'Please select a supplier';
            this.showAlert('errorMessage');
            return false
        }
        else
            this.factoryOrderInfo.contractorId = supplierId;
        if (this.factoryOrderInfo.purchaserId == null || this.factoryOrderInfo.purchaserId == 0) {
            this._result.succeed = false;
            this._result.message = "Please enter the purchaser";
            this.showAlert('errorMessage');
            return false;
        }
        finalResult = this.getGoodsValues();
        if (!finalResult) {
            this._result.succeed = false;
            this._result.message = 'Please enter all of the goods information';
            this.showAlert('errorMessage');
        }
        return finalResult;
    }

    save() {
        this.isLoading = true;
        let formResult: boolean;
        formResult = this.getFormInfo();
        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');
        if (!formResult) {
            this.showAlert('errorMessage');
            this.cdr.detectChanges();
            return;
        }

        if (this.pageType === 'new')
            this.create();
        else
            this.edit();
    }

    private create() {

        this.service.create(this.factoryOrderInfo).subscribe(res => {
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

    private edit() {

        this.service.edit(this.factoryOrderInfo).subscribe(res => {
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
    setSupplierType(event: {
        isUserInput: any;
        source: { value: any; };
    }) {

        if (event.isUserInput) {
            this.getSuppliers(event.source.value);
        }


    }
    setSupplier(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            const indx = this.suppliers.findIndex(x => x.ownerName.toLowerCase().replace(/\s/g, "")
                === event.source.value.toLowerCase().replace(/\s/g, ""));
            if (indx === -1) {
                return;
            }
            else
                this.factoryOrderInfo.supplierName = this.suppliers[indx].ownerName;
        }
    }
    setPurchaser(event: {
        isUserInput: any;
        source: { value: any; };
    }) {

        if (event.isUserInput) {
            this.factoryOrderInfo.purchaserId = event.source.value;
            this.factoryOrderInfo.purchaserName = this.purchasers.filter(x => x.key == event.source.value)[0].value;
        }


    }
    private _supplierFilter(value: string): Owner[] {
        const filterValue = value.toLowerCase().replace(' ', '');
        return this.suppliers.filter(option => option.ownerName.toLowerCase().replace(' ', '').includes(filterValue));
    }
    private getSuppliers(supplierTypeId: number) {
        this.suppliers = [];
        this.isLoading = true;
        this.service.getOwners(supplierTypeId).subscribe(res => {
            this.suppliers = res.data;
            this.supplierControl.setValidators(ownerForbiddenNamesValidator(this.suppliers));
            this.isLoading = false;
            this.cdr.detectChanges();
        });
    }
    private extractFactoryOrderGoodsInfo(goods: Goods): FactoryOrderGoods {
        let result: FactoryOrderGoods;

        result = {
            rownumber: 0,
            goodsId: goods.goodsId,
            goodsName: goods.goodsName,
            goodsCategoryCode: goods.goodsCode,
            categoryName: goods.categoryName,
            measure: 0,
            unitPrice: 0,
            unitId: 0,
            measurementMetricId: goods.arrivalMeasurementMetricId,
            received: 0,
            total: 0,
            status: 0,
            serviceId: 0
        };
        return result;
    }
    public getMeasurementMetricName(MeasurementMetricId: number): string {
        let result: string = '';
        if (MeasurementMetricId == 1000691)
            result = 'Quantity';
        else if (MeasurementMetricId == 1000692)
            result = 'Mass';
        else if (MeasurementMetricId == 1000693)
            result = 'Area';
        else if (MeasurementMetricId == 1000694)
            result = 'Length';
        return result;
    }
    private toggleSlectedGoodsControls(controlId: string, measurementMetricId: number, action: string) {
        if (action == 'add') {
            this.frmSelectedGoods.addControl('inp'.concat(controlId.toString()), new FormControl('', Validators.required));
            this.frmSelectedGoods.addControl('service'.concat(controlId.toString()), new FormControl('', Validators.required));
            this.frmSelectedGoods.addControl('price'.concat(controlId.toString()), new FormControl('', Validators.required));
            if (measurementMetricId != 1000691)
                this.frmSelectedGoods.addControl('unit'.concat(controlId.toString()), new FormControl('', Validators.required));
        }
        else {
            this.frmSelectedGoods.removeControl('service'.concat(controlId.toString()));
            this.frmSelectedGoods.addControl('price'.concat(controlId.toString()), new FormControl('', Validators.required));
            this.frmSelectedGoods.removeControl('inp'.concat(controlId.toString()));
            if (measurementMetricId != 1000691)
                this.frmSelectedGoods.removeControl('unit'.concat(controlId.toString()));
        }
    }
    toggleGoods(goodsId: number): void {
        const indx = this.factoryOrderInfo.goodsList.findIndex(x => x.goodsId == goodsId);
        let goods: Goods;
        goods = this.goods.filter(x => x.goodsId == goodsId)[0];
        if (indx == -1) {
            this.factoryOrderInfo.goodsList.push(this.extractFactoryOrderGoodsInfo(goods));
            this.toggleSlectedGoodsControls(goodsId.toString(), goods.measurementMetricId, 'add');
            this.getGoodsServices(goodsId);
        }
        else {
            this.factoryOrderInfo.goodsList.splice(indx, 1);
            this.toggleSlectedGoodsControls(goodsId.toString(), goods.measurementMetricId, 'remove');
            this.removeGoodsServices(goodsId);
        }
    }

    checkAllGoodsIndeterminate(): boolean {
        /* const obj = this.menus.filter(x => x.assignmentType);
        return  obj.length > 1 && obj.length < this.menus.length; */
        return false;
    }

    filterGoodsServices(goodsId: number): Array<GoodsService> {
        return this.goodsServices.filter(x => x.goodsId == goodsId || x.goodsId == 0);
    }


    checkGoodsIsSelected(goodsId: number): boolean {
        return this.factoryOrderInfo.goodsList.findIndex(x => x.goodsId === goodsId) > -1;
    }
    checkGoodsIsDisabled(goodsId: number): boolean {
        return this.factoryOrderInfo.goodsList.length > 0 &&
            this.factoryOrderInfo.goodsList.findIndex(x => x.goodsId == goodsId) == -1;
    }
    private bindFilters() {
        fromEvent(this.goodsFilter.nativeElement, 'keyup')
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(150),
                distinctUntilChanged()
            )
            .subscribe(() => {

                if (!this.goods)
                    return;

                if (this.goodsFilter.nativeElement.value) {
                    let value: string = this.goodsFilter.nativeElement.value.toLowerCase();
                    this.filteredGoods = this.goods.filter(x => x.goodsCode.toLocaleLowerCase().includes(value)
                        || x.goodsName.toLocaleLowerCase().includes(value));
                }
                else
                    this.filteredGoods = this.goods;
                this.cdr.detectChanges();

            });


    }


    close() {
        this.sub && this.sub.unsubscribe();
        if (this.overlayRef) {
            this.overlayRef.dispose();
            this.overlayRef = null;
        }
    }
    openRolePage(url: string) {
        window.open(url, "_blank");

    }
    public resetAdvancedSearch() {
        this.frmAdvancedSearch.controls["code"].setValue(null);
        this.frmAdvancedSearch.controls["cover"].setValue(null);
    }
}

export function ownerForbiddenNamesValidator(owners: Owner[]): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
        // below findIndex will check if control.value is equal to one of our options or not
        const index = owners.findIndex(owner => {
            return owner.ownerName.toLowerCase().replace(/\s/g, "")
                == control.value == null ? '' : control.value.toLowerCase().replace(/\s/g, "");
        });
        return index < 0 && control.value.toString().length > 0 ? { 'forbiddenNames': { value: control.value } } : null;
    };
}

