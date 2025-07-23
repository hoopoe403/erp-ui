import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Inject, OnDestroy, OnInit, TemplateRef, ViewChild, ViewContainerRef, ViewEncapsulation, ɵɵpureFunction1 } from '@angular/core';
import { DecimalPipe, DOCUMENT, formatDate } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDrawer } from '@angular/material/sidenav';
import { fromEvent, merge, Observable, of, Subject, Subscription } from 'rxjs';
import { filter, map, switchMap, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { User } from 'app/modules/configuration/identity/user/user.types';
import { UserService } from 'app/modules/configuration/identity/user/user.service';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Paging } from 'app/core/type/paging/paging.type';
import { MatSort } from '@angular/material/sort';
import { ExcelService } from 'app/shared/excel/excel.service';
import jsPDF from 'jspdf';
import { ExcelHeader } from 'app/shared/excel/excel.types';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';

@Component({
    selector: 'user-list',
    templateUrl: './list.component.html',
    styles: [
        /* language=SCSS */
        `        
            .user-grid {
                grid-template-columns: 200px 200px auto  300px 150px 70px ;

                @screen sm {
                    grid-template-columns: 48px auto 112px 72px;
                }

                @screen md {
                    grid-template-columns:  50px 30px auto  50px 50px ;
                }

                @screen lg {
                    grid-template-columns: 200px 200px auto  300px 150px 70px ;
                }
            }
        `

    ],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserListComponent implements OnInit, OnDestroy {
    @ViewChild('matDrawer', { static: true }) matDrawer: MatDrawer;
    @ViewChild('filter', { static: true }) filter: ElementRef;
    sub: Subscription;
    overlayRef: OverlayRef | null;
    users$: Observable<User[]>;
    isLoading: boolean = false;
    showHeaderList: boolean = true;
    usersCount: number = 0;
    usersTableColumns: string[] = ['name', 'email', 'phoneNumber', 'job'];
    drawerMode: 'side' | 'over';
    searchInputControl: FormControl = new FormControl();
    selectedUser: User;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    @ViewChild(MatPaginator) private _paginator: MatPaginator;
    @ViewChild(MatSort) private _sort: MatSort;
    throttle = 300;
    scrollDistance = 1;
    scrollUpDistance = 2;
    direction = "";
    modalOpen = false;
    userInfo: User = new User();
    brands: Array<{ key: number, value: string }> = [];
    frmAdvancedSearch = new FormGroup({
        username: new FormControl(),
        firstName: new FormControl(),
        lastName: new FormControl(),
        email: new FormControl(),
        status: new FormControl(),

    });

    /**
     * Constructor
     */
    constructor(
        public overlay: Overlay,
        private _activatedRoute: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        private _userService: UserService,
        @Inject(DOCUMENT) private _document: any,
        private _formBuilder: FormBuilder,
        private _decimalPipe: DecimalPipe, public viewContainerRef: ViewContainerRef,
        private excelService: ExcelService,
        private _router: Router,
        private _fuseMediaWatcherService: FuseMediaWatcherService
    ) {
        this.userInfo.statusIdList = [];
        this.userInfo.statusIdList.push(1000001);
        this.selectedUser = new User();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {

        // Get the users
        this._userService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pagination: Paging) => {

                // Update the pagination
                this.userInfo.page = pagination;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
        this.users$ = this._userService.users$;
        this._userService.users$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((users: User[]) => {

                // Update the counts
                this.usersCount = users.length;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the user
        this._userService.user$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((user: User) => {

                // Update the selected user
                //this.selectedUser = user;

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

                if (!this.users$)
                    return;


                this._userService.users$.pipe(map(items => items.filter(x =>
                    x.firstName.toLowerCase().includes(this.filter.nativeElement.value) ||
                    x.lastName?.toLowerCase().includes(this.filter.nativeElement.value) ||
                    x.username.toLowerCase().includes(this.filter.nativeElement.value) ||
                    x.email.includes(this.filter.nativeElement.value) ||
                    x.statusDescription.toLowerCase().includes(this.filter.nativeElement.value)))).subscribe(elements => {
                        this.users$ = of(elements as User[]);
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
                this.createUser();
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

            // If the user changes the sort order...
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
                    this.userInfo.page.pageNumber = this._paginator.pageIndex;
                    this.userInfo.page.pageSize = this._paginator.pageSize;
                    this.userInfo.page.sort = this._sort.active;
                    this.userInfo.page.order = this._sort.direction;
                    return this._userService.getUsers(this.userInfo);
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
        // this.selectedUser = null;
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
     * Create user
     */
    createUser(): void {
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

        let obj: User = new User();
        this._userService.getUsers(obj);
    }
    exportTable() {
        let columns: Array<ExcelHeader> = new Array<ExcelHeader>();
        let obj: Array<User> = new Array<User>();
        let user: number = 0;
        let qty: number = 0;
        let date = formatDate(new Date(), 'yyyyMMdd_hhmmss', 'en');
        let fileName: string = 'User_'.concat(date.toString());

        columns.push({ basedColumnName: 'username', excelColumnName: 'Username' });
        columns.push({ basedColumnName: 'firstName', excelColumnName: 'First Name' });
        columns.push({ basedColumnName: 'lastName', excelColumnName: 'Last name' });
        columns.push({ basedColumnName: 'email', excelColumnName: 'Email' });
        columns.push({ basedColumnName: 'statusDescription', excelColumnName: 'Status' });

        this.users$.subscribe(items => items.forEach(element => {
            qty = qty + 1;
            obj.push(element);

        }));



        let footerData = [];

        footerData.push(['', '', '', 'QTY', qty]);

        this.excelService.exportAsExcelFile('User', '', columns, obj, footerData, fileName, 'Sheet1');

        obj = [];
    }
    download() {

        var pdf = new jsPDF('l');

        pdf.setFontSize(20);
        pdf.text('User', 14, 8);
        pdf.setFontSize(12);
        pdf.setTextColor(99);
        let header = [];
        let tableData = [];
        let footer = [];
        let user: number = 0;
        let qty: number = 0;
        let date = formatDate(new Date(), 'yyyyMMdd_hhmmss', 'en');
        let fileName: string = 'User_'.concat(date.concat('.pdf'));

        header = [{ header: 'Username', dataKey: 'username' },
        { header: 'First Name', dataKey: 'firstName' },
        { header: 'Last Name', dataKey: 'lastName' },
        { header: 'Email', dataKey: 'email' },
        { header: 'Status', dataKey: 'statusDescription' }];


        this.users$.subscribe(items => items.forEach(element => {
            qty = qty + 1;
            tableData.push([
                element.username, element.firstName, element.lastName,
                element.email, element.statusDescription
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
        this.userInfo.username = this.frmAdvancedSearch.controls["username"].value;
        this.userInfo.firstName = this.frmAdvancedSearch.controls["firstName"].value;
        this.userInfo.lastName = this.frmAdvancedSearch.controls["lastName"].value;
        this.userInfo.email = this.frmAdvancedSearch.controls["email"].value;
        this.userInfo.page.flag = true;
        this.userInfo.page.pageNumber = 0;
        this.userInfo.page.length = 0;
        this._userService.getUsers(this.userInfo).subscribe(() => {
            this.isLoading = false;
        });
    }

    setStatusValue(event: {
        isUserInput: any;
        source: { value: any; selected: any };
    }) {

        if (event.isUserInput) {
            if (event.source.value != 0 && event.source.selected) {
                this.userInfo.statusIdList.push(event.source.value);

            }
            else if (event.source.value != 0 && !event.source.selected) {
                const index: number = this.userInfo.statusIdList.indexOf(event.source.value);
                if (index !== -1)
                    this.userInfo.statusIdList.splice(index, 1);
                this.frmAdvancedSearch.controls["status"].setValue(this.userInfo.statusIdList);
            }
        }
    }

}
