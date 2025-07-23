import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PropertyService } from '../property.service';
import { Property } from '../property.types';
import { ActivatedRoute } from '@angular/router';
import { FuseAlertService } from '@fuse/components/alert';
import { Observable, Subject, forkJoin } from 'rxjs';
import { Value } from 'app/core/type/key-value/key-value.type';
import { Paging } from 'app/core/type/paging/paging.type';
import { MatSort } from '@angular/material/sort';
import { OpResult } from 'app/core/type/result/result.types';
import { MatPaginator } from '@angular/material/paginator';


@Component({
  selector: 'property-detail',
  templateUrl: './details.component.html',
  styles:[
    `
    .properties-grid {
      @screen lg {
        grid-template-columns:auto 80px 80px;
      }
    }`
  ]
})
export class PropertyDetailsComponent implements OnInit , OnDestroy {
  @ViewChild(MatSort) private _sort: MatSort;
  @ViewChild(MatPaginator) private _paginator: MatPaginator;
  pageType:string;
  titleInfo:string;
  isMasterSel: boolean;
  checkedValues: any;
  propertyForm: FormGroup;
  _result: OpResult = new OpResult();
  selectedDep: number;
  pagination : Paging ; 
  id : number;
  values : Array<Value> = [];
  isLoading:boolean;
  filteredItemsCount : number = 0;
  unitData : Array<Property>;
  disableAddValue:boolean = true;
  propertyInfo : Property = new Property();
  private _unsubscribeAll: Subject<any>;
  statuses = [];
  defaultStatuses = [];
  formGroup: any;

  constructor(
    private service : PropertyService ,
    private _formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private _fuseAlertService: FuseAlertService){
      this.propertyInfo = new Property;
      this._unsubscribeAll = new Subject();
      this.propertyInfo.propertyValue = [];

      this.getCheckedItemList();
  }

  properties: Array<Property> = [];
  selectedInfoRow : Property = new Property;

  ngOnInit(): void {
    this.propertyForm = this.createFormObject();
    this.isLoading = true;
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    if (this.id > 0) {
      this.pageType = 'edit';
      this.getById(this.id);
    }
    else {
      this.titleInfo = 'Register New Property';
      this.pageType = 'new';
      this.loadData();
    }
   
  }

 

  
  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  private loadData(){
    forkJoin(
      this.getUnits(),
      this.getStatuses()
    ).subscribe(res =>{
      this.setForkJoinValues(res);
      this.isLoading = false;
      this.cdr.detectChanges();
    })
  }

  private getStatuses(): Observable<any> {
    return this.service.getStatuses();
  }

  getById(id:number){
    this.isLoading = true ;
    forkJoin(
      this.getProperty(id),
      this.getUnits()
    ).subscribe(res =>{
      this.setForkJoinValuesInEditMode(res)
      this.isLoading = false;
      this.cdr.detectChanges()
    })
  }

  setForkJoinValuesInEditMode(values : Array<any>){
    this.propertyInfo = values[0].data;
    this.unitData = values[1].data;
    this.titleInfo = this.propertyInfo.propertyName;
    this.values = this.propertyInfo.controlTypeId === 1000371 ? this.propertyInfo.propertyValue : [];
    // this.propertyInfo.propertyValue.forEach(items =>{
    //   this.filteredItemsCount = items.status;
    // })
    console.log(this.filteredItemsCount);
    document.getElementById("lblNewVal").innerHTML = this.propertyInfo.propertyValue[0].value;
    this.setValues();
    this.cdr.detectChanges()
  }

  setForkJoinValues(values : Array<any>){
    this.unitData = values[0].data;
    this.statuses = values[1].data;
    this.defaultStatuses = [];
    this.statuses.forEach((element) => {
      if (element.isDefault === 1) this.defaultStatuses.push(element.statusId);
    });
  }

 

  checkUncheckAll() {
    for (var i = 0; i < this.values.length; i++) {
      this.values[i].status = this.values[i].status ? 1 : 0;
      this.values[i].status = this.isMasterSel ? 1 : 0;
    }
    this.getCheckedItemList();
  }


  getCheckedItemList() {
    this.checkedValues = [];
    for (var i = 0; i < this.values.length; i++) {
      this.values[i].status = this.values[i].status ? 1 : 0;
      if (this.values[i].status == 1)
        this.checkedValues.push(this.values[i]);

    }
    this.checkedValues = JSON.stringify(this.checkedValues);
  }

 

  isAllSelected() {
    this.isMasterSel = this.values.every(function (item: any) {
      return item.status == 1;
    })
    this.getCheckedItemList();
  }

  selectAllIsChecked(): boolean{
    if (this.propertyInfo.propertyValue.length  > 0 &&
      this.propertyInfo.propertyValue.length  === this.filteredItemsCount)
      return true;
      else
      return false;
  }

  selectAllIsIndeterminate() : boolean{
    if(this.propertyInfo.propertyValue.length > 0 && this.propertyInfo.propertyValue.length < this.filteredItemsCount 
      && this.filteredItemsCount> 0)
      return true;
    else
      return false;
  }


  createFormObject() : FormGroup {
    return this._formBuilder.group({
         name  : [this.propertyInfo.propertyName],
         unit  : [this.propertyInfo.unitId],
         usages: [this.propertyInfo.usages],
         controlTypeId : [this.propertyInfo.controlTypeId],
         status : [this.propertyInfo.status],
         propertyValue : [this.propertyInfo.propertyValue],
         newValue : null
    })
  }

  private showAlert(name: string): void {
    this._fuseAlertService.show(name);
  }

  private dismissAlert(name: string): void {
    this._fuseAlertService.dismiss(name);
  }

  private getProperty(id:number) : Observable <any>{
    return this.service.getProperty(id);
  }
  private getUnits():Observable<any>{
    return this.service.getUnits();
  }


  setValues(){
    this.propertyForm.controls['name'].setValue(this.propertyInfo.propertyName);
    this.propertyForm.controls['unit'].setValue(this.propertyInfo.unitId);
    this.propertyForm.controls['usages'].setValue(this.propertyInfo.usages);
    this.propertyForm.controls['status'].setValue(this.propertyInfo.status);
    this.propertyForm.controls['controlTypeId'].setValue(this.propertyInfo.controlTypeId);
    this.propertyForm.controls['propertyValue'].setValue(this.propertyInfo.propertyValue)
  }

  save(){
    let formResult : boolean;
    formResult = this.checkFormValidity();
    if (!formResult) {
      this.showAlert('errorMessage');
      this.cdr.detectChanges();
      return;
    }
    this.isLoading = true;
    this.getValues();
    if (this.pageType === 'new')
      this.createProperty();
    else
      this.editProperty();
  }

  private createProperty(){
    this.dismissAlert('successMessage');
    this.dismissAlert('errorMessage');
    this.service.createProperty(this.propertyInfo).subscribe(res => {
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

  private editProperty() {
      this.service.editProperty(this.propertyInfo).subscribe(res => {
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
  

  private getValues(){
    this.propertyInfo.propertyName = this.propertyForm.controls['name'].value;
    this.propertyInfo.unitId = this.propertyForm.controls['unit'].value;
    this.propertyInfo.usages = this.propertyForm.controls['usages'].value;
    this.propertyInfo.status = this.propertyForm.controls['status'].value;
    this.propertyInfo.controlTypeId = this.propertyForm.controls['controlTypeId'].value;
    this.propertyInfo.propertyValue = [];
    this.propertyForm.controls['controlTypeId'].value !== 1000372 ?
        this.propertyInfo.propertyValue = this.values :
        this.propertyInfo.propertyValue.push({ key: 0, value: this.propertyForm.controls['newValue'].value, status: this.propertyForm.controls['status'].value === true ? 1 : 0 });
    
  }

  private checkFormValidity(): boolean {

    const controls = this.propertyForm.controls;
    for (const name in controls) {
      if (controls[name].invalid) {
        this._result.succeed = false;
        this._result.message = "There is atleast one unfilled element! Please fill all the elements in the all tabs";
        return false;
      }
    }

    if (this.selectedDep === null) {
      this._result.succeed = false;
      this._result.message = "There is atleast one unfilled element! Please fill all the elements in the all tabs";
      return false;
    }

    if (this.pageType === 'new' &&  this.propertyForm.controls['propertyValue'].value === ""
    ) {
      this._result.succeed = false;
      this._result.message = "There is atleast one unfilled element! Please fill all the elements in the all tabs";
      return false;
    }




    return true;
  }

  addNewVal(value: string) {
    if ((<HTMLInputElement>document.getElementById("inNewVal")).value.length < 1) {
      this.propertyForm.controls['newValue'].markAsTouched();
      return;
    }
    var result = this.values.filter(f => f.value.replace(/\s/g, "").toUpperCase() == value.replace(/\s/g, "").toUpperCase())
    if (result.length > 0 && result[0].status == 1) {
      document.getElementById("lblAddErr").innerHTML = "The value is already added!";
      return;
    }
    else if (result.length > 0 && result[0].status == 0) {
      document.getElementById("lblAddErr").innerHTML = "The value is already added. Just activation is needed!";
      return;
    }

    this.values.push({ key: 0, value: value, status: 1 });
    this.getCheckedItemList();
    (<HTMLInputElement>document.getElementById("inNewVal")).value = "";
    document.getElementById("lblAddErr").innerHTML = "";
  }

  remove(value : string){
    for (var i = 0; i < this.values.length; i++) {

      if (this.values[i].value === value)
          this.values.splice(i, 1);
        else {
        }
    }
  }
  

}
