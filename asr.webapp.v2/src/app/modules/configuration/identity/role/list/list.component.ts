import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Inject, OnDestroy, OnInit, TemplateRef, ViewChild, ViewContainerRef, ViewEncapsulation, ɵɵpureFunction1 } from '@angular/core';
import { DecimalPipe, DOCUMENT, formatDate } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDrawer } from '@angular/material/sidenav';
import { fromEvent, merge, Observable, of, Subject, Subscription } from 'rxjs';
import { filter, map, switchMap, takeUntil, debounceTime, distinctUntilChanged, take } from 'rxjs/operators';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { Role } from 'app/modules/configuration/identity/role/role.types';
import { RoleService } from 'app/modules/configuration/identity/role/role.service';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Paging } from 'app/core/type/paging/paging.type';
import { MatSort } from '@angular/material/sort';
import { ExcelService } from 'app/shared/excel/excel.service';
import jsPDF from 'jspdf';
import { ExcelHeader } from 'app/shared/excel/excel.types';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';

@Component({
    selector: 'role-list',
    templateUrl: './list.component.html', styles: [
        /* language=SCSS */
        `        
            .role-grid {
                grid-template-columns:  200px auto 150px 70px ;

                @screen sm {
                    grid-template-columns: 48px auto 112px 72px;
                }

                @screen md {
                    grid-template-columns:  50px 30px auto  50px 50px ;
                }

                @screen lg {
                    grid-template-columns:  200px auto 150px 70px ;
                }
            }
        `
    ],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoleListComponent implements OnInit, OnDestroy {
    @ViewChild('matDrawer', { static: true }) matDrawer: MatDrawer;
    @ViewChild('filter', { static: true }) filter: ElementRef;
    sub: Subscription;
    overlayRef: OverlayRef | null;
    roles$: Observable<Role[]>;
    isLoading: boolean = false;
    showHeaderList: boolean = true;
    rolesCount: number = 0;
    rolesTableColumns: string[] = ['name', 'email', 'phoneNumber', 'job'];
    drawerMode: 'side' | 'over';
    searchInputControl: FormControl = new FormControl();
    selectedRole: Role;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;
    throttle = 300;
    scrollDistance = 1;
    scrollUpDistance = 2;
    direction = "";
    modalOpen = false;
    roleInfo: Role = new Role();
    brands: Array<{ key: number, value: string }> = [];
    frmAdvancedSearch = new FormGroup({
        roleName: new FormControl(),
        roleCode: new FormControl(),
        status: new FormControl(),

    });

    /**
     * Constructor
     */
    constructor(
        public overlay: Overlay,
        private _activatedRoute: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        private _roleService: RoleService,
        @Inject(DOCUMENT) private _document: any,
        private _formBuilder: FormBuilder,
        private _decimalPipe: DecimalPipe, public viewContainerRef: ViewContainerRef,
        private excelService: ExcelService,
        private _router: Router,
        private _fuseMediaWatcherService: FuseMediaWatcherService
    ) {
        this.roleInfo.statusIdList = [];
        this.roleInfo.statusIdList.push(1000001);
        this.selectedRole = new Role();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {

        // Get the roles
        this._roleService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: Paging) => {

                // Update the pagination
                this.roleInfo.page = pagination;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
        this.roles$ = this._roleService.roles$;
        this._roleService.roles$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((roles: Role[]) => {

                // Update the counts
                this.rolesCount = roles.length;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the role
        this._roleService.role$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((role: Role) => {

                // Update the selected role
                //this.selectedRole = role;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });


        // Subscribe to search input field value changes
        fromEvent(this.filter.nativeElement, 'keyup')
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(150),
                distinctUntilChanged()
            )
            .subscribe(() => {

                if (!this.roles$)
                    return;


                this._roleService.roles$.pipe(map(items => items.filter(x =>
                    x.roleCode.toLowerCase().includes(this.filter.nativeElement.value) ||
                    x.roleName?.toLowerCase().includes(this.filter.nativeElement.value) ||
                    x.statusDescription.toLowerCase().includes(this.filter.nativeElement.value)))).subscribe(elements => {
                        this.roles$ = of(elements as Role[]);
                        this._changeDetectorRef.markForCheck();
                        this._changeDetectorRef.detectChanges();
                    });

            });




        // Subscribe to media changes
        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({ matchingAliases }) => {

                // Set the drawerMode if the given breakpoint is active
                if (matchingAliases.includes('lg')) {
                    this.drawerMode = 'side';
                }
                else {
                    this.drawerMode = 'over';
                }

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Listen for shortcuts
        fromEvent(this._document, 'keydown')
            .pipe(
                takeUntil(this._unsubscribeAll),
                filter<KeyboardEvent>(event =>
                    (event.ctrlKey === true || event.metaKey) // Ctrl or Cmd
                    && (event.key === '/') // '/'
                )
            )
            .subscribe(() => {
                this.createRole();
            });


    }
    ngAfterViewInit(): void {
        if (this._sort && this._paginator) {
            // Set the initial sort
            this._sort.sort({
                id: '',
                start: 'asc',
                disableClear: true
            });

            // Mark for check
            this._changeDetectorRef.markForCheck();

            // If the role changes the sort order...
            this._sort.sortChange
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe(() => {
                    // Reset back to the first page
                    this._paginator.pageIndex = 0;

                    // Close the details
                    this.closeDetails();
                });

            // Get products if sort or page changes
            merge(this._sort.sortChange, this._paginator.page).pipe(
                switchMap(() => {
                    this.closeDetails();
                    this.isLoading = true;
                    this.roleInfo.page.pageNumber = this._paginator.pageIndex;
                    this.roleInfo.page.pageSize = this._paginator.pageSize;
                    this.roleInfo.page.sort = this._sort.active;
                    this.roleInfo.page.order = this._sort.direction;
                    return this._roleService.getRoles(this.roleInfo);
                }),
                map(() => {
                    this.isLoading = false;
                    if (this._sort.active === 'brandName' || this._sort.active == '')
                        this.showHeaderList = true;
                    else
                        this.showHeaderList = false;
                })
            ).subscribe();
        }
        this.frmAdvancedSearch.controls['status'].setValue([1000001]);
    }
    closeDetails(): void {
        // this.selectedRole = null;
    }
    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * On backdrop clicked
     */
    onBackdropClicked(): void {
        // Go back to the list
        this._router.navigate(['./'], { relativeTo: this._activatedRoute });

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Create role
     */
    createRole(): void {
        this._router.navigate(['./', -1], { relativeTo: this._activatedRoute });

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }
    onScroll() {
        console.log('scroll');
    }

    handlePageEvent(event: PageEvent) {

        let obj: Role = new Role();
        this._roleService.getRoles(obj);
    }
    exportTable() {
        let columns: Array<ExcelHeader> = new Array<ExcelHeader>();
        let obj: Array<Role> = new Array<Role>();
        let role: number = 0;
        let qty: number = 0;
        let date = formatDate(new Date(), 'yyyyMMdd_hhmmss', 'en');
        let fileName: string = 'Role_'.concat(date.toString());

        columns.push({ basedColumnName: 'rolename', excelColumnName: 'Rolename' });
        columns.push({ basedColumnName: 'firstName', excelColumnName: 'First Name' });
        columns.push({ basedColumnName: 'lastName', excelColumnName: 'Last name' });
        columns.push({ basedColumnName: 'email', excelColumnName: 'Email' });
        columns.push({ basedColumnName: 'statusDescription', excelColumnName: 'Status' });

        this.roles$.subscribe(items => items.forEach(element => {
            qty = qty + 1;
            obj.push(element);

        }));



        let footerData = [];

        footerData.push(['', '', '', 'QTY', qty]);

        this.excelService.exportAsExcelFile('Role', '', columns, obj, footerData, fileName, 'Sheet1');

        obj = [];
    }
    download() {

        var pdf = new jsPDF('l');

        pdf.setFontSize(20);
        pdf.text('Role', 14, 8);
        pdf.setFontSize(12);
        pdf.setTextColor(99);
        let header = [];
        let tableData = [];
        let footer = [];
        let role: number = 0;
        let qty: number = 0;
        let date = formatDate(new Date(), 'yyyyMMdd_hhmmss', 'en');
        let fileName: string = 'Role_'.concat(date.concat('.pdf'));

        header = [{ header: 'Role', dataKey: 'roleName' },
        { header: 'Code', dataKey: 'roleCode' },
        { header: 'Status', dataKey: 'statusDescription' }];


        this.roles$.subscribe(items => items.forEach(element => {
            qty = qty + 1;
            tableData.push([
                element.roleName, element.roleCode, element.statusDescription
            ]);
        }));

        footer = [['QTY', '', '', '', qty]];


        (pdf as any).autoTable({
            columns: header,
            columnStyles: { name: { cellWidth: 50 } },
            body: tableData,
            foot: footer,
            footStyles: { fillColor: [223, 223, 223], textColor: [0, 0, 0] },
            theme: 'grid',
            showFoot: 'lastPage'
        });

        // Open PDF document in browser's new tab
        pdf.output('dataurlnewwindow')

        // Download PDF doc  
        pdf.save(fileName);
    }
    transformDecimal(num) {
        return num === 0 ? 0 : this._decimalPipe.transform(num, '1.0-5');
    }
    resetAdvancedSearch() {

    }
    search() {
        this.isLoading = true;
        this.roleInfo.roleCode = this.frmAdvancedSearch.controls["roleCode"].value;
        this.roleInfo.roleName = this.frmAdvancedSearch.controls["roleName"].value;

        this.roleInfo.page.flag = true;
        this.roleInfo.page.pageNumber = 0;
        this.roleInfo.page.length = 0;
        this._roleService.getRoles(this.roleInfo).subscribe(() => {
            this.isLoading = false;
        });
    }

    setStatusValue(event: {
        isRoleInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isRoleInput) {
            if (event.source.value != 0 && event.source.selected) {
                this.roleInfo.statusIdList.push(event.source.value);

            }
            else if (event.source.value != 0 && !event.source.selected) {
                const index: number = this.roleInfo.statusIdList.indexOf(event.source.value);
                if (index !== -1)
                    this.roleInfo.statusIdList.splice(index, 1);
                this.frmAdvancedSearch.controls["status"].setValue(this.roleInfo.statusIdList);
            }
        }
    }






}
