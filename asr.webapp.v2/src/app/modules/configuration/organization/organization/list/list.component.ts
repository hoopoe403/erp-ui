import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { fromEvent, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';
import { fuseAnimations } from "../../../../../../@fuse/animations";
import { Router } from "@angular/router";
import { OrganizationService } from "../organization.service";
import { Organization } from "../organization.types";

@Component({
    selector: 'organization-list',
    templateUrl: './list.component.html',
    styleUrls: ['./list.component.scss'],
    styles: [
        /* language=SCSS */
        `
            .organization-grid {
                grid-template-columns:112px 300px 40px;

                @screen sm {
                    grid-template-columns: 112px auto 112px 72px;
                }

                @screen md {
                    grid-template-columns: 112px auto 200px 200px 96px 96px 72px;
                }

                @screen lg {
                    grid-template-columns: 112px auto 200px 200px 96px 96px 72px;
                }
            }
        `
    ],
    animations: fuseAnimations,
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrganizationListComponent implements OnInit, OnDestroy {
    selection = new SelectionModel<any>(true, []);


    @ViewChild(MatPaginator, { static: true })
    paginator: MatPaginator;

    @ViewChild('filter', { static: true })
    filter: ElementRef;

    @ViewChild(MatSort, { static: true })
    sort: MatSort;

    // Private
    private _unsubscribeAll: Subject<any>;
    isLoading: boolean;

    constructor(private orgService: OrganizationService, private router: Router,
        private _changeDetectorRef: ChangeDetectorRef) {
        // Set the private defaults
        this._unsubscribeAll = new Subject();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------
    isOverlayOpen: boolean = true;
    selectedInfoRow: Organization = new Organization;

    organizations$: Array<Organization> = [];
    organizations: Array<Organization> = [];
    /**
     * On init
     */
    ngOnInit(): void {
        this.isLoading = true;

        this.getOrganizations(new Organization);

        fromEvent(this.filter.nativeElement, 'keyup')
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(150),
                distinctUntilChanged()
            )
            .subscribe(() => {
                if (!this.organizations) {
                    return;
                }
                this.organizations$ = this.organizations.filter(item =>
                    item.organizationName.toLowerCase().includes(this.filter.nativeElement.value.toLowerCase()));
            });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }
    private getOrganizations(orgInfo: Organization) {
        this.orgService.getOrganizations(orgInfo)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((organization: any) => {
                this.organizations$ = organization.data;
                this.organizations = organization.data;
                this._changeDetectorRef.markForCheck();
                this.isLoading = false;
            });
    }

}


