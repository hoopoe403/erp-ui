import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { fuseAnimations } from "../../../../../../@fuse/animations";
import { FormBuilder, FormGroup } from "@angular/forms";
import { animate, state, style, transition, trigger } from "@angular/animations";
import { SoftwareTaskService } from "../software-task.service";
import { FuseAlertService } from '@fuse/components/alert';
import { Observable, Subject, forkJoin, fromEvent } from 'rxjs';
import { SoftwareTask } from '../software-task.types';
import { OpResult } from 'app/core/type/result/result.types';
import { ActivatedRoute } from '@angular/router';
import { MatMenuTrigger } from '@angular/material/menu';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Menu, SubSystem } from 'app/modules/configuration/identity/identity.types';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { KeyValue } from 'app/core/type/key-value/key-value.type';
@Component({
    selector: 'task-details',
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
        .subsystem-grid {
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
            grid-template-columns:  75px 100px 300px   auto;

            @screen sm {
                grid-template-columns: 48px auto 112px 72px;
            }

            @screen md {
                grid-template-columns:  50px 30px auto  50px 50px ;
            }

            @screen lg {
                grid-template-columns: 75px 100px 300px  200px  auto;
            }
        }
        .menu-preview-grid {
            grid-template-columns:  250px 300px 300px auto;

            @screen sm {
                grid-template-columns: 250px 300px 300px auto;
            }

            @screen md {
                grid-template-columns:  250px 300px 300px auto;
            }

            @screen lg {
                grid-template-columns:  250px auto 300px 400px ;
            }
        }
        .subsystem-preview-grid {
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
        /* Add application styles & imports to this file! */


.container {  
  max-width: 720px;
  margin-right: auto;
  margin-left: auto;    
}

.quote {
    color: #8cc540;
    font-style: italic;
}

.redText {
    color: Red;
    font-size: 12px;
    font-family: Arial;
}

h1.titleText {
    color: #69a8cf;
    text-align: left;
    margin-top: 40px;
    font-weight: normal;
}
        `
    ],
    encapsulation: ViewEncapsulation.None
})

export class SoftwareTaskDetailsComponent implements OnInit, OnDestroy {

    titleInfo: string;
    id: number;
    detailInfo: SoftwareTask = new SoftwareTask();
    _result: OpResult = new OpResult();
    pageType: string;
    private _unsubscribeAll: Subject<any>;
    isLoading: boolean = false;
    frmDetails: FormGroup;
    subsystems: Array<SubSystem>;
    filteredSubsystems: Array<SubSystem>
    menus: Array<Menu>;
    filteredMenus: Array<Menu>;
    statuses = [];
    priorities: Array<KeyValue>;
    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
    @ViewChild('subsystemFilter', { static: true }) subsystemFilter: ElementRef;
    @ViewChild('menuFilter', { static: true }) menuFilter: ElementRef;
    editorConfig: AngularEditorConfig = {
        editable: true,
        spellcheck: true,
        height: 'auto',
        minHeight: '30rem',
        maxHeight: 'auto',
        width: 'auto',
        minWidth: '0',
        translate: 'yes',
        enableToolbar: true,
        showToolbar: true,
        placeholder: 'Enter text here...',
        defaultParagraphSeparator: '',
        defaultFontName: '',
        defaultFontSize: '',
        fonts: [
            { class: 'arial', name: 'Arial' },
            { class: 'times-new-roman', name: 'Times New Roman' },
            { class: 'calibri', name: 'Calibri' },
            { class: 'comic-sans-ms', name: 'Comic Sans MS' }
        ],
        customClasses: [
            {
                name: 'quote',
                class: 'quote',
            },
            {
                name: 'redText',
                class: 'redText'
            },
            {
                name: 'titleText',
                class: 'titleText',
                tag: 'h1',
            },
        ],
        //uploadUrl: 'v1/image',
        //upload: (file: File) => { ... }
        uploadWithCredentials: false,
        sanitize: true,
        toolbarPosition: 'top',
        toolbarHiddenButtons: [
            ['insertUnorderedList',
                'insertOrderedList', 'heading', 'indent',
                'outdent',],
            ['insertImage',
                'insertVideo',]
        ]
    };
    constructor(
        private service: SoftwareTaskService,
        private _formBuilder: FormBuilder,
        private cdr: ChangeDetectorRef,
        private route: ActivatedRoute,
        private _fuseAlertService: FuseAlertService
    ) {
        this.subsystems = [];
        this.filteredSubsystems = [];
        this.menus = [];
        this.filteredMenus = [];
        this.detailInfo.statusIdList = [];
        this.detailInfo.subSystemIdList = [];
        this.detailInfo.menuIdList = [];
        this._unsubscribeAll = new Subject();
        this.priorities = new Array<KeyValue>();
        // Set the default

    }

    /**
     * On init
     */
    ngOnInit(): void {
        this.frmDetails = this.createFormObject();
        this.isLoading = true;
        this.bindFilters();
        this.id = Number(this.route.snapshot.paramMap.get('id'));
        this.priorities.push({ key: 0, value: 'Low' });
        this.priorities.push({ key: 1, value: 'Normal' });
        this.priorities.push({ key: 2, value: 'High' });
        if (this.id > 0) {
            this.pageType = 'edit';
            this.getById(this.id);

        }
        else {
            this.titleInfo = 'Register New Resource';
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
            this.getSubsystems(),
            this.getMenus(),
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
            this.getTask(id),
            this.getSubsystems(),
            this.getMenus(),
            this.getStatuses(),
        ).subscribe(res => {
            this.setForkJoinValuesInEditMode(res);
            this.isLoading = false;
            this.setFormValues();
            this.cdr.detectChanges();
        });

    }

    private getStatuses(): Observable<any> {
        return this.service.getStatuses();
    }

    private getTask(id: number): Observable<any> {
        return this.service.getSoftwareTask(id.toString());
        /* .subscribe(res => {
            this.goodsInfo = res.data;
        }); */
    }

    private setForkJoinValues(values: Array<any>): void {
        this.filteredSubsystems = this.subsystems = values[0].data;
        this.filteredMenus = this.menus = values[1].data;
        this.statuses = values[2].data;
    }

    private setForkJoinValuesInEditMode(values: Array<any>): void {
        this.detailInfo = values[0].data;
        this.filteredSubsystems = this.subsystems = values[1].data;
        this.filteredMenus = this.menus = values[2].data;
        this.statuses = values[3].data;
        this.titleInfo = this.detailInfo.title;
        this.detailInfo.menuIdList.forEach(element => {
            const indx = this.menus.findIndex(x => x.id == element);
            if (indx != -1)
                this.menus[indx].assignmentType = 'assigned';
        });
        this.detailInfo.subSystemIdList.forEach(element => {
            const indx = this.subsystems.findIndex(x => x.subSystemId == element);
            if (indx != -1)
                this.subsystems[indx].assignmentType = 'assigned';
        });
    }

    private createFormObject(): FormGroup {

        return this._formBuilder.group({
            title: '',
            priority: '',
            cost: '',
            status: '',
            descriptions: ''
        });
    }


    private getSubsystems(): Observable<any> {
        return this.service.getSubsystems();
    }

    private getMenus(): Observable<any> {
        return this.service.getFinalMenus();
    }


    private showAlert(name: string): void {
        this._fuseAlertService.show(name);
    }

    private dismissAlert(name: string): void {
        this._fuseAlertService.dismiss(name);
    }


    setStatusValue(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            if (event.source.value != 0 && event.source.selected) {
                this.detailInfo.statusIdList.push(event.source.value);

            }
            else if (event.source.value != 0 && !event.source.selected) {
                const index: number = this.detailInfo.statusIdList.indexOf(event.source.value);
                if (index !== -1)
                    this.detailInfo.statusIdList.splice(index, 1);
                this.frmDetails.controls["status"].setValue(this.detailInfo.statusIdList);
            }
        }


    }

    setSubsystemValue(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            if (event.source.value == 0 && event.source.selected) {
                this.detailInfo.subSystemIdList = [];
                this.subsystems.forEach(element => {
                    this.detailInfo.subSystemIdList.push(element.subSystemId);
                });
                this.filteredMenus = this.menus;
            }
            if (event.source.value == 0 && !event.source.selected) {
                this.detailInfo.subSystemIdList = [];
                this.filteredMenus = this.menus;
            }
            else if (event.source.value != 0 && event.source.selected) {
                this.detailInfo.subSystemIdList.push(event.source.value);

            }
            else if (event.source.value != 0 && !event.source.selected) {
                const index: number = this.detailInfo.subSystemIdList.indexOf(event.source.value);
                if (index !== -1)
                    this.detailInfo.subSystemIdList.splice(index, 1);
                this.frmDetails.controls["status"].setValue(this.detailInfo.subSystemIdList);
            }
        }


    }

    setMenuValue(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            if (event.source.value != 0 && event.source.selected) {
                this.detailInfo.menuIdList.push(event.source.value);

            }
            else if (event.source.value != 0 && !event.source.selected) {
                const index: number = this.detailInfo.menuIdList.indexOf(event.source.value);
                if (index !== -1)
                    this.detailInfo.menuIdList.splice(index, 1);
                this.frmDetails.controls["status"].setValue(this.detailInfo.menuIdList);
            }
        }


    }


    private setFormValues() {
        this.frmDetails.controls["title"].setValue(this.detailInfo.title);
        this.frmDetails.controls["priority"].setValue(this.detailInfo.priority);
        this.frmDetails.controls["cost"].setValue(this.processPrice(this.detailInfo.cost.toString()));
        this.frmDetails.controls["descriptions"].setValue(this.detailInfo.descriptions);
        this.frmDetails.controls["status"].setValue(this.detailInfo.status);
    }
    private getFormInfo(): boolean {
        let finalResult: boolean = true;
        const controls = this.frmDetails.controls;
        for (const name in controls) {
            if (name == 'descriptions')
                continue;
            if (controls[name] != undefined && !controls[name].disabled && !controls[name].valid) {
                this._result.succeed = false;
                this._result.message = "There is atleast one unfilled element! Please fill all the elements in the all tabs";
                finalResult = false;
                return finalResult;
            }
        }
        this.detailInfo.title = this.frmDetails.controls["title"].value;
        this.detailInfo.priority = this.frmDetails.controls["priority"].value;
        this.detailInfo.descriptions = this.frmDetails.controls["descriptions"].value;
        this.detailInfo.status = this.frmDetails.controls["status"].value;

        return finalResult;
    }
    save() {
        let formResult: boolean;
        this.dismissAlert('successMessage');
        this.dismissAlert('errorMessage');
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
        this.service.create(this.detailInfo).subscribe(res => {
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

        this.service.edit(this.detailInfo).subscribe(res => {
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
    setCost(cost: string) {
        if (cost == '')
            return;
        cost = cost.replace(/,/g, '');
        this.detailInfo.cost = parseFloat(cost);
        let finalCost: string = this.processPrice(cost);
        this.frmDetails.controls['cost'].setValue(finalCost);

    }
    private processPrice(price: string): string {
        let result: string;
        let counter: number = 0;
        price = price.replace(/,/g, '');
        if (!/^\d+$/.test(price)) {
            result = price.substring(0, price.length - 1);

        }
        else {

            for (let index = price.length; index > 0; index--) {

                if (index === price.length)
                    result = price.substring(index - 1, index);
                else {
                    if (counter % 3 === 0)
                        result = ','.concat(result);

                    result = price.substring(index - 1, index).concat(result);
                }
                counter = counter + 1;
            }
        }
        if (result == '0')
            result = result.concat(',000');
        else if (result == '')
            result = result.concat('0,000');
        return result;
    }
    toggleAllMenus(checked: boolean): void {
        this.filteredMenus.forEach(element => {
            const indx = this.detailInfo.menuIdList.findIndex(x => x == element.id);
            if (checked && indx == -1) {
                this.detailInfo.menuIdList.push(element.id);
                this.setMenuAssignementType(element.id, 'assigned');
            }
            else if
                (!checked && indx != -1) {
                this.detailInfo.menuIdList.splice(indx, 1);
                this.setMenuAssignementType(element.id, null);
            }
        });

    }
    toggleMenu(menuId: number): void {
        const indx = this.detailInfo.menuIdList.findIndex(x => x == menuId);
        if (indx != -1) {
            this.detailInfo.menuIdList.splice(indx, 1);
            this.setMenuAssignementType(menuId, null);
        }
        else {
            this.detailInfo.menuIdList.push(menuId);
            this.setMenuAssignementType(menuId, 'assigned');
        }
    }
    checkAllMenusAreSelected(): boolean {
        let result: boolean = true;
        this.filteredMenus.forEach(element => {
            const indx = this.detailInfo.menuIdList.findIndex(x => x == element.id);
            if (indx == -1)
                result = false;
        });
        return result;
    }


    checkMenuIsSelected(menuId: number): boolean {
        return this.detailInfo.menuIdList.findIndex(x => x == menuId) > -1;
    }
    checkMenuIsIndeterminate(): boolean {
        let indeterminate: boolean = false;
        let all: boolean = true;
        this.filteredMenus.forEach(element => {
            const indx = this.detailInfo.menuIdList.findIndex(x => x == element.id);
            if (indx != -1)
                indeterminate = true;
            else
                all = false;
        });
        return indeterminate && !all;
    }
    private setMenuAssignementType(menuId: number, assignmentType: string) {
        const index = this.menus.findIndex(x => x.id === menuId);
        this.menus[index].assignmentType = assignmentType;
    }
    toggleAllSubsystems(checked: boolean): void {
        this.filteredSubsystems.forEach(element => {
            const indx = this.detailInfo.subSystemIdList.findIndex(x => x == element.subSystemId);
            if (checked && indx == -1) {
                this.detailInfo.subSystemIdList.push(element.subSystemId);
                this.setSubsystemAssignementType(element.subSystemId, 'assigned');
            }
            else if
                (!checked && indx != -1) {
                this.detailInfo.subSystemIdList.splice(indx, 1);
                this.setSubsystemAssignementType(element.subSystemId, null);
            }
        });

    }
    toggleSubsystem(subsystemId: number): void {
        const indx = this.detailInfo.subSystemIdList.findIndex(x => x === subsystemId);
        if (indx === -1) {
            this.detailInfo.subSystemIdList.push(subsystemId);
            this.setSubsystemAssignementType(subsystemId, 'assigned');
        }
        else {
            this.detailInfo.subSystemIdList.splice(indx, 1);
            this.setSubsystemAssignementType(subsystemId, null);
        }

    }
    checkSubsystemIsSelected(subsystemId: number): boolean {
        return this.detailInfo.subSystemIdList.findIndex(x => x == subsystemId) > -1;
    }
    checkSubsystemIsIndeterminate(): boolean {
        let indeterminate: boolean = false;
        let all: boolean = true;
        this.filteredSubsystems.forEach(element => {
            const indx = this.detailInfo.subSystemIdList.findIndex(x => x == element.subSystemId);
            if (indx != -1)
                indeterminate = true;
            else
                all = false;
        });
        return indeterminate && !all;
    }
    checkAllSubsystemsAreSelected(): boolean {
        let result: boolean = true;
        this.filteredSubsystems.forEach(element => {
            const indx = this.detailInfo.subSystemIdList.findIndex(x => x == element.subSystemId);
            if (indx == -1)
                result = false;
        });
        return result;
    }
    private setSubsystemAssignementType(subSystemId: number, assignmentType: string) {
        const index = this.subsystems.findIndex(x => x.subSystemId === subSystemId);
        this.subsystems[index].assignmentType = assignmentType;
    }
    private bindFilters() {
        fromEvent(this.subsystemFilter.nativeElement, 'keyup')
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(150),
                distinctUntilChanged()
            )
            .subscribe(() => {

                if (!this.subsystems)
                    return;

                if (this.subsystemFilter.nativeElement.value) {
                    let value: string = this.subsystemFilter.nativeElement.value.toLowerCase();
                    this.filteredSubsystems = this.subsystems.filter(x => x.subSystemName.toLocaleLowerCase().includes(value));
                }
                else
                    this.filteredSubsystems = this.subsystems;
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
                        || x.subSystemName.toLocaleLowerCase().includes(value)
                        || x.link?.toLocaleLowerCase().includes(value));
                }
                else
                    this.filteredMenus = this.menus;
                this.cdr.detectChanges();
            });


    }
    setPriorityValue(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            this.detailInfo.priority = event.source.value;
            this.cdr.detectChanges();
        }


    }

}

