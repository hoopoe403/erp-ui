import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { Organization } from 'app/modules/configuration/organization/organization/organization.types';
import { ApiHelperService } from '../../../../../environments/api-helper.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class OrganizationService {
    // Private
    private _data: BehaviorSubject<any> = new BehaviorSubject(null);

    /**
     * Constructor
     */

    private organizationUrl: string = 'configuration/organization/organization/';
    constructor(private _httpClient: HttpClient) {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------


    get data$(): Observable<any>
    {
        return this._data.asObservable();
    }



    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get organizations
     */
    getOrganizations(orgInfo: any): Observable<Organization[]> {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.organizationUrl + 'findByObj', orgInfo).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }

    create(Organization: Organization): Observable<Organization[]> {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.organizationUrl + 'create', Organization).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }

    edit(Organization: Organization): Observable<Organization[]> {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.organizationUrl + 'edit', Organization).pipe(
            tap((response: any) => {
                return response;
            })
        );
    }


    getOrganizationById(id: string): any {
        return this._httpClient.get(ApiHelperService.BASE_URL + this.organizationUrl + id).pipe(
            map((organization) => {

                return organization;
            }),
            switchMap((organization) => {

                if (!organization) {
                    return throwError('Could not found course with id of ' + id + '!');
                }

                return of(organization);
            })
        );
    }

    getData(): Observable<any> {
        return this._httpClient.post(ApiHelperService.BASE_URL + this.organizationUrl + 'findByObj', new Organization).pipe(
            tap((response: any) => {
                this._data.next(response);
            })
        );
    }
}
