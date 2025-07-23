import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { fuseAnimations } from "../../../../../@fuse/animations";
import { FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { animate, state, style, transition, trigger } from "@angular/animations";
import { WarehouseService } from "../warehouse.service";
import { FuseAlertService } from '@fuse/components/alert';
import { Observable, Subject, forkJoin } from 'rxjs';
import { Warehouse } from '../warehouse.types';
import { OpResult } from 'app/core/type/result/result.types';
import { ActivatedRoute } from '@angular/router';
import { MatMenuTrigger } from '@angular/material/menu';
import { GroupDropdown } from 'app/core/type/group-dropwdown/GroupDropdown';
import { HierarchicalKeyValue, KeyValue } from 'app/core/type/key-value/key-value.type';
import { Units } from 'app/modules/configuration/measurement/unit/unit.types';

@Component({
  selector: 'warehouse-details',
  templateUrl: './details.component.html',
  animations: [fuseAnimations, trigger('detailExpand', [
    state('collapsed', style({ height: '0px', minHeight: '0' })),
    state('expanded', style({ height: '*' })),
    transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
  ]),
  ],
  styles: [
    /* language=SCSS */
  ],
  encapsulation: ViewEncapsulation.None
})

export class WarehouseDetailsComponent implements OnInit, OnDestroy {
  materials = [];
  titleInfo: string;
  id: number;
  warehouseInfo: Warehouse = new Warehouse();
  _result: OpResult = new OpResult();
  pageType: string;
  warehouseTypes: Array<KeyValue>;
  dimUnitData: Array<Units>;
  massUnitData: Array<Units>;
  private _unsubscribeAll: Subject<any>;
  isLoading: boolean = false;
  warehouseForm: FormGroup;
  owners: Array<GroupDropdown> = [];
  branches: Array<{ key: number, value: string }> = [];
  departments: Array<{ key: number, value: string }> = [];
  selectedOrg: number;
  selectedBranch: number;
  selectedDep: number;
  selectedDepName: string;
  ownerControl = new FormControl();
  statuses = [];
  disableBranchAndDepartment: boolean = true;
  ownerType: string;
  DepArray: any = [];
  public applyProgressBar: boolean;
  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
  constructor(
    private service: WarehouseService,
    private _formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private _fuseAlertService: FuseAlertService
  ) {
    this.owners = new Array<GroupDropdown>();
    this.warehouseInfo = new Warehouse;
    this._unsubscribeAll = new Subject();
    this.massUnitData = new Array<Units>();
    this.dimUnitData = new Array<Units>();
    // Set the default

  }

  /**
   * On init
   */
  ngOnInit(): void {
    this.warehouseForm = this.createFormObject();
    this.isLoading = true;
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    if (this.id > 0) {
      this.pageType = 'edit';
      this.getById(this.id);
    }
    else {
      this.titleInfo = 'Register New Warehouse';
      this.pageType = 'new';
      this.loadData();
    }
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
      this.getUnits(),
      this.getWarehouseTypes(),
      this.getowners(),
      this.getDepartmentTree(),
      this.getStatuses(),
    ).subscribe(res => {
      this.setForkJoinValues(res);
      this.isLoading = false;
      this.cdr.detectChanges();
    });

  }

  private getById(id: number) {
    this.isLoading = true;
    forkJoin(
      this.getWarehouse(id),
      this.getUnits(),
      this.getWarehouseTypes(),
      this.getowners(),
      this.getDepartmentTree(),
      this.getStatuses(),
    ).subscribe(res => {
      this.setForkJoinValuesInEditMode(res);
      this.isLoading = false;
      this.cdr.detectChanges();
    });

  }


  private setForkJoinValues(values: Array<any>): void {
    this.dimUnitData = values[0].data.filter(x => x.unitType === 1);
    this.massUnitData = values[0].data.filter(x => x.unitType === 2);
    this.warehouseTypes = values[1].data;
    this.owners = values[2].data;
    this.DepArray = values[3].data;
    this.statuses = values[4].data;
    this.addSelectanItemToDepMenuAd();
    this.cdr.detectChanges();
  }

  private setForkJoinValuesInEditMode(values: Array<any>): void {
    this.warehouseInfo = values[0].data;
    this.titleInfo = this.warehouseInfo.warehouseName;
    this.dimUnitData = values[1].data.filter(x => x.unitType === 1);
    this.massUnitData = values[1].data.filter(x => x.unitType === 2);
    this.warehouseTypes = values[2].data;
    this.owners = values[3].data;
    this.DepArray = values[4].data;
    this.statuses = values[5].data;
    this.addSelectanItemToDepMenuAd();
    this.setValues();
    this.cdr.detectChanges();
  }



  createFormObject(): FormGroup {

    return this._formBuilder.group({
      name: [this.warehouseInfo.warehouseName],
      code: [this.warehouseInfo.warehouseCode],
      selOwner: [this.warehouseInfo.ownerId],
      selBranch: [this.warehouseInfo.branchId],
      selDepartment: [this.warehouseInfo.departmentId],
      length: [this.warehouseInfo.warehouseLength],
      width: [this.warehouseInfo.warehouseWidth],
      height: [this.warehouseInfo.warehouseHeight],
      weight: [this.warehouseInfo.weightCapacity],
      weightUnit: [this.warehouseInfo.weightUnitId],
      dimensionUnit: [this.warehouseInfo.dimensionsUnitId],
      status: [this.warehouseInfo.status],
      selWarehouseType: [this.warehouseInfo.warehouseTypeId],
    });
  }

  private getStatuses(): Observable<any> {
    return this.service.getStatuses();
  }
  private getUnits(): Observable<any> {
    return this.service.getUnits();
  }

  private getWarehouse(id: number): Observable<any> {
    return this.service.getWarehouse(id);
  }

  private getDepartmentTree(): Observable<any> {
    return this.service.getWarehouseDepTree();
  }



  private getWarehouseTypes(): Observable<any> {
    return this.service.getDrpWarehouseType();
  }

  private getowners(): Observable<any> {
    return this.service.getOwner();
  }

  getDepartments(orgId: number, branchId: number) {
    this.service.getDrpDepartment(orgId, branchId).subscribe(res => {
      this.departments = res.data;
    })
  }

  getBranches(orgId: number) {
    this.service.getDrpBranch(orgId).subscribe(res => {
      this.branches = res.data;
    })
  }



  private showAlert(name: string): void {
    this._fuseAlertService.show(name);
  }
  private dismissAlert(name: string): void {
    this._fuseAlertService.dismiss(name);
  }

  private addSelectanItemToDepMenuAd() {
    let obj = new HierarchicalKeyValue();
    obj.id = 0;

    if (this.pageType === 'new' || (this.pageType === 'edit' && (this.warehouseInfo.departmentName === ''
      || this.warehouseInfo.departmentName === null
      || this.warehouseInfo.departmentName === undefined))) {
      obj.item = "Select Supervising Department";
      this.selectedDep = 0;
    }
    else if (this.pageType === 'edit' &&
      (this.warehouseInfo.departmentName !== ''
        || this.warehouseInfo.departmentName !== null)) {
      obj.item = this.warehouseInfo.departmentName;
      this.selectedDep = this.warehouseInfo.departmentId;
    }

    obj.parentId = -1;
    obj.children = [];
    for (var i = 0; i < this.DepArray.length; i++) {
      obj.children.push(this.DepArray[i]);
    }
    this.DepArray = [];
    this.DepArray.push(obj);
  }

  getProOrgValue(event: {
    isUserInput: any;
    source: { value: any; selected: any; group: any };
  }) {
    if (event.isUserInput) {
      this.ownerType = event.source.group.label;
      if (event.source.group.label === "Organizations") {
        this.disableBranchAndDepartment = false;
      }
      else {
        this.disableBranchAndDepartment = true;
        this.warehouseForm.controls['selBranch'].setValue('');
        this.warehouseForm.controls['selDepartment'].setValue('');
      }
      this.selectedOrg = event.source.value;
      this.branches = [];
      this.departments = [];
      this.selectedBranch = null;
      this.getBranches(this.selectedOrg);
    }

  }

  private setValues() {
    this.warehouseForm.controls['selOwner'].setValue(this.warehouseInfo.ownerId);
    this.warehouseForm.controls['selBranch'].setValue(this.warehouseInfo.branchName);
    this.warehouseForm.controls['code'].setValue(this.warehouseInfo.warehouseCode);
    this.warehouseForm.controls['name'].setValue(this.warehouseInfo.warehouseName);
    this.warehouseForm.controls['length'].setValue(this.warehouseInfo.warehouseLength);
    this.warehouseForm.controls['width'].setValue(this.warehouseInfo.warehouseWidth);
    this.warehouseForm.controls['height'].setValue(this.warehouseInfo.warehouseHeight);
    this.warehouseForm.controls['dimensionUnit'].setValue(this.warehouseInfo.dimensionsUnitId);
    this.warehouseForm.controls['weight'].setValue(this.warehouseInfo.weightCapacity);
    this.warehouseForm.controls['weightUnit'].setValue(this.warehouseInfo.weightUnitId);
    this.warehouseForm.controls['status'].setValue(this.warehouseInfo.status);
    this.warehouseForm.controls['selWarehouseType'].setValue(this.warehouseInfo.warehouseTypeId);
    this.selectedDepName = this.warehouseInfo.departmentName;
    this.selectedDep = this.warehouseInfo.departmentId;

  }

  private getValues() {
    this.warehouseInfo.ownerId = this.warehouseForm.controls['selOwner'].value;
    if (this.ownerType === 'Organization') {
      this.warehouseInfo.branchId = this.warehouseForm.controls['selBranch'].value;
    }
    else {
      this.warehouseInfo.branchId = 0;
    }

    this.warehouseInfo.departmentId = this.selectedDep;
    this.warehouseInfo.warehouseCode = this.warehouseForm.controls['code'].value;
    this.warehouseInfo.warehouseName = this.warehouseForm.controls['name'].value;
    this.warehouseInfo.warehouseLength = this.warehouseForm.controls['length'].value;
    this.warehouseInfo.warehouseWidth = this.warehouseForm.controls['width'].value;
    this.warehouseInfo.warehouseHeight = this.warehouseForm.controls['height'].value;
    this.warehouseInfo.dimensionsUnitId = this.warehouseForm.controls['dimensionUnit'].value;
    this.warehouseInfo.weightCapacity = this.warehouseForm.controls['weight'].value;
    this.warehouseInfo.weightUnitId = this.warehouseForm.controls['weightUnit'].value;
    this.warehouseInfo.status = this.warehouseForm.controls['status'].value;
    this.warehouseInfo.warehouseTypeId = this.warehouseForm.controls['selWarehouseType'].value;
  }



  changeBranch(event: {
    isUserInput: any;
    source: { value: any; selected: any };
  }) {

    if (event.isUserInput) {
      // this.changeOrgDrp();
      this.selectedBranch = event.source.value;
      this.departments = [];
    }

  }

  public setSelectedDep(selectedId: number) {

    this.selectedDep = selectedId;
    if (selectedId > 0)
      this.trigger.closeMenu();
  }


  resetMessageBoxes() {
    this._result.message = null;
    this._result.succeed = false;
  }

  private checkChildrenDepIsSelected(children: Array<any>, id: number, isPathSelected: boolean): boolean {
    let pathIsSelected: boolean;
    children.forEach(element => {
      if (element.id === this.selectedDep)
        pathIsSelected = true;

      if (pathIsSelected && element.id === id)
        return true;
      else {
        return this.checkChildrenDepIsSelected(element.children, id, pathIsSelected);
      }
    });
    return false;
  }

  public checkDepIsSelected(depId: number): boolean {
    let result: boolean;
    this.DepArray[0].children.forEach(element => {
      result = this.checkChildrenDepIsSelected(element.children, depId, false);
      if (result)
        return result;
    });
    return false;
  }

  private checkFormValidity(): boolean {

    const controls = this.warehouseForm.controls;
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

    if (this.pageType === 'new' && this.ownerType === 'Organization' &&
      this.warehouseForm.controls['selBranch'].value === ""
    ) {
      this._result.succeed = false;
      this._result.message = "There is atleast one unfilled element! Please fill all the elements in the all tabs";
      return false;
    }




    return true;
  }





  save() {
    let formResult: boolean;
    formResult = this.checkFormValidity();
    if (!formResult) {
      this.showAlert('errorMessage');
      this.cdr.detectChanges();
      return;
    }
    this.isLoading = true;
    this.getValues();
    if (this.pageType === 'new')
      this.createWarehous();
    else
      this.editWarehouse();
  }

  private createWarehous() {
    this.dismissAlert('successMessage');
    this.dismissAlert('errorMessage');
    this.service.createWarehouse(this.warehouseInfo).subscribe(res => {
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

  private editWarehouse() {
    this.service.editWarehouse(this.warehouseInfo).subscribe(res => {
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


}





