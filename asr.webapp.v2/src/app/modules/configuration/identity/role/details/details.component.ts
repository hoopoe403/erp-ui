import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { fuseAnimations } from "../../../../../../@fuse/animations";
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from "@angular/forms";
import { animate, state, style, transition, trigger } from "@angular/animations";
import { RoleService } from "../role.service";
import { FuseAlertService } from '@fuse/components/alert';
import { Observable, Subject, forkJoin, fromEvent } from 'rxjs';
import { Role } from '../role.types';
import { OpResult } from 'app/core/type/result/result.types';
import { ActivatedRoute } from '@angular/router';
import { MatMenuTrigger } from '@angular/material/menu';
import { Access, Menu } from '../../identity.types';
import { User } from '../../user/user.types';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import * as CryptoJS from 'crypto-js';
@Component({
    selector: 'role-details',
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
        .role-user-grid {
            grid-template-columns:  75px 300px auto;

            @screen sm {
                grid-template-columns: 48px auto 112px 72px;
            }

            @screen md {
                grid-template-columns:  50px 30px auto  50px 50px ;
            }

            @screen lg {
                grid-template-columns: 75px 100px auto 300px 300px;
            }
        }
        .role-menu-grid {
            grid-template-columns:  75px 100px 300px   auto;

            @screen sm {
                grid-template-columns: 48px auto 112px 72px;
            }

            @screen md {
                grid-template-columns:  50px 30px auto  50px 50px ;
            }

            @screen lg {
                grid-template-columns: 75px 100px 300px   auto;
            }
        }
        .role-access-grid {
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
        .role-menu-preview-grid {
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
        .role-access-preview-grid {
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
        .role-user-preview-grid {
            grid-template-columns: 100px auto 300px 300px;

            @screen sm {
                grid-template-columns: 48px auto 112px 72px;
            }

            @screen md {
                grid-template-columns:  50px 30px auto  50px 50px ;
            }

            @screen lg {
                grid-template-columns:   100px auto 300px 300px;
            }
        }
        `
    ],
    encapsulation: ViewEncapsulation.None
})

export class RoleDetailsComponent implements OnInit, OnDestroy {
    public titleInfo: string;
    public roleInfo: Role = new Role();
    public filteredMenus: Array<Menu>;
    public filteredAccess: Array<Access>;
    public filteredUsers: Array<User>;
    public menus: Array<Menu>;
    public access: Array<Access>;
    public users: Array<User>;
    public _result: OpResult = new OpResult();
    public pageType: string;
    public isLoading: boolean = false;
    public frmRole: FormGroup;
    private id: number;
    private _unsubscribeAll: Subject<any>;
    private templatePassword: string;
    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
    @ViewChild('userFilter', { static: true }) userFilter: ElementRef;
    @ViewChild('menuFilter', { static: true }) menuFilter: ElementRef;
    @ViewChild('accessFilter', { static: true }) accessFilter: ElementRef;
    constructor(
        private service: RoleService,
        private _formBuilder: FormBuilder,
        private cdr: ChangeDetectorRef,
        private route: ActivatedRoute,
        private _fuseAlertService: FuseAlertService
    ) {
        this._unsubscribeAll = new Subject();
        this.users = [];
        this.menus = [];
        this.access = [];
        this.roleInfo.accessIdList = [];
        this.roleInfo.userIdList = [];
        this.roleInfo.menuIdList = [];
        // Set the default

    }

    /**
     * On init
     */
    ngOnInit(): void {

        this.frmRole = this.createFormObject();
        this.isLoading = true;
        this.bindFilters();

        this.id = Number(this.route.snapshot.paramMap.get('id'));
        if (this.id > 0) {
            this.pageType = 'edit';
            this.getById(this.id);

        }
        else {
            this.titleInfo = 'Register New Role';
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
            this.getUsers(),
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
            this.getRole(id),
            this.getMenus(),
            this.getUsers(),
            this.getAccess(),
        ).subscribe(res => {
            this.setForkJoinValuesInEditMode(res);
            this.isLoading = false;
            this.setFormValues();
            this.cdr.detectChanges();
        });

    }



    private getRole(id: number): Observable<any> {
        return this.service.getRole(id);
        /* .subscribe(res => {
            this.goodsInfo = res.data;
        }); */
    }

    private setForkJoinValues(values: Array<any>): void {
        this.menus = this.filteredMenus = values[0].data;
        this.users = this.filteredUsers = values[1].data;
        this.access = this.filteredAccess = values[2].data;
    }

    private setForkJoinValuesInEditMode(values: Array<any>): void {
        this.roleInfo = values[0].data;
        this.menus = this.filteredMenus = values[1].data;
        this.users = this.filteredUsers = values[2].data;
        this.access = this.filteredAccess = values[3].data;
        this.titleInfo = this.roleInfo.roleName.concat('-').concat(this.roleInfo.roleCode);
        for (let index = 0; index < this.roleInfo.menuIdList.length; index++) {
            this.setMenuAssignementTypeAndRoleName(this.roleInfo.menuIdList[index], 'Role');
        }
        for (let index = 0; index < this.roleInfo.accessIdList.length; index++) {
            this.setAccessAssignementTypeAndRoleName(this.roleInfo.accessIdList[index], 'Role');
        }
        for (let index = 0; index < this.roleInfo.userIdList.length; index++) {
            this.setUserAssignementTypeAndRoleName(this.roleInfo.userIdList[index], 'Role');
        }

    }

    private createFormObject(): FormGroup {

        return this._formBuilder.group({
            code: ['', [Validators.pattern('^[a-zA-Z0-9]{1,6}$')]],
            roleName: ['', [Validators.pattern('^[a-zA-Z0-9_-]{1,15}$')]],
            status: [{ value: '', disabled: false }, Validators.required],

        }
        );
    }


    private getUsers(): Observable<any> {
        return this.service.getUsers();
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






    private setFormValues() {

        this.frmRole.controls["code"].setValue(this.roleInfo.roleCode);
        this.frmRole.controls["roleName"].setValue(this.roleInfo.roleName);
        this.frmRole.controls["status"].setValue(this.roleInfo.status);

    }
    private getFormInfo(): boolean {
        let finalResult: boolean = true;
        this.roleInfo.roleCode = this.frmRole.controls["code"].value;
        this.roleInfo.roleName = this.frmRole.controls["roleName"].value;
        this.roleInfo.status = this.frmRole.controls["status"].value;
        this.roleInfo.menuIdList = this.menus.filter(x => x.assignmentType).map(function (obj) {
            return obj.id;
        });
        this.roleInfo.accessIdList = this.access.filter(x => x.assignmentType).map(function (obj) {
            return obj.accessId;
        });
        this.roleInfo.userIdList = this.users.filter(x => x.assignmentType).map(function (obj) {
            return obj.userId;
        });


        return finalResult;
    }
    save() {
        let formResult: boolean;
        formResult = this.getFormInfo();
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
        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');
        this.service.create(this.roleInfo).subscribe(res => {
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

        this.service.edit(this.roleInfo).subscribe(res => {
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


    toggleAllAccess(): void {
        const obj = this.access.filter(x => x.assignmentType);
        if (obj.length === this.access.length)
            for (let index = 0; index < this.access.length; index++)
                this.setAccessAssignementTypeAndRoleName(this.access[index].accessId, '');
        else
            for (let index = 0; index < this.access.length; index++)
                this.setAccessAssignementTypeAndRoleName(this.access[index].accessId, 'Role');
    }
    toggleAccess(accessId: number): void {
        const indx = this.access.findIndex(x => x.accessId === accessId);
        if (!this.access[indx].assignmentType)
            this.setAccessAssignementTypeAndRoleName(accessId, 'Role');
        else
            this.setAccessAssignementTypeAndRoleName(accessId, '');
    }

    checkAllAccessIsSelected(): boolean {
        const obj = this.access.filter(x => x.assignmentType);
        return obj.length == this.access.length;
    }
    checkAllAccessIndeterminate(): boolean {
        const obj = this.access.filter(x => x.assignmentType);
        return obj.length > 1 && obj.length < this.access.length;
    }

    private setAccessAssignementTypeAndRoleName(accessId: number, assignmentType: string) {
        const index = this.access.findIndex(x => x.accessId === accessId);
        this.access[index].assignmentType = assignmentType;
    }

    toggleAllMenus(): void {
        const obj = this.menus.filter(x => x.assignmentType);
        if (obj.length === this.menus.length)
            for (let index = 0; index < this.menus.length; index++)
                this.setMenuAssignementTypeAndRoleName(this.menus[index].id, '');
        else
            for (let index = 0; index < this.menus.length; index++)
                this.setMenuAssignementTypeAndRoleName(this.menus[index].id, 'Role');


    }
    toggleMenu(menuId: number): void {
        const indx = this.menus.findIndex(x => x.id === menuId);
        if (!this.menus[indx].assignmentType)
            this.setMenuAssignementTypeAndRoleName(menuId, 'Role');
        else
            this.setMenuAssignementTypeAndRoleName(menuId, '');
    }
    checkAllMenusAreSelected(): boolean {
        const obj = this.menus.filter(x => x.assignmentType);
        return obj.length == this.menus.length;
    }
    checkAllMenusIndeterminate(): boolean {
        const obj = this.menus.filter(x => x.assignmentType);
        return obj.length > 1 && obj.length < this.menus.length;
    }

    private setMenuAssignementTypeAndRoleName(menuId: number, assignmentType: string) {
        const index = this.menus.findIndex(x => x.id === menuId);
        this.menus[index].assignmentType = assignmentType;
    }
    toggleAllUsers(): void {
        const obj = this.users.filter(x => x.assignmentType == 'Direct');
        if (obj.length === this.users.length)
            for (let index = 0; index < this.users.length; index++)
                this.setUserAssignementTypeAndRoleName(this.users[index].userId, '');
        else
            for (let index = 0; index < this.users.length; index++)
                this.setUserAssignementTypeAndRoleName(this.users[index].userId, 'Direct');

    }
    toggleUser(userId: number): void {
        const indx = this.users.findIndex(x => x.userId === userId);
        if (!this.users[indx].assignmentType)
            this.setUserAssignementTypeAndRoleName(userId, 'Direct');
        else
            this.setUserAssignementTypeAndRoleName(userId, '');
    }
    checkAllUserIndeterminate(): boolean {
        const obj = this.users.filter(x => x.assignmentType);
        return obj.length > 1 && obj.length < this.users.length;
    }
    checkAllUserIsSelected(): boolean {
        const obj = this.users.filter(x => x.assignmentType);
        return obj.length == this.users.length;
    }
    private setUserAssignementTypeAndRoleName(userId: number, assignmentType: string) {
        const index = this.users.findIndex(x => x.userId === userId);
        this.users[index].assignmentType = assignmentType;
    }

    private bindFilters() {
        fromEvent(this.userFilter.nativeElement, 'keyup')
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(150),
                distinctUntilChanged()
            )
            .subscribe(() => {

                if (!this.users)
                    return;

                if (this.userFilter.nativeElement.value) {
                    let value: string = this.userFilter.nativeElement.value.toLowerCase();
                    this.filteredUsers = this.users.filter(x => x.username.toLowerCase().includes(value)
                        || x.firstName.toLowerCase().includes(value)
                        || x.userNumber.toString().toLowerCase().includes(value)
                        || x.lastName?.toLowerCase().includes(value));
                }
                else
                    this.filteredUsers = this.users;
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
    openUserPage(url: string) {
        window.open(url, "_blank");

    }
}



