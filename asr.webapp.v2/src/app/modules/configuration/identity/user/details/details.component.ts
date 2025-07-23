import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { fuseAnimations } from "../../../../../../@fuse/animations";
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from "@angular/forms";
import { animate, state, style, transition, trigger } from "@angular/animations";
import { UserService } from "../user.service";
import { FuseAlertService } from '@fuse/components/alert';
import { Observable, Subject, Subscription, forkJoin, fromEvent } from 'rxjs';
import { User } from '../user.types';
import { OpResult } from 'app/core/type/result/result.types';
import { ActivatedRoute } from '@angular/router';
import { MatMenuTrigger } from '@angular/material/menu';
import { Access, Menu } from '../../identity.types';
import { Role } from '../../role/role.types';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { DialogService } from '../dialog/dialog.service';
import { OverlayRef } from '@angular/cdk/overlay';
import { UserColumn, ViewColumn } from 'app/core/type/column/user-column.type';
import { ColumnDialogConfig } from '../dialog/dialog.types';
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
        .role-grid {
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
        .menu-grid {
            grid-template-columns:  75px 100px 200px  300px 40px auto;

            @screen sm {
                grid-template-columns: 48px auto 112px 72px;
            }

            @screen md {
                grid-template-columns:  50px 30px auto  50px 50px ;
            }

            @screen lg {
                grid-template-columns: 75px 100px 200px  300px 40px auto;
            }
        }
        .access-grid {
            grid-template-columns: 75px auto;

            @screen sm {
                grid-template-columns: 48px auto 112px 72px;
            }

            @screen md {
                grid-template-columns:  50px 30px auto  50px 50px ;
            }

            @screen lg {
                grid-template-columns: 75px auto   ;
            }
        }
        .menu-preview-grid {
            grid-template-columns: 100px 300px  auto 250px;

            @screen sm {
                grid-template-columns: 48px auto 112px 72px;
            }

            @screen md {
                grid-template-columns:  50px 30px auto  50px 50px ;
            }

            @screen lg {
                grid-template-columns:   300px  auto 250px;
            }
        }
        .access-preview-grid {
            grid-template-columns: auto 250px;

            @screen sm {
                grid-template-columns: 48px auto 112px 72px;
            }

            @screen md {
                grid-template-columns:  50px 30px auto  50px 50px ;
            }

            @screen lg {
                grid-template-columns:   auto 250px;
            }
        }
        `
    ],
    encapsulation: ViewEncapsulation.None
})

export class UserDetailsComponent implements OnInit, OnDestroy {
    sub: Subscription;
    overlayRef: OverlayRef | null;
    public titleInfo: string;
    public userInfo: User = new User();
    public filteredMenus: Array<Menu>;
    public filteredAccess: Array<Access>;
    public filteredRoles: Array<Role>;
    public menus: Array<Menu>;
    public access: Array<Access>;
    public roles: Array<Role>;
    public _result: OpResult = new OpResult();
    public pageType: string;
    public isLoading: boolean = false;
    public isRoleLoading: boolean = false;
    public frmUser: FormGroup;
    private id: number;
    private _unsubscribeAll: Subject<any>;
    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
    @ViewChild('roleFilter', { static: true }) roleFilter: ElementRef;
    @ViewChild('menuFilter', { static: true }) menuFilter: ElementRef;
    @ViewChild('accessFilter', { static: true }) accessFilter: ElementRef;
    constructor(
        private service: UserService,
        private _formBuilder: FormBuilder,
        private cdr: ChangeDetectorRef,
        private route: ActivatedRoute,
        private _dialogService: DialogService,
        private _fuseAlertService: FuseAlertService
    ) {
        this._unsubscribeAll = new Subject();
        this.roles = [];
        this.menus = [];
        this.access = [];
        this.userInfo.accessIdList = [];
        this.userInfo.roleIdList = [];
        this.userInfo.menuIdList = [];
        this.userInfo.viewColumnList = new Array<ViewColumn>();
        // Set the default

    }

    /**
     * On init
     */
    ngOnInit(): void {

        this.frmUser = this.createFormObject();
        this.isLoading = true;
        this.bindFilters();
        this.id = Number(this.route.snapshot.paramMap.get('id'));
        if (this.id > 0) {
            this.pageType = 'edit';
            this.getById(this.id);

        }
        else {
            this.titleInfo = 'Register New User';
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
            this.getMenus(),
            this.getRoles(),
            this.getAccess(),
        ).subscribe(res => {
            this.setForkJoinValues(res);
            this.isLoading = false;
            this.cdr.detectChanges();
        });

    }
    private getById(id: number) {
        this.isLoading = true;

        forkJoin(
            this.getUser(id),
            this.getMenus(),
            this.getRoles(),
            this.getAccess(),
        ).subscribe(res => {
            this.setForkJoinValuesInEditMode(res);
            this.isLoading = false;
            this.setFormValues();
            this.cdr.detectChanges();
        });

    }



    private getUser(id: number): Observable<any> {
        return this.service.getUser(id);
        /* .subscribe(res => {
            this.goodsInfo = res.data;
        }); */
    }

    private setForkJoinValues(values: Array<any>): void {
        this.menus = this.filteredMenus = values[0].data;
        this.roles = this.filteredRoles = values[1].data;
        this.access = this.filteredAccess = values[2].data;
        this.getUserColumn();
    }

    private setForkJoinValuesInEditMode(values: Array<any>): void {
        this.userInfo = values[0].data;
        this.menus = this.filteredMenus = values[1].data;
        this.roles = this.filteredRoles = values[2].data;
        this.access = this.filteredAccess = values[3].data;
        this.titleInfo = this.userInfo.firstName.concat(' ').concat(this.userInfo.lastName);
        this.userInfo.password = "!123456B!b";
        for (let index = 0; index < this.userInfo.menuIdList.length; index++) {
            this.setMenuAssignementTypeAndRoleName(this.userInfo.menuIdList[index], 'Direct', '');
        }
        for (let index = 0; index < this.userInfo.accessIdList.length; index++) {
            this.setAccessAssignementTypeAndRoleName(this.userInfo.accessIdList[index], 'Direct', '');
        }
        for (let index = 0; index < this.userInfo.roleIdList.length; index++) {
            this.getRoleInfo(this.userInfo.roleIdList[index], 'add');
        }
        this.getUserColumn();

    }

    private createFormObject(): FormGroup {

        return this._formBuilder.group({
            number: [{ value: '', disabled: true }, Validators.required],
            username: [{ value: '', disabled: false }, Validators.required],
            password: [null, Validators.compose([
                // 1. Password Field is Required
                Validators.required,
                // 2. check whether the entered password has a number
                UserDetailsComponent.patternValidator(/\d/, { hasNumber: true }),
                // 3. check whether the entered password has upper case letter
                UserDetailsComponent.patternValidator(/[A-Z]/, { hasCapitalCase: true }),
                // 4. check whether the entered password has a lower-case letter
                UserDetailsComponent.patternValidator(/[a-z]/, { hasSmallCase: true }),
                UserDetailsComponent.patternValidator(
                    /[ !@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
                    {
                        hasSpecialCharacters: true
                    }
                ),
                Validators.minLength(8)])
            ],
            confirmPassword: [null, Validators.compose([Validators.required])],
            firstName: [{ value: '', disabled: false }, Validators.required],
            lastName: [{ value: '', disabled: false }, Validators.required],
            email: [null, Validators.compose([
                Validators.email,
                Validators.required])
            ],
            status: [{ value: '', disabled: false }, Validators.required],

        },
            {
                validator: UserDetailsComponent.passwordMatchValidator
            }
        );
    }


    private getRoles(): Observable<any> {
        return this.service.getRoles();
    }

    private getAccess(): Observable<any> {
        return this.service.getAccess();
    }
    private getMenus(): Observable<any> {
        return this.service.getMenus();
    }



    private showAlert(name: string): void {
        this._fuseAlertService.show(name);
    }

    private dismissAlert(name: string): void {
        this._fuseAlertService.dismiss(name);
    }
    private getUserColumn() {
        let obj: UserColumn = new UserColumn();

        obj.userId = this.userInfo.userId;
        this.menus.forEach(element => {
            const indx = this.menus.findIndex(x => x.id == element.id);
            if (element.viewId && element.viewId != 0 && this.pageType == 'edit') {
                obj.viewId = element.viewId;
                this.service.getViewColumns(obj).subscribe(res => {
                    this.menus[indx].columns = res.data.filter(x => x.checked && x.presentable == 1).map(item => item.applicationName).join(', ');
                    console.log(this.menus[indx].columns);
                    this.isLoading = false;
                    this.cdr.detectChanges();
                });
            }
            else if (element.viewId && element.viewId != 0 && this.pageType == 'new')
                this.menus[indx].columns = '';
            else
                this.menus[indx].columns = 'Not Implemented';
            this.cdr.detectChanges();
        });


    }
    private setFormValues() {


        this.frmUser.controls["number"].setValue(this.userInfo.userNumber);
        this.frmUser.controls["username"].setValue(this.userInfo.username);
        this.frmUser.controls["firstName"].setValue(this.userInfo.firstName);
        this.frmUser.controls["lastName"].setValue(this.userInfo.lastName);
        this.frmUser.controls["password"].setValue(this.userInfo.password);
        this.frmUser.controls["confirmPassword"].setValue(this.userInfo.password);
        this.frmUser.controls["email"].setValue(this.userInfo.email);
        this.frmUser.controls["status"].setValue(this.userInfo.status);

    }
    private getFormInfo(): boolean {
        let finalResult: boolean = true;

        this.userInfo.username = this.frmUser.controls["username"].value;
        this.userInfo.firstName = this.frmUser.controls["firstName"].value;
        this.userInfo.lastName = this.frmUser.controls["lastName"].value;
        this.userInfo.password = this.frmUser.controls["password"].value;
        this.userInfo.email = this.frmUser.controls["email"].value;
        this.userInfo.status = this.frmUser.controls["status"].value;
        this.userInfo.menuIdList = this.menus.filter(x => x.assignmentType == 'Direct').map(function (obj) {
            return obj.id;
        });
        this.userInfo.accessIdList = this.access.filter(x => x.assignmentType == 'Direct').map(function (obj) {
            return obj.accessId;
        });

        if (this.pageType == 'new' && this.userInfo.password == '!123456B!b') {
            finalResult = this._result.succeed = false;
            this._result.message = 'Defualt password can not be entered';
        }
        else if (this.pageType == 'edit' && this.userInfo.password == '!123456B!b') {
            this.userInfo.password = '';
        }
        return finalResult;
    }

    save() {
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

        this.service.create(this.userInfo).subscribe(res => {
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

        this.service.edit(this.userInfo).subscribe(res => {
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
    static patternValidator(regex: RegExp, error: ValidationErrors): ValidatorFn {
        return (control: AbstractControl): { [key: string]: any } => {
            if (!control.value) {
                // if control is empty return no error
                return null;
            }

            // test the value of the control against the regexp supplied
            const valid = regex.test(control.value);

            // if true, return no error (no error), else return error passed in the second parameter
            return valid ? null : error;
        };
    }
    static passwordMatchValidator(control: AbstractControl) {
        const password: string = control.get('password').value; // get password from our password form control
        const confirmPassword: string = control.get('confirmPassword').value; // get password from our confirmPassword form control
        // compare is the password math
        if (password !== confirmPassword) {
            // if they don't match, set an error in our confirmPassword form control
            control.get('confirmPassword').setErrors({ NoPassswordMatch: true });
        }
    }

    toggleAllAccess(): void {
        const obj = this.access.filter(x => x.assignmentType == 'Direct');
        if (obj.length === this.access.length)
            for (let index = 0; index < this.access.length; index++)
                this.setAccessAssignementTypeAndRoleName(this.access[index].accessId, '', '');
        else
            for (let index = 0; index < this.access.length; index++)
                this.setAccessAssignementTypeAndRoleName(this.access[index].accessId, 'Direct', '');
    }
    toggleAccess(accessId: number): void {
        const indx = this.access.findIndex(x => x.accessId === accessId);
        if (!this.access[indx].assignmentType)
            this.setAccessAssignementTypeAndRoleName(accessId, 'Direct', '');
        else
            this.setAccessAssignementTypeAndRoleName(accessId, '', '');
    }

    checkAllAccessIsSelected(): boolean {
        const obj = this.access.filter(x => x.assignmentType);
        return obj.length == this.access.length;
    }
    checkAllAccessIndeterminate(): boolean {
        const obj = this.access.filter(x => x.assignmentType);
        return obj.length > 1 && obj.length < this.access.length;
    }
    checkAllAccessIsDisabled(): boolean {
        const obj = this.access.filter(x => x.assignmentType == 'Role');
        return obj.length > 1;
    }
    private setAccessAssignementTypeAndRoleName(accessId: number, assignmentType: string, roleName: string) {
        const index = this.access.findIndex(x => x.accessId === accessId);
        this.access[index].assignmentType = assignmentType;
        this.access[index].roleName = roleName;
    }

    toggleAllMenus(): void {
        const obj = this.menus.filter(x => x.assignmentType == 'Direct');
        if (obj.length === this.menus.length)
            for (let index = 0; index < this.menus.length; index++)
                this.setMenuAssignementTypeAndRoleName(this.menus[index].id, '', '');
        else
            for (let index = 0; index < this.menus.length; index++)
                this.setMenuAssignementTypeAndRoleName(this.menus[index].id, 'Direct', '');


    }
    toggleMenu(menuId: number): void {
        const indx = this.menus.findIndex(x => x.id === menuId);
        if (!this.menus[indx].assignmentType)
            this.setMenuAssignementTypeAndRoleName(menuId, 'Direct', '');
        else
            this.setMenuAssignementTypeAndRoleName(menuId, '', '');
    }
    checkAllMenusAreSelected(): boolean {
        const obj = this.menus.filter(x => x.assignmentType);
        return obj.length == this.menus.length;
    }
    checkAllMenusIndeterminate(): boolean {
        const obj = this.menus.filter(x => x.assignmentType);
        return obj.length > 1 && obj.length < this.menus.length;
    }
    checkAllMenusIsDisabled(): boolean {
        const obj = this.menus.filter(x => x.assignmentType == 'Role');
        return obj.length > 1;
    }
    private setMenuAssignementTypeAndRoleName(menuId: number, assignmentType: string, roleName: string) {
        const index = this.menus.findIndex(x => x.id === menuId);
        this.menus[index].assignmentType = assignmentType;
        this.menus[index].roleName = roleName;
        if (assignmentType == '') {
            this.menus[index].columns = this.menus[index].columns != 'Not Implemented' ? '' : 'Not Implemented';
            const viewColumnIndex = this.userInfo.viewColumnList.findIndex(x => x.viewId == this.menus[index].viewId);
            if (viewColumnIndex != -1)
                this.userInfo.viewColumnList[viewColumnIndex] = new ViewColumn();
        }

    }
    toggleAllRoles(): void {
        if (this.userInfo.roleIdList.length === this.roles.length)
            this.userInfo.roleIdList = [];
        else {
            this.userInfo.roleIdList = [];
            for (let index = 0; index < this.roles.length; index++) {
                this.userInfo.roleIdList.push(this.roles[index].roleId);
            }
        }
    }
    toggleRole(roleId: number): void {
        const indx = this.userInfo.roleIdList.findIndex(x => x === roleId);
        if (indx === -1) {
            this.getRoleInfo(roleId, 'add');
            this.userInfo.roleIdList.push(roleId);

        }
        else {
            this.userInfo.roleIdList.splice(indx, 1);
            this.checkRoleInfo(roleId, 'remove');
        }

    }
    checkRoleIsSelected(roleId: number): boolean {
        return this.userInfo.roleIdList.findIndex(x => x === roleId) > -1;
    }
    private getRoleInfo(id: number, action: string): void {
        this.isRoleLoading = true;
        this.service.getRoleInfo(id)
            .subscribe(res => {
                this.addInfoToRoleList(res.data);
                this.checkRoleInfo(res.data.roleId, action);
                this.isRoleLoading = false;
                this.cdr.detectChanges();
            });
    }

    private checkRoleInfo(roleId: number, action: string): void {
        const index = this.roles.findIndex(x => x.roleId === roleId);
        for (let i = 0; i < this.roles[index].accessIdList.length; i++) {
            if (action == 'add')
                this.setAccessAssignementTypeAndRoleName(this.roles[index].accessIdList[i], 'Role', this.roles[index].roleName);
            else
                this.setAccessAssignementTypeAndRoleName(this.roles[index].accessIdList[i], '', '');
        }
        for (let i = 0; i < this.roles[index].menuIdList.length; i++) {
            if (action == 'add')
                this.setMenuAssignementTypeAndRoleName(this.roles[index].menuIdList[i], 'Role', this.roles[index].roleName);
            else
                this.setMenuAssignementTypeAndRoleName(this.roles[index].menuIdList[i], '', '');
        }
    }
    private addInfoToRoleList(roleInfo: Role): void {
        const index = this.roles.findIndex(x => x.roleId === roleInfo.roleId);
        this.roles[index].menuIdList = roleInfo.menuIdList;
        this.roles[index].userIdList = roleInfo.userIdList;
        this.roles[index].accessIdList = roleInfo.accessIdList;

    }
    private bindFilters() {
        fromEvent(this.roleFilter.nativeElement, 'keyup')
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(150),
                distinctUntilChanged()
            )
            .subscribe(() => {

                if (!this.roles)
                    return;

                if (this.roleFilter.nativeElement.value) {
                    let value: string = this.roleFilter.nativeElement.value.toLowerCase();
                    this.filteredRoles = this.roles.filter(x => x.roleCode.toLocaleLowerCase().includes(value)
                        || x.roleName.toLocaleLowerCase().includes(value));
                }
                else
                    this.filteredRoles = this.roles;
                this.cdr.detectChanges();

            });

        fromEvent(this.menuFilter.nativeElement, 'keyup')
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(150),
                distinctUntilChanged()
            )
            .subscribe(() => {

                if (!this.menus)
                    return;
                if (this.menuFilter.nativeElement.value) {
                    let value: string = this.menuFilter.nativeElement.value.toLowerCase();
                    this.filteredMenus = this.menus.filter(x => x.code.toLocaleLowerCase().includes(value)
                        || x.title.toLocaleLowerCase().includes(value)
                        || x.link?.toLocaleLowerCase().includes(value));
                }
                else
                    this.filteredMenus = this.menus;
                this.cdr.detectChanges();
            });

        fromEvent(this.accessFilter.nativeElement, 'keyup')
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(150),
                distinctUntilChanged()
            )
            .subscribe(() => {

                if (!this.access)
                    return;
                if (this.accessFilter.nativeElement.value) {
                    let value: string = this.accessFilter.nativeElement.value.toLowerCase();
                    this.filteredAccess = this.access.filter(x => x.accessName.toLocaleLowerCase().includes(value))
                }
                else
                    this.filteredAccess = this.access;
                this.cdr.detectChanges();
            });
    }

    openDialog(viewId: number) {
        let title: string;
        title = 'Budget History';
        let viewIndx: number = this.userInfo.viewColumnList.findIndex(x => x.viewId == viewId);
        if (viewIndx == -1) {
            this.userInfo.viewColumnList.push({ viewId: viewId, columnIdList: [] });
            viewIndx = this.userInfo.viewColumnList.length - 1;
        }
        let config: ColumnDialogConfig;
        config = {
            viewId: viewId, userId: this.userInfo.userId,
            columnIdList: this.userInfo.viewColumnList[viewIndx].columnIdList,
            title: title,
            actions: {
                confirm: {
                    show: true,
                    label: 'Confirm',
                    color: 'primary',
                    disabled: false,
                },
                cancel: {
                    show: true,
                    label: 'Cancel',
                }
            },
            dismissible: {
                show: true,
                disabled: false
            }
        };

        this.close();
        const dialogRef = this._dialogService.open(config);
        dialogRef.afterClosed().subscribe((result) => {

            if (result?.length > 0) {
                let viewColumn: ViewColumn = new ViewColumn();
                viewColumn.viewId = viewId;
                viewColumn.columnIdList = [];
                for (let index = 0; index < result.length; index++)
                    viewColumn.columnIdList.push(result[index].key);
                this.userInfo.viewColumnList[viewIndx] = viewColumn;
                const indx = this.menus.findIndex(x => x.viewId == viewId);
                if (indx - 1)
                    this.menus[indx].columns = result.map(item => item.value).join(', ');
                this.cdr.detectChanges();
            }
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
}



