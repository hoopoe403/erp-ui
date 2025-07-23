import { ChangeDetectorRef, Component, Inject, OnInit, ViewEncapsulation } from "@angular/core";
import { BrandService } from "../brand.service"; 
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Product } from "../../product/product.types";
import { FormBuilder, FormGroup } from "@angular/forms";
import { OpResult } from "app/core/type/result/result.types";
import { FuseAlertService } from "@fuse/components/alert";

@Component({
    selector: 'fuse-confirmation-dialog',
    templateUrl: './dialog.cimponent.html',
    encapsulation: ViewEncapsulation.None
})

export class BrandDialogComponent implements OnInit {
    product: Product = new Product();
    productForm: FormGroup;
    isLoading: boolean;
    pageType : string = ''
    _result: OpResult = new OpResult();
    constructor(private service: BrandService,
        private _formBuilder: FormBuilder,
        @Inject(MAT_DIALOG_DATA) public _data: any,
        public matDialogRef: MatDialogRef<BrandDialogComponent>,
        private _fuseAlertService: FuseAlertService,
        private cdr: ChangeDetectorRef,
    ) {
        if (this._data) {
            if (this._data.parentId) this.product.parentID = this._data.parentId;
            if (this._data) this.product = this._data;
        }
        this.productForm = this.createCategoryForm();
    }

    ngOnInit(): void {
        if (this.product.productId > 0)
            this.service.getProduct(this.product.productId).subscribe(res => {
                this.product = res.data;
                this.pageType = 'edit'
                this.isLoading = false;
            })
        else
            this.pageType = 'new'
            this.isLoading = false;
    }

    private showAlert(name: string): void {
        this._fuseAlertService.show(name);
    }

    private dismissAlert(name: string): void {
        this._fuseAlertService.dismiss(name);
    }

    createCategoryForm(): FormGroup {
        return this._formBuilder.group({
            id: [this.product.productId],
            parentID: [this.product.parentID],
            brandId: [this.product.brandId],
            name: [this.product.productName],
            code: [this.product.productCode],
            active: [this.product.status],
            depotCount: [this.product.depotCount],
            approximateDelivery: [this.product.approximateDelivery],
        });
    }


    private checkFormValidity(): boolean {

        const controls = this.productForm.controls;
        for (const name in controls) {
          if (controls[name].invalid) {
            this._result.succeed = false;
            this._result.message = "There is atleast one unfilled element! Please fill all the elements in the all tabs";
            return false;
          }
        }
        return true;
      }

      resetMessageBoxes() {
        this._result.message = null;
        this._result.succeed = false;
      }


      private getValues(){
        this.product.brandId = this._data.brandId;
        this.product.parentID = this._data.parentID;
        this.product.productName = this.productForm.get('name').value;
        this.product.productCode = this.productForm.get('code').value;
        this.product.status = this.productForm.get('active').value ? 1 : 0;
        this.product.depotCount = this.productForm.get('depotCount').value;
        this.product.approximateDelivery = this.productForm.get('approximateDelivery').value;
      }

      save(){
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
            this.createBrand();
          else
            this.editProduct();
      }

      private createBrand() {
        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');
        this.service.createProduct(this.product).subscribe(res => {
          this.isLoading = false;
          this._result.succeed = res.succeed;
          this._result.message = res.message;
          if (this._result.succeed){
            this.showAlert('successMessage');
            this.matDialogRef.afterClosed().subscribe(saved => {
                  if (saved) {
                      this.service.getBrand(this.product.brandId).subscribe(res => {
                          //  BrandComponent. = res.data;
                      })
                  }
            });
          }
          else
            this.showAlert('errorMessage');
            this.cdr.detectChanges();
        });
      }
    
      private editProduct() {
        this.service.editProduct(this.product).subscribe(res => {
          this.isLoading = false;
          this._result.succeed = res.succeed;
          this._result.message = res.message;
          if (this._result.succeed){
            this.showAlert('successMessage');
            this.matDialogRef.afterClosed().subscribe(saved => {
                  if (saved) {
                      this.service.getBrand(this.product.brandId).subscribe(res => {
                          //  BrandComponent. = res.data;
                      })
                  }
            });
          }
          else
            this.showAlert('errorMessage');
            this.cdr.detectChanges();
        });
      }

}