import { ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { Location } from "@angular/common";
import { FuseAlertService } from "@fuse/components/alert";
import { OpResult } from "app/core/type/result/result.types";
import { forkJoin, Observable, Subject } from "rxjs";
import { Personnel } from "../personnel.types";
import { PersonnelService } from "../personnel.service";

@Component({
  selector: "app-personnel-details",
  templateUrl: "./details.component.html",
})
export class PersonnelDetailsComponent implements OnInit, OnDestroy {
  titleInfo: string;
  pageType: string;
  isLoading = false;
  personnel = new Personnel();
  formpersonnel: FormGroup;
  result = new OpResult();
  private _unsubscribeAll: Subject<any>;

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private fb: FormBuilder,
    private service: PersonnelService,
    private cdr: ChangeDetectorRef,
    private fuseAlertService: FuseAlertService
  ) {
    this.personnel = new Personnel();
    this._unsubscribeAll = new Subject();
  }

  ngOnInit(): void {
    this.formpersonnel = this.createFormObj();
    const id = Number(this.route.snapshot.paramMap.get("id"));

    if (id > 0) {
      this.pageType = "edit";
      this.getById(id);
      console.log("before");
    } else {
      this.titleInfo = "Register New Personnel";
      this.pageType = "new";
    }
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  private getById(id: number): void {
    this.isLoading = false;
    forkJoin(this.getpersonnel(id)).subscribe((res) => {
      this.setForkJoinValuesInEditMode(res);
      this.isLoading = false;
      this.setFormValues();
      this.cdr.detectChanges();
      // console.log(this.personnel);
    });
  }

  private setForkJoinValuesInEditMode(values: any[]) {
    this.personnel = values[0].data;
    console.log(this.personnel);
    this.titleInfo = this.personnel.personnelFamily;
  }

  private getpersonnel(id: number): Observable<any> {
    return this.service.getpersonnel(id);
  }

  private setFormValues(): void {
    // this.formpersonnel.controls["code"].setValue(this.personnel.personnelNo);
    // this.formpersonnel.controls["firstName"].setValue(
    //   this.personnel.personnelName
    // );
    // this.formpersonnel.controls["lastName"].setValue(
    //   this.personnel.personnelFamily
    // );
    // this.formpersonnel.controls["status"].setValue(this.personnel.status);
    // this.formpersonnel.controls["gender"].setValue(this.personnel.genderId);
    // this.formpersonnel.controls["nationalId"].setValue(this.personnel.nationalId);
    this.formpersonnel.patchValue({
      code: this.personnel.personnelNo,
      firstName: this.personnel.personnelName,
      lastName: this.personnel.personnelFamily,
      status: this.personnel.status,
      gender: this.personnel.genderId,
      nationalId: this.personnel.nationalId,
    });
  }

  public save(): void {
    this.getFormInfo();
    if (this.pageType === "new") {
      console.log(this.personnel.personnelNo);
      this.create();
    } else if (this.pageType === "edit") {
      this.edit();
    }
  }

  private create(): void {
    this.service.create(this.personnel).subscribe((res) => {
      this.isLoading = false;
      this.result.succeed = res.succeed;
      this.result.message = res.message;
      if (this.result.succeed) {
        this.showAlert("successMessage");
        //this.location.back();
      } else this.showAlert("errorMessage");
      this.cdr.detectChanges();
    });
  }

  private edit(): void {
    this.service.edit(this.personnel).subscribe((res) => {
      this.isLoading = false;
      this.result.succeed = res.succeed;
      this.result.message = res.message;
      if (this.result.succeed) {
        this.showAlert("successMessage");
        //this.location.back();
      } else this.showAlert("errorMessage");
      this.cdr.detectChanges();
    });
  }

  private getFormInfo(): void {
    // this.personnel.personnelNo = this.formpersonnel.controls["code"].value;
    this.personnel.personnelName =
      this.formpersonnel.controls["firstName"].value.trim();
    this.personnel.personnelFamily =
      this.formpersonnel.controls["lastName"].value.trim();
    this.personnel.status = this.formpersonnel.controls["status"].value;
    this.personnel.genderId = this.formpersonnel.controls["gender"].value;
    this.personnel.nationalId =
      this.formpersonnel.controls["nationalId"].value.trim();
  }

  private createFormObj(): FormGroup {
    return this.fb.group({
      code: { value: "", disabled: true },
      firstName: ["", [Validators.required]],
      lastName: ["", Validators.required],
      status: ["", Validators.required],
      gender: ["", Validators.required],
      nationalId: ["", [Validators.required, nationalIDValidator]],
    });
  }

  private showAlert(name: string): void {
    this.fuseAlertService.show(name);
  }

  private dismissAlert(name: string): void {
    this.fuseAlertService.dismiss(name);
  }

  public myError(controlName: string, errorName: string) {
    return this.formpersonnel.controls[controlName].hasError(errorName);
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
