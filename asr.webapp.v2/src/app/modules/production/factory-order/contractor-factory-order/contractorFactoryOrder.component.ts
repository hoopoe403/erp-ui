import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { fuseAnimations } from "../../../../../@fuse/animations";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { animate, state, style, transition, trigger } from "@angular/animations";
import { FactoryOrderService } from "../factory-order.service";
import { FuseAlertService } from '@fuse/components/alert';
import { ContractorFactoryOrderGoodsAPI , FactoryOrderContractor, FactoryOrderContractorAPI , FactoryOrderReceiptAPI } from '../factory-order.types';
import { OpResult } from 'app/core/type/result/result.types';
import { ActivatedRoute } from '@angular/router';
import { MatMenuTrigger } from '@angular/material/menu';
import { OverlayRef } from '@angular/cdk/overlay';
import { Paging } from 'app/core/type/paging/paging.type';
import { Subject, Observable, forkJoin, Subscription } from 'rxjs';
import { Units } from 'app/modules/configuration/measurement/unit/unit.types';
@Component({
    selector: 'contractor-factory-order',
    templateUrl: './contractorFactoryOrder.component.html',
    animations: [fuseAnimations, trigger('detailExpand', [
        state('collapsed', style({ height: '0px', minHeight: '0' , opacity: 0 })),
        state('expanded', style({ height: '*' , opacity : 1})),
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
                grid-template-columns:   130px  150px auto 150px 100px 30px;
            }

            @screen lg {
                grid-template-columns:   130px 150px auto 150px 100px 30px;
            }
        }
        .goods-grid-list {
            grid-template-columns:  75px 300px auto;

            @screen sm {
                grid-template-columns: 48px auto 112px 72px;
            }

            @screen md {
                grid-template-columns:   130px  150px auto 250px 100px 80px ;
            }

            @screen lg {
                grid-template-columns:   130px  150px auto 250px 100px 80px ;
            }
        }
        
        .goods-preview-grid {
            grid-template-columns:  150px auto 300px 200px 200px;

            @screen sm {
                grid-template-columns:  150px auto 150px 200px 200px;
            }

            @screen md {
                grid-template-columns:   150px auto 150px 150px 150px;
            }

            @screen lg {
                grid-template-columns:  150px auto 150px 150px 150px;
            }
        }
        `
    ],
    encapsulation: ViewEncapsulation.None
})

export class ContractorFactoryOrderComponent implements OnInit, OnDestroy {
    sub: Subscription;
    overlayRef: OverlayRef | null;
    public titleInfo: string;
    public _result: OpResult = new OpResult();
    public pageType: string;
    public isLoading: boolean = false;
    public frmFactoryOrder: FormGroup;
    private id: number;
    private purchaserId : number;
    contractorFactoryOrderGoodsAPI: ContractorFactoryOrderGoodsAPI;
    actionDisable: boolean = false;
    factoryOrderContractor: FactoryOrderContractor;
    pagination: Paging;
    private _unsubscribeAll: Subject<any>;
    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
    @ViewChild('goodsFilter', { static: true }) goodsFilter: ElementRef;
    massUnitData: Array<Units>;
    lengthUnitData: Array<Units>;
    areaUnitData: Array<Units>;
    expandedList: Array<number> = [];
    addBottonDisabledList: Array<number> = [];
    frmSelectedGoods = new FormGroup({});
    frmGoodsReceipt = new FormGroup({});
    frmAdvancedSearch = new FormGroup({
        code: new FormControl(),
        name: new FormControl(),
    });
    constructor(
        private service: FactoryOrderService,
        private cdr: ChangeDetectorRef,
        private route: ActivatedRoute,
        private _fuseAlertService: FuseAlertService,
        private _changeDetectorRef: ChangeDetectorRef
    ) {
        this._unsubscribeAll = new Subject();
        this.factoryOrderContractor = new FactoryOrderContractor();
        this.factoryOrderContractor.contractorGoods = [];
        this.factoryOrderContractor.goodsReceiptList = [];
        this.factoryOrderContractor.page = new Paging();
        this.contractorFactoryOrderGoodsAPI = new ContractorFactoryOrderGoodsAPI();
        this.contractorFactoryOrderGoodsAPI.contractorGoods = [];
        this.contractorFactoryOrderGoodsAPI.goodsReceiptList = [];
        // Set the default

    }

    /**
     * On init
     */
    ngOnInit(): void {
        this.isLoading = true;
        this.id = Number(this.route.snapshot.paramMap.get('id'));
        this.purchaserId = Number(this.route.snapshot.paramMap.get('purchaserId'));
        this.pageType = 'edit';
        this.getById(this.id , this.purchaserId);
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }
   
    private getById(id: number , purchaserId:number) {
        this.isLoading = true;

        forkJoin(
            this.getContractorFactoryOrderGoods(id , purchaserId),
            this.getUnits(),
        ).subscribe(res => {
            this.setForkJoinValuesInEditMode(res);
            this.setFormValues();
            this.isLoading = false;
            this.cdr.detectChanges();
        });

    }



    private getContractorFactoryOrderGoods(contractorId: number, purchaserId: number): Observable<any> {
        this.service.getContractorFactoryOrder(contractorId, purchaserId).subscribe(
            data => {
              this.isLoading = false;
              if (data.succeed) {
                this.factoryOrderContractor = data.data;
                this.titleInfo = this.factoryOrderContractor.contractorName + "'s 'In Progress' Orders (" + this.factoryOrderContractor.inProgressOrders + ")";
              }
           }
        )
        this.pagination = new Paging();
        this.pagination.flag = true;
        this.pagination.length = 0;
        this.pagination.order = 'desc';
        this.pagination.pageNumber = 1;
        this.pagination.pageSize = 100;
        this.pagination.sort = '';
        this.factoryOrderContractor.contractorId = contractorId;
        this.factoryOrderContractor.purchaserId = purchaserId;
        this.factoryOrderContractor.page = this.pagination;
        return this.service.getContractorFactoryOrderGoods(this.factoryOrderContractor);
        
    }



    private showAlert(name: string): void {
        this._fuseAlertService.show(name);
    }

    private dismissAlert(name: string): void {
        this._fuseAlertService.dismiss(name);
    }



    private getUnits(): Observable<any> {
        return this.service.getUnits();
    }

   


    private setForkJoinValuesInEditMode(values: Array<any>): void {
        this.contractorFactoryOrderGoodsAPI.contractorGoods = values[0].data.contractorGoods.contractorGoods;
        this.contractorFactoryOrderGoodsAPI.goodsReceiptList = values[0].data.goodsReceiptList;
        this.pagination.pageNumber = this.pagination.pageNumber - 1;
        this.separateUnits(values[1].data);
        this.contractorFactoryOrderGoodsAPI.contractorGoods.forEach(element => {
            this.formControls(element.factoryOrderId.toString(), element.measurementMetricId);
        });
        this.contractorFactoryOrderGoodsAPI.goodsReceiptList.forEach(element => {
            this.frmGoodsReceipt.addControl('status'.concat(element.factoryOrderId.toString()), new FormControl('', Validators.required));
            const indx = this.contractorFactoryOrderGoodsAPI.contractorGoods.findIndex(x => x.factoryOrderId === element.factoryOrderId);
            this.frmGoodsReceipt.controls['status'.concat(element.factoryOrderId.toString())].setValue(this.contractorFactoryOrderGoodsAPI.contractorGoods[indx].status);
        });
    }


    private separateUnits(units: any) {
        this.massUnitData = units.filter(x => x.measurementMetricId === 1000692);
        this.lengthUnitData = units.filter(x => x.measurementMetricId === 1000694);
        this.areaUnitData = units.filter(x => x.measurementMetricId === 1000693);
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

    checkAddIsDisabled(factoryOrderId: number): boolean{
        if(this.addBottonDisabledList.findIndex(x => x === factoryOrderId) === -1){
            return false;
        }else{
            return true;
        }
    }


    private formControls(factoryOrderId: string, measurementMetricId: number) {
            this.frmSelectedGoods.addControl('inp'.concat(factoryOrderId.toString()), new FormControl('', Validators.required));
            this.frmSelectedGoods.addControl('price'.concat(factoryOrderId.toString()), new FormControl('', Validators.required));
            if (measurementMetricId != 1000691)
                this.frmSelectedGoods.addControl('unit'.concat(factoryOrderId.toString()), new FormControl('', Validators.required));
    }


    private setFormValues() {
        this.contractorFactoryOrderGoodsAPI.contractorGoods.forEach(element => {
            if (element.measurementMetricId != 1000691)
                this.frmSelectedGoods.controls['unit'.concat(element.factoryOrderId.toString())].setValue(element.unitId);
                this.frmSelectedGoods.controls['inp'.concat(element.factoryOrderId.toString())].setValue(element.totalMeasure);
                this.frmSelectedGoods.controls['price'.concat(element.factoryOrderId.toString())].setValue(element.unitPrice);
        });
    }


    getUnitName(factoryOrderId: number): string {
        let contractorInfo = this.contractorFactoryOrderGoodsAPI.goodsReceiptList ;
        const index = contractorInfo.findIndex(x => x.factoryOrderId === factoryOrderId);
        let goods = contractorInfo[index];
        let result: string = '';
        let id : number;

        if (goods.measurementMetricId == 1000691)
            result = 'QTY';
        else if (goods.measurementMetricId == 1000692){
            id = goods.unitId;
            if (id.toString() != "")
                result = this.massUnitData.filter(x => x.unitId === id)[0].abbreviation;
        }
        else if (goods.measurementMetricId == 1000693){
            id = goods.unitId;
            if (id.toString() != "")
                result = this.areaUnitData.filter(x => x.unitId === id)[0].abbreviation;
        }
        else if (goods.measurementMetricId == 1000694){
            id = goods.unitId;
            if (id.toString() != "")
                result = this.lengthUnitData.filter(x => x.unitId === id)[0].abbreviation;
        }
        return result;

    }


    addNewReceipt(factoryOrderId : number){
        const date = new Date();
        this.addBottonDisabledList.push(factoryOrderId);
        let index = this.contractorFactoryOrderGoodsAPI.goodsReceiptList.findIndex(x => x.factoryOrderId === factoryOrderId);
        let id :number = - (this.contractorFactoryOrderGoodsAPI.goodsReceiptList[index].receiptList.length + 1);
        let controlId: string = id.toString().concat(factoryOrderId.toString());
        this.contractorFactoryOrderGoodsAPI.goodsReceiptList[index].receiptList.push({
          factoryOrderReceiptId: Number(controlId), measure: null,
          clientIP: null, registerUserID: null, registerUserName: 'Current User', localChangeDate: null,
          localChangeTime: '--' + ':'
            + '--' + ':'
            + '--',
          changeDate: date.toDateString(), goodsId: this.contractorFactoryOrderGoodsAPI.goodsReceiptList[index].goodsId, total: 0, rownumber: -id
        });
        this.toggleGoodsReceiptControls(controlId);   
    }

    toggleGoodsReceiptControls(controlId: string) {
        this.frmGoodsReceipt.addControl(controlId, new FormControl('', Validators.required));
        this.frmGoodsReceipt.addControl('total'.concat(controlId), new FormControl('', Validators.required));
    }
   


    getUnitPrice(factoryOrderId : number) : number {
        let unitPrice : number;
        unitPrice = this.frmSelectedGoods.controls['price'.concat(factoryOrderId.toString())].value;
        return unitPrice
    }

    getReceivedPrice(factoryOrderId: number, factoryOrderReceiptId: number): number {
        let unitPrice = this.getUnitPrice(factoryOrderId);
        let received: number;
        const goodsIndx = this.contractorFactoryOrderGoodsAPI.goodsReceiptList.findIndex(x => x.factoryOrderId === factoryOrderId);
    
        if (factoryOrderReceiptId > 0) {
          const receiptIndx = this.contractorFactoryOrderGoodsAPI.goodsReceiptList[goodsIndx].receiptList.findIndex(x => x.factoryOrderReceiptId === factoryOrderReceiptId);
          received = this.contractorFactoryOrderGoodsAPI.goodsReceiptList[goodsIndx].receiptList[receiptIndx].measure;
        }
        else {
          received = this.frmGoodsReceipt.controls[factoryOrderReceiptId.toString()].value;
        }
    
        return unitPrice * received;
    
      }

    save(){
        let formResult : boolean;
        formResult = this.getFormInfo();
        if(!formResult){
            return
        }else{
            this.dismissAlert('successMessage');
            this.dismissAlert('errorMessage');
            this.isLoading = true;
            this.actionDisable = true;
            let obj: FactoryOrderContractorAPI = new FactoryOrderContractorAPI();
            obj.contractorId = this.factoryOrderContractor.contractorId;
            obj.purchaserId = this.factoryOrderContractor.purchaserId;
            obj.contractorGoods = this.contractorFactoryOrderGoodsAPI.contractorGoods;
            obj.goodsReceiptListFlat = this.contractorFactoryOrderGoodsAPI.goodsReceiptListFlat;
            console.log(obj);
            this.service.editFactoryOrderContractor(obj).subscribe(res => {
            this.isLoading = false;
            this.actionDisable = false;
            this._result.succeed = res.succeed;
            this._result.message = res.message;
            if (this._result.succeed){
                this.showAlert('successMessage');
                this.addBottonDisabledList = [];
            }else{
                this.showAlert('errorMessage');
                this.cdr.detectChanges();
            }
            });
        }


    }

    private getFormInfo() : boolean{
        let result : boolean = true;
        if(this.contractorFactoryOrderGoodsAPI.goodsReceiptList.length <=0){
            this._result.succeed = false;
            this._result.message = "Atleast one goods should be selected";
            this.showAlert('errorMessage');
            return false;
        }
        this.contractorFactoryOrderGoodsAPI.contractorGoods.forEach(element =>{
            const status = this.frmGoodsReceipt.controls['status'.concat(element.factoryOrderId.toString())].value;
            const price = this.frmSelectedGoods.controls['price'.concat(element.factoryOrderId.toString())].value;
            const measure = this.frmSelectedGoods.controls['inp'.concat(element.factoryOrderId.toString())].value;
            let unitId : any; 
                if (status === '' || status === null || price === '' || price === null) {
                    result = false;
                    return result;
                }
                if(element.measurementMetricId === 1000691 &&
                    (measure === '' || measure === null))
                    {
                        result = false;
                        return result;
                }else if(element.measurementMetricId !== 1000691 &&
                   (this.frmSelectedGoods.controls['unit'.concat(element.factoryOrderId.toString())].value === null || 
                   this.frmSelectedGoods.controls['unit'.concat(element.factoryOrderId.toString())].value === '' || 
                   measure === '' ||
                   measure === null)){
                    result = false;
                    return result;
                }    
                const indx = this.contractorFactoryOrderGoodsAPI.contractorGoods.findIndex(x => x.factoryOrderId === element.factoryOrderId);
                this.contractorFactoryOrderGoodsAPI.contractorGoods[indx].status = status;
                this.contractorFactoryOrderGoodsAPI.contractorGoods[indx].unitId = unitId;
                this.contractorFactoryOrderGoodsAPI.contractorGoods[indx].totalMeasure = measure;
                this.contractorFactoryOrderGoodsAPI.contractorGoods[indx].unitPrice = price;
        })
        this.contractorFactoryOrderGoodsAPI.goodsReceiptList.forEach(element =>{
            element.receiptList.forEach(receipt =>{
                if(receipt.factoryOrderReceiptId < 0) {
                    let measure: string = this.frmGoodsReceipt.controls[receipt.factoryOrderReceiptId].value;
                    if (measure === '' || measure === null || Number(measure) <= 0){
                        result = false;
                        return result;
                    }
                }
            })
        })


        this.contractorFactoryOrderGoodsAPI.goodsReceiptListFlat = [];

        this.contractorFactoryOrderGoodsAPI.goodsReceiptList.forEach(element => {
            element.receiptList.forEach(reciept => {
                let tmp: number = 0;
                if (reciept.factoryOrderReceiptId < 0)
                tmp = Number(this.frmGoodsReceipt.controls[reciept.factoryOrderReceiptId].value.toString());
                else
                tmp = reciept.measure;

                this.contractorFactoryOrderGoodsAPI.goodsReceiptListFlat.push({
                    factoryOrderId: element.factoryOrderId,
                    categoryName: '', factoryOrderReceiptId: reciept.factoryOrderReceiptId,
                    goodsCategoryCode: '', goodsId: element.goodsId, goodsName: '', measure: tmp,
                    measurementMetricId: 0, total: 0, unitId: 0
                })
           });
        });
        console.log(this.contractorFactoryOrderGoodsAPI.goodsReceiptListFlat);
        

        if (!result) {
            this._result.succeed = false;
            this._result.message = "There is atleast one unfilled element! Please fill all the elements in the all tabs";
            this.showAlert('errorMessage');
            return false;
        }else{
            this.dismissAlert('successMessage');
            this.showAlert('successMessage');
        }
        return true;
       
    }
    


    close() {
        this.sub && this.sub.unsubscribe();
        if (this.overlayRef) {
            this.overlayRef.dispose();
            this.overlayRef = null;
        }
    }

   
    public resetAdvancedSearch() {
        this.frmAdvancedSearch.controls["code"].setValue(null);
        this.frmAdvancedSearch.controls["name"].setValue(null);
    }
  

    public goodsSearch() {
        // this.pagination.flag = true;
        // this.pagination.pageNumber = 1;
        // this.pagination.length = 0;
        // this.factoryOrderContractor.page = this.pagination;
        // this.factoryOrderContractor.goodsName = this.frmAdvancedSearch.controls["name"].value;
        // this.factoryOrderContractor.goodsCategoryCode = this.frmAdvancedSearch.controls["code"].value;
        // this.contractorFactoryOrderGoodsAPI.contractorGoods = [];
        // return this.service.getContractorFactoryOrderGoods(this.factoryOrderContractor);
    }


    checkIfExpanded(element: FactoryOrderReceiptAPI): boolean {
        if (this.expandedList.findIndex(x => x === element.factoryOrderId) === -1)
          return false;
        else
          return true;
    }


    toggleRow(element: FactoryOrderReceiptAPI) {
        const indx = this.expandedList.findIndex(x => x === element.factoryOrderId);
        if (indx === -1)
          this.expandedList.push(element.factoryOrderId);
        else
          this.expandedList.splice(indx, 1);
    }

}